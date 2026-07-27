import { calcularCustoDeAgendamento, montarAgendamentos } from '../agendamentoPuro';
import type { RemedioComHorarios, Horario } from '../../../types/domain';

/**
 * Testes obrigatórios 22.1.1 e 22.1.2: `calcularCustoDeAgendamento` e
 * `montarAgendamentos` são as duas funções onde um erro produz lembrete
 * que não toca — silenciosamente, porque o iOS descarta o excedente da
 * cota de 64 sem avisar (11.4). Por isso são testadas isoladamente,
 * cobrindo todas as frequências, mesmo `intervalo_dias` (fora da UI por
 * decisão 25.8, mas o cálculo continua correto no banco).
 */

let proximoIdHorario = 1;

function horario(horaMinuto: string): Horario {
  return {
    id: proximoIdHorario++,
    remedioId: 1,
    horaMinuto,
    ordem: 0,
    criadoEm: '2026-07-01 00:00:00',
  };
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

describe('calcularCustoDeAgendamento (22.1.1)', () => {
  test('quando_precisar não consome nada da cota', () => {
    const r = remedio({ frequencia: 'quando_precisar', horarios: [] });
    expect(calcularCustoDeAgendamento([r])).toBe(0);
  });

  test('diario custa 1 por horário', () => {
    const r = remedio({ frequencia: 'diario', horarios: [horario('08:00'), horario('20:00')] });
    expect(calcularCustoDeAgendamento([r])).toBe(2);
  });

  test('dias_semana multiplica dias × horários', () => {
    const r = remedio({
      frequencia: 'dias_semana',
      diasSemana: '246', // Seg, Qua, Sex
      horarios: [horario('08:00'), horario('20:00')],
    });
    expect(calcularCustoDeAgendamento([r])).toBe(6);
  });

  test('intervalo_dias custa ⌈30/N⌉ × horários', () => {
    const r = remedio({ frequencia: 'intervalo_dias', intervaloDias: 3, horarios: [horario('09:00')] });
    // ⌈30/3⌉ = 10
    expect(calcularCustoDeAgendamento([r])).toBe(10);
  });

  test('remédio com lembrete_ativo desligado não custa nada, mesmo diário', () => {
    const r = remedio({ frequencia: 'diario', lembreteAtivo: false });
    expect(calcularCustoDeAgendamento([r])).toBe(0);
  });

  test('soma o custo de vários remédios', () => {
    const a = remedio({ frequencia: 'diario', horarios: [horario('08:00')] });
    const b = remedio({ frequencia: 'dias_semana', diasSemana: '1234567', horarios: [horario('12:00')] });
    expect(calcularCustoDeAgendamento([a, b])).toBe(1 + 7);
  });
});

describe('montarAgendamentos (22.1.2)', () => {
  test('quando_precisar não gera nenhum agendamento', () => {
    const r = remedio({ frequencia: 'quando_precisar', horarios: [] });
    expect(montarAgendamentos(r)).toEqual([]);
  });

  test('lembrete_ativo desligado não gera nenhum agendamento', () => {
    const r = remedio({ frequencia: 'diario', lembreteAtivo: false });
    expect(montarAgendamentos(r)).toEqual([]);
  });

  test('diario gera um gatilho repetitivo por horário', () => {
    const h1 = horario('08:00');
    const h2 = horario('20:30');
    const r = remedio({ frequencia: 'diario', horarios: [h1, h2] });
    const agendamentos = montarAgendamentos(r);

    expect(agendamentos).toHaveLength(2);
    expect(agendamentos[0]).toMatchObject({ horarioId: h1.id, gatilho: { tipo: 'diario', hour: 8, minute: 0 } });
    expect(agendamentos[1]).toMatchObject({ horarioId: h2.id, gatilho: { tipo: 'diario', hour: 20, minute: 30 } });
  });

  test('dias_semana gera um gatilho por combinação dia × horário, com o weekday correto (11.2)', () => {
    const h = horario('08:00');
    const r = remedio({ frequencia: 'dias_semana', diasSemana: '246', horarios: [h] });
    const agendamentos = montarAgendamentos(r);

    expect(agendamentos).toHaveLength(3);
    expect(agendamentos.map((a) => (a.gatilho.tipo === 'dias_semana' ? a.gatilho.weekday : null))).toEqual([2, 4, 6]);
    for (const a of agendamentos) {
      expect(a.gatilho).toMatchObject({ tipo: 'dias_semana', hour: 8, minute: 0 });
      expect(a.horarioId).toBe(h.id);
    }
  });

  test('intervalo_dias gera ⌈30/N⌉ datas espaçadas de N em N dias', () => {
    const h = horario('09:00');
    const r = remedio({
      frequencia: 'intervalo_dias',
      intervaloDias: 3,
      criadoEm: '2026-07-01 00:00:00',
      horarios: [h],
    });
    const agendamentos = montarAgendamentos(r);

    expect(agendamentos).toHaveLength(10); // ⌈30/3⌉

    const datas = agendamentos.map((a) => (a.gatilho.tipo === 'data' ? new Date(a.gatilho.data) : null));
    for (let i = 1; i < datas.length; i++) {
      const diffDias = (datas[i]!.getTime() - datas[i - 1]!.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDias).toBeCloseTo(3, 5);
    }
    expect(datas[0]!.getHours()).toBe(9);
  });
});
