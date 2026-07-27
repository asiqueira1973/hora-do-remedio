import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Teste obrigatório 22.1.5: constraints do banco (7.2/7.3) — rejeitar
 * `frequencia='diario'` com `intervalo_dias` preenchido, rejeitar horário
 * duplicado, e cascade funcionando.
 *
 * Roda as migrations SQL **reais** (as mesmas que `drizzle-kit generate`
 * escreve e que o app empacota) num SQLite em memória via `node:sqlite`
 * — não expo-sqlite, que não tem contraparte executável fora do
 * dispositivo/simulador. O que se testa aqui é a DDL gerada, idêntica à
 * que o app aplica.
 */

function aplicarMigrations(db: InstanceType<typeof DatabaseSync>) {
  const dir = join(__dirname, '..', 'migrations');
  const migracoes = ['0000_simple_tenebrous.sql', '0001_triggers.sql'];
  for (const arquivo of migracoes) {
    const sql = readFileSync(join(dir, arquivo), 'utf-8');
    for (const trecho of sql.split('--> statement-breakpoint')) {
      const comando = trecho.trim();
      if (comando) db.exec(comando);
    }
  }
}

function novoBanco(): InstanceType<typeof DatabaseSync> {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  aplicarMigrations(db);
  return db;
}

function inserirRemedio(db: InstanceType<typeof DatabaseSync>, campos: Record<string, string | number | null>) {
  const colunas = Object.keys(campos);
  const valores = Object.values(campos);
  const placeholders = colunas.map(() => '?').join(', ');
  db.prepare(`INSERT INTO remedios (${colunas.join(', ')}) VALUES (${placeholders})`).run(...valores);
}

test('rejeita frequencia=diario com intervalo_dias preenchido (ck_remedios_intervalo_coerente)', () => {
  const db = novoBanco();
  expect(() =>
    inserirRemedio(db, { nome: 'Teste', frequencia: 'diario', intervalo_dias: 3, cor: 'coral' }),
  ).toThrow(/CHECK constraint failed/);
});

test('aceita frequencia=intervalo_dias com intervalo_dias entre 2 e 30', () => {
  const db = novoBanco();
  expect(() =>
    inserirRemedio(db, { nome: 'Teste', frequencia: 'intervalo_dias', intervalo_dias: 3, cor: 'coral' }),
  ).not.toThrow();
});

test('rejeita horário duplicado no mesmo remédio (uq_horarios_remedio_hora)', () => {
  const db = novoBanco();
  inserirRemedio(db, { id: 1, nome: 'Teste', frequencia: 'diario', cor: 'coral' });
  db.prepare("INSERT INTO horarios (remedio_id, hora_minuto) VALUES (1, '08:00')").run();
  expect(() => db.prepare("INSERT INTO horarios (remedio_id, hora_minuto) VALUES (1, '08:00')").run()).toThrow(
    /UNIQUE constraint failed/,
  );
});

test('cascade: apagar o remédio apaga os horários e as notificações agendadas (7.3/7.4)', () => {
  const db = novoBanco();
  inserirRemedio(db, { id: 1, nome: 'Teste', frequencia: 'diario', cor: 'coral' });
  db.prepare("INSERT INTO horarios (id, remedio_id, hora_minuto) VALUES (1, 1, '08:00')").run();
  db.prepare("INSERT INTO notificacoes_agendadas (horario_id, identificador_ios) VALUES (1, 'abc-123')").run();

  db.prepare('DELETE FROM remedios WHERE id = 1').run();

  const horarios = db.prepare('SELECT * FROM horarios').all();
  const notificacoes = db.prepare('SELECT * FROM notificacoes_agendadas').all();
  expect(horarios).toHaveLength(0);
  expect(notificacoes).toHaveLength(0);
});

test('rejeita horário fora do formato HH:MM (ck_horarios_formato)', () => {
  const db = novoBanco();
  inserirRemedio(db, { id: 1, nome: 'Teste', frequencia: 'diario', cor: 'coral' });
  expect(() => db.prepare("INSERT INTO horarios (remedio_id, hora_minuto) VALUES (1, '8:00')").run()).toThrow(
    /CHECK constraint failed/,
  );
});

test('trigger grava atualizado_em em cada UPDATE de remedios', () => {
  const db = novoBanco();
  inserirRemedio(db, { id: 1, nome: 'Teste', frequencia: 'diario', cor: 'coral', atualizado_em: '2000-01-01 00:00:00' });
  db.prepare("UPDATE remedios SET nome = 'Teste 2' WHERE id = 1").run();
  const linha = db.prepare('SELECT atualizado_em FROM remedios WHERE id = 1').get() as { atualizado_em: string };
  expect(linha.atualizado_em).not.toBe('2000-01-01 00:00:00');
});
