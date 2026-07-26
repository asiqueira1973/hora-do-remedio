import type { Remedio } from '../../types/domain';

/** Dígito → abreviação de 3 letras do dia da semana (11.2). */
const ROTULO_DIA_SEMANA: Record<string, string> = {
  '1': 'Dom',
  '2': 'Seg',
  '3': 'Ter',
  '4': 'Qua',
  '5': 'Qui',
  '6': 'Sex',
  '7': 'Sáb',
};

/**
 * Decodifica `dias_semana` ("246") para o texto exibido ("Seg, Qua, Sex").
 *
 * Recebe: a string de dígitos de `remedios.dias_semana` (7.2).
 * Devolve: os rótulos de 3 letras separados por vírgula, na ordem em que
 * os dígitos aparecem (que já é crescente por construção — 11.2).
 *
 * Implementa a regra 11.2: dígito 1 é domingo, 7 é sábado.
 */
export function formatarDiasSemana(diasSemana: string): string {
  return diasSemana
    .split('')
    .map((digito) => ROTULO_DIA_SEMANA[digito] ?? '')
    .join(', ');
}

/**
 * Texto de frequência para o card (8.1) e para a exportação (14.1.7).
 *
 * Recebe: o remédio (frequência + campos dependentes).
 * Devolve: o texto a mostrar, ou `null` quando nada deve ser escrito.
 *
 * Implementa a regra da 8.1: "Diário não escreve nada — é o caso comum e
 * ocuparia espaço à toa" e a 11.1 (quando_precisar também não escreve
 * frequência, porque já tem bloco próprio).
 */
export function formatarFrequencia(remedio: Pick<Remedio, 'frequencia' | 'diasSemana' | 'intervaloDias'>): string | null {
  switch (remedio.frequencia) {
    case 'diario':
    case 'quando_precisar':
      return null;
    case 'dias_semana':
      return remedio.diasSemana ? formatarDiasSemana(remedio.diasSemana) : null;
    case 'intervalo_dias':
      return remedio.intervaloDias ? `A cada ${remedio.intervaloDias} dias` : null;
    default:
      return null;
  }
}
