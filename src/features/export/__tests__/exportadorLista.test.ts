import { gerarTexto } from '../exportadorLista';
import type { RemedioComHorarios, Horario } from '../../../types/domain';

/**
 * Teste obrigatório 22.1.3: `gerarTexto` comparado **literalmente**, char
 * por char, com o exemplo da seção 14.1 — o critério de aceite de 8.5 não
 * aceita "parecido", só idêntico. Cobre também os casos da 22.1.3: sem
 * dose, sem observação, só "quando precisar" e lista vazia.
 */

let proximoIdHorario = 1;

function horario(horaMinuto: string): Horario {
  return { id: proximoIdHorario++, remedioId: 1, horaMinuto, ordem: 0, criadoEm: '2026-07-01 00:00:00' };
}

function remedio(sobrescreve: Partial<RemedioComHorarios>): RemedioComHorarios {
  return {
    id: 1,
    nome: 'Remédio Teste',
    dose: null,
    forma: 'comprimido',
    frequencia: 'diario',
    intervaloDias: null,
    diasSemana: null,
    observacao: null,
    lembreteAtivo: true,
    cor: 'coral',
    arquivadoEm: null,
    criadoEm: '2026-07-01 00:00:00',
    atualizadoEm: '2026-07-01 00:00:00',
    horarios: [horario('08:00')],
    ...sobrescreve,
  };
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-07-26T10:00:00'));
});

afterEach(() => {
  jest.useRealTimers();
});

test('reproduz o exemplo da 14.1 caractere por caractere', () => {
  const losartana = remedio({ nome: 'Losartana', dose: '50mg', horarios: [horario('08:00')] });
  const metformina = remedio({
    nome: 'Metformina',
    dose: '850mg',
    observacao: 'Tomar junto com a comida',
    horarios: [horario('08:00')],
  });
  const omeprazol = remedio({ nome: 'Omeprazol', dose: '20mg', horarios: [horario('14:00')] });
  const sinvastatina = remedio({
    nome: 'Sinvastatina',
    dose: '20mg',
    frequencia: 'dias_semana',
    diasSemana: '246', // Seg, Qua, Sex
    horarios: [horario('20:00')],
  });
  const dipirona = remedio({
    nome: 'Dipirona',
    dose: '1 comprimido',
    frequencia: 'quando_precisar',
    observacao: 'Só se tiver dor',
    horarios: [],
  });

  const esperado = [
    '💊 MEUS REMÉDIOS',
    'Atualizado em 26/07/2026',
    '🌅 MANHÃ — 08:00',
    '• Losartana — 50mg',
    '• Metformina — 850mg',
    '  ⚠️ Tomar junto com a comida',
    '🌇 TARDE — 14:00',
    '• Omeprazol — 20mg',
    '🌙 NOITE — 20:00',
    '• Sinvastatina — 20mg',
    '  📅 Seg, Qua, Sex',
    '💊 QUANDO PRECISAR',
    '• Dipirona — 1 comprimido',
    '  ⚠️ Só se tiver dor',
    '—',
    'Lista gerada pelo app Hora do Remédio',
  ].join('\n\n');

  expect(gerarTexto([losartana, metformina, omeprazol, sinvastatina, dipirona])).toBe(esperado);
});

test('remédio sem dose não escreve travessão (14.1.5)', () => {
  const r = remedio({ nome: 'Vitamina D', dose: null, horarios: [horario('08:00')] });
  const texto = gerarTexto([r]);
  expect(texto).toContain('• Vitamina D');
  expect(texto).not.toContain('Vitamina D —');
});

test('remédio sem observação não escreve linha de ⚠️', () => {
  const r = remedio({ nome: 'Vitamina D', observacao: null, horarios: [horario('08:00')] });
  const texto = gerarTexto([r]);
  expect(texto).not.toContain('⚠️');
});

test('só "quando precisar" gera cabeçalho, bloco quando_precisar e rodapé, sem grupo de horário', () => {
  const r = remedio({ nome: 'Dipirona', dose: '1 comprimido', frequencia: 'quando_precisar', horarios: [] });
  const texto = gerarTexto([r]);

  expect(texto).toBe(
    [
      '💊 MEUS REMÉDIOS',
      'Atualizado em 26/07/2026',
      '💊 QUANDO PRECISAR',
      '• Dipirona — 1 comprimido',
      '—',
      'Lista gerada pelo app Hora do Remédio',
    ].join('\n\n'),
  );
});

test('lista vazia gera só cabeçalho e rodapé', () => {
  const texto = gerarTexto([]);
  expect(texto).toBe(['💊 MEUS REMÉDIOS', 'Atualizado em 26/07/2026', '—', 'Lista gerada pelo app Hora do Remédio'].join('\n\n'));
});
