import { agruparPorHorario } from '../agruparPorHorario';
import type { RemedioComHorarios, Horario } from '../../../types/domain';

/**
 * Teste obrigatório 22.1.7: regras de agrupamento e ordenação da Home
 * (11.7). Um erro aqui esconde um remédio da lista sem avisar ninguém.
 */

let proximoIdHorario = 1;
let proximoIdRemedio = 1;

function horario(horaMinuto: string): Horario {
  return { id: proximoIdHorario++, remedioId: 1, horaMinuto, ordem: 0, criadoEm: '2026-07-01 00:00:00' };
}

function remedio(sobrescreve: Partial<RemedioComHorarios>): RemedioComHorarios {
  return {
    id: proximoIdRemedio++,
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

test('agrupa por hora_minuto em ordem crescente (11.7.1)', () => {
  const a = remedio({ nome: 'Omeprazol', horarios: [horario('14:00')] });
  const b = remedio({ nome: 'Losartana', horarios: [horario('08:00')] });
  const { grupos } = agruparPorHorario([a, b]);
  expect(grupos.map((g) => g.horaMinuto)).toEqual(['08:00', '14:00']);
});

test('um remédio com N horários aparece em N grupos (11.7.2)', () => {
  const r = remedio({ nome: 'Metformina', horarios: [horario('08:00'), horario('14:00'), horario('20:00')] });
  const { grupos } = agruparPorHorario([r]);
  expect(grupos).toHaveLength(3);
  for (const grupo of grupos) {
    expect(grupo.itens.map((i) => i.remedio.nome)).toEqual(['Metformina']);
  }
});

test('ordena por nome dentro do grupo, ignorando maiúscula e acento (11.7.3)', () => {
  const mesmoHorario = () => horario('08:00');
  const remedios = [
    remedio({ nome: 'Ácido fólico', horarios: [mesmoHorario()] }),
    remedio({ nome: 'zolpidem', horarios: [mesmoHorario()] }),
    remedio({ nome: 'Aspirina', horarios: [mesmoHorario()] }),
  ];
  const { grupos } = agruparPorHorario(remedios);
  expect(grupos[0].itens.map((i) => i.remedio.nome)).toEqual(['Ácido fólico', 'Aspirina', 'zolpidem']);
});

test('"quando precisar" fica fora dos grupos por horário, ordenado por nome (11.7.4)', () => {
  const diario = remedio({ nome: 'Losartana', horarios: [horario('08:00')] });
  const b = remedio({ nome: 'Dipirona', frequencia: 'quando_precisar', horarios: [] });
  const a = remedio({ nome: 'Buscopan', frequencia: 'quando_precisar', horarios: [] });

  const { grupos, quandoPrecisar } = agruparPorHorario([diario, b, a]);

  expect(grupos).toHaveLength(1);
  expect(quandoPrecisar.map((r) => r.nome)).toEqual(['Buscopan', 'Dipirona']);
});

test('não recebe a hora atual — mostra todos os horários do dia, inclusive passados (11.7.5)', () => {
  expect(agruparPorHorario.length).toBe(1);
});
