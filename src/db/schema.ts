/**
 * Schema do banco local SQLite, em Drizzle ORM.
 *
 * Recebe: nada — é a definição estática das tabelas.
 * Devolve: as tabelas `remedios`, `horarios`, `notificacoes_agendadas` e
 * `preferencias`, com constraints e índices nomeados.
 *
 * Implementa a seção 7 do spec (Modelo de dados) e a convenção de idioma da
 * seção 18.1: tabelas, colunas, enums, constraints e índices em português,
 * snake_case. As duas triggers de `atualizado_em` (7.7) não são modeladas
 * aqui porque o Drizzle não representa CREATE TRIGGER em schema — elas vivem
 * numa migration SQL própria (ver src/db/migrations/0001_triggers.sql).
 */

import { relations, sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

/**
 * Monta a lista `'a', 'b', 'c'` para dentro de um `IN (...)` de CHECK.
 *
 * Recebe: os valores literais do enum.
 * Devolve: fragmento SQL bruto (não parametrizado).
 *
 * Necessário porque `sql\`${valor}\`` gera um bind parameter (`?`), e
 * SQLite não aceita parâmetro dentro da definição de uma CHECK constraint
 * — precisa ser texto literal na própria DDL.
 */
function listaEnumSql(valores: readonly string[]) {
  return sql.raw(valores.map((v) => `'${v}'`).join(', '));
}

/** Valores aceitos por `remedios.forma` (7.6). */
export const FORMAS = [
  'comprimido',
  'capsula',
  'gotas',
  'xarope',
  'injecao',
  'pomada',
  'spray',
  'outro',
] as const;

/** Valores aceitos por `remedios.frequencia` (7.6). */
export const FREQUENCIAS = ['diario', 'dias_semana', 'intervalo_dias', 'quando_precisar'] as const;

/** Valores aceitos por `remedios.cor` (16.3). */
export const CORES = ['coral', 'azul', 'verde', 'amarelo', 'lilas', 'pessego'] as const;

/** Valores aceitos por `preferencias.escala_fonte` (16.2). */
export const ESCALAS_FONTE = ['grande', 'gigante'] as const;

/**
 * O remédio que a pessoa toma (7.2). Uma linha por medicamento, não por dose.
 */
export const remedios = sqliteTable(
  'remedios',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    nome: text('nome').notNull(),
    dose: text('dose'),
    forma: text('forma').notNull().default('comprimido'),
    frequencia: text('frequencia').notNull().default('diario'),
    intervaloDias: integer('intervalo_dias'),
    diasSemana: text('dias_semana'),
    observacao: text('observacao'),
    lembreteAtivo: integer('lembrete_ativo').notNull().default(1),
    cor: text('cor').notNull(),
    arquivadoEm: text('arquivado_em'),
    criadoEm: text('criado_em')
      .notNull()
      .default(sql`(datetime('now'))`),
    atualizadoEm: text('atualizado_em')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    check('ck_remedios_nome_nao_vazio', sql`length(trim(${t.nome})) BETWEEN 1 AND 60`),
    check('ck_remedios_forma', sql`${t.forma} IN (${listaEnumSql(FORMAS)})`),
    check('ck_remedios_frequencia', sql`${t.frequencia} IN (${listaEnumSql(FREQUENCIAS)})`),
    check('ck_remedios_cor', sql`${t.cor} IN (${listaEnumSql(CORES)})`),
    check(
      'ck_remedios_intervalo_coerente',
      sql`(${t.frequencia} = 'intervalo_dias' AND ${t.intervaloDias} BETWEEN 2 AND 30) OR (${t.frequencia} <> 'intervalo_dias' AND ${t.intervaloDias} IS NULL)`,
    ),
    check(
      'ck_remedios_dias_semana_coerente',
      sql`(${t.frequencia} = 'dias_semana' AND ${t.diasSemana} GLOB '[1-7]*' AND length(${t.diasSemana}) BETWEEN 1 AND 7) OR (${t.frequencia} <> 'dias_semana' AND ${t.diasSemana} IS NULL)`,
    ),
    check('ck_remedios_lembrete_ativo', sql`${t.lembreteAtivo} IN (0, 1)`),
    index('idx_remedios_ativos').on(t.arquivadoEm),
  ],
);

/**
 * O horário do dia em que um remédio é tomado (7.3). Uma linha por horário.
 */
export const horarios = sqliteTable(
  'horarios',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    remedioId: integer('remedio_id')
      .notNull()
      .references(() => remedios.id, { onDelete: 'cascade' }),
    horaMinuto: text('hora_minuto').notNull(),
    ordem: integer('ordem').notNull().default(0),
    criadoEm: text('criado_em')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    unique('uq_horarios_remedio_hora').on(t.remedioId, t.horaMinuto),
    check('ck_horarios_formato', sql`${t.horaMinuto} GLOB '[0-2][0-9]:[0-5][0-9]'`),
    index('idx_horarios_remedio').on(t.remedioId),
    index('idx_horarios_hora').on(t.horaMinuto),
  ],
);

/**
 * Espelho local do que foi realmente agendado no iOS (7.4). Tabela
 * derivada — existe para saber o que cancelar e para respeitar a cota de
 * 64 notificações (11.4). Nunca é fonte de verdade sobre o que o usuário
 * quer, só sobre o que o sistema já fez.
 */
export const notificacoesAgendadas = sqliteTable(
  'notificacoes_agendadas',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    horarioId: integer('horario_id')
      .notNull()
      .references(() => horarios.id, { onDelete: 'cascade' }),
    identificadorIos: text('identificador_ios').notNull(),
    disparoEm: text('disparo_em'),
    criadoEm: text('criado_em')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    unique('uq_notificacoes_identificador').on(t.identificadorIos),
    index('idx_notificacoes_horario').on(t.horarioId),
    index('idx_notificacoes_disparo').on(t.disparoEm),
  ],
);

/**
 * Preferências do app (7.5). Linha única, `id` sempre 1. Existe como tabela
 * (e não em AsyncStorage) para sobreviver junto do banco em backup/restore.
 */
export const preferencias = sqliteTable(
  'preferencias',
  {
    id: integer('id').primaryKey().default(1),
    escalaFonte: text('escala_fonte').notNull().default('grande'),
    somLembrete: integer('som_lembrete').notNull().default(1),
    onboardingConcluidoEm: text('onboarding_concluido_em'),
    atualizadoEm: text('atualizado_em')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    check('ck_preferencias_linha_unica', sql`${t.id} = 1`),
    check('ck_preferencias_escala', sql`${t.escalaFonte} IN (${listaEnumSql(ESCALAS_FONTE)})`),
    check('ck_preferencias_som', sql`${t.somLembrete} IN (0, 1)`),
  ],
);

/**
 * Relações entre as tabelas (só para a API relacional do Drizzle —
 * `db.query...with:{...}`). Não gera SQL nenhum; a cardinalidade real é
 * garantida pelas foreign keys da seção 7.
 */
export const remediosRelations = relations(remedios, ({ many }) => ({
  horarios: many(horarios),
}));

export const horariosRelations = relations(horarios, ({ one, many }) => ({
  remedio: one(remedios, { fields: [horarios.remedioId], references: [remedios.id] }),
  notificacoesAgendadas: many(notificacoesAgendadas),
}));

export const notificacoesAgendadasRelations = relations(notificacoesAgendadas, ({ one }) => ({
  horario: one(horarios, { fields: [notificacoesAgendadas.horarioId], references: [horarios.id] }),
}));
