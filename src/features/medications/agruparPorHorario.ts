import type { Horario, RemedioComHorarios } from '../../types/domain';

export type FaixaHorario = 'madrugada' | 'manha' | 'tarde' | 'noite';

/** Rótulo em português de cada faixa, para o cabeçalho de grupo (8.1). */
export const ROTULOS_FAIXA: Record<FaixaHorario, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export interface ItemGrupo {
  remedio: RemedioComHorarios;
  horario: Horario;
}

export interface GrupoHorario {
  horaMinuto: string;
  faixa: FaixaHorario;
  itens: ItemGrupo[];
}

export interface ListaAgrupada {
  grupos: GrupoHorario[];
  quandoPrecisar: RemedioComHorarios[];
}

/**
 * Determina a faixa do dia de um horário "HH:MM".
 *
 * Recebe: `horaMinuto` no formato "HH:MM".
 * Devolve: a faixa (madrugada/manhã/tarde/noite).
 *
 * Implementa a tabela de faixas da seção 8.1: 00:00–04:59 madrugada,
 * 05:00–11:59 manhã, 12:00–17:59 tarde, 18:00–23:59 noite.
 */
export function obterFaixaGrupo(horaMinuto: string): FaixaHorario {
  const hora = Number(horaMinuto.slice(0, 2));
  if (hora < 5) return 'madrugada';
  if (hora < 12) return 'manha';
  if (hora < 18) return 'tarde';
  return 'noite';
}

/** Remove acento e caixa para comparação alfabética (11.7.3). */
function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function compararNomes(a: string, b: string): number {
  const na = normalizarNome(a);
  const nb = normalizarNome(b);
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}

/**
 * Agrupa e ordena os remédios ativos para a Home (8.1).
 *
 * Recebe: a lista de remédios ativos com seus horários.
 * Devolve: os grupos por horário (ordem crescente, itens em ordem
 * alfabética dentro do grupo) e o bloco "Quando precisar" (ordenado por
 * nome), separado dos grupos.
 *
 * Implementa a regra 11.7 por completo: 11.7.1 (agrupa por hora_minuto
 * crescente), 11.7.2 (um remédio com N horários aparece N vezes),
 * 11.7.3 (ordem alfabética dentro do grupo, sem diferenciar
 * maiúscula/acento), 11.7.4 (quando_precisar fora dos grupos) e 11.7.5
 * (mostra todos os horários do dia, não só os futuros — por isso esta
 * função não recebe a hora atual, de propósito).
 */
export function agruparPorHorario(remedios: RemedioComHorarios[]): ListaAgrupada {
  const porHorario = new Map<string, ItemGrupo[]>();
  const quandoPrecisar: RemedioComHorarios[] = [];

  for (const remedio of remedios) {
    if (remedio.frequencia === 'quando_precisar') {
      quandoPrecisar.push(remedio);
      continue;
    }
    for (const horario of remedio.horarios) {
      const itens = porHorario.get(horario.horaMinuto) ?? [];
      itens.push({ remedio, horario });
      porHorario.set(horario.horaMinuto, itens);
    }
  }

  const grupos: GrupoHorario[] = Array.from(porHorario.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([horaMinuto, itens]) => ({
      horaMinuto,
      faixa: obterFaixaGrupo(horaMinuto),
      itens: [...itens].sort((x, y) => compararNomes(x.remedio.nome, y.remedio.nome)),
    }));

  quandoPrecisar.sort((a, b) => compararNomes(a.nome, b.nome));

  return { grupos, quandoPrecisar };
}
