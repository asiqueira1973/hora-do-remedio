import { formatarDiasSemana, formatarFrequencia } from '../formatarFrequencia';

/**
 * Teste obrigatório 22.1.4: codificação/decodificação de `dias_semana`
 * ("246" ↔ segunda/quarta/sexta). Um erro aqui é um deslocamento de um
 * dia inteiro, silencioso — a pessoa é avisada no dia errado.
 */
describe('formatarDiasSemana (22.1.4)', () => {
  test('"246" decodifica para Seg, Qua, Sex', () => {
    expect(formatarDiasSemana('246')).toBe('Seg, Qua, Sex');
  });

  test('dígito 1 é domingo, 7 é sábado (11.2)', () => {
    expect(formatarDiasSemana('1')).toBe('Dom');
    expect(formatarDiasSemana('7')).toBe('Sáb');
  });

  test('todos os 7 dias, na ordem', () => {
    expect(formatarDiasSemana('1234567')).toBe('Dom, Seg, Ter, Qua, Qui, Sex, Sáb');
  });
});

describe('formatarFrequencia', () => {
  test('diario não escreve nada', () => {
    expect(formatarFrequencia({ frequencia: 'diario', diasSemana: null, intervaloDias: null })).toBeNull();
  });

  test('quando_precisar não escreve nada', () => {
    expect(formatarFrequencia({ frequencia: 'quando_precisar', diasSemana: null, intervaloDias: null })).toBeNull();
  });

  test('dias_semana usa formatarDiasSemana', () => {
    expect(formatarFrequencia({ frequencia: 'dias_semana', diasSemana: '246', intervaloDias: null })).toBe(
      'Seg, Qua, Sex',
    );
  });

  test('intervalo_dias escreve "A cada N dias"', () => {
    expect(formatarFrequencia({ frequencia: 'intervalo_dias', diasSemana: null, intervaloDias: 3 })).toBe(
      'A cada 3 dias',
    );
  });
});
