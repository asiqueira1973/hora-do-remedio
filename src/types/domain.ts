/**
 * Tipos de domínio do app.
 *
 * Implementa a seção 18.1 do spec: as propriedades mantêm o nome do
 * domínio em português (camelCase), espelhando as colunas do banco (seção
 * 7) — é a fronteira de idioma descrita em 13-A.1. O resto do código
 * (funções, componentes) manipula estes tipos em inglês.
 */

import type { CORES, ESCALAS_FONTE, FORMAS, FREQUENCIAS } from '../db/schema';

export type Forma = (typeof FORMAS)[number];
export type Frequencia = (typeof FREQUENCIAS)[number];
export type Cor = (typeof CORES)[number];
export type EscalaFonte = (typeof ESCALAS_FONTE)[number];

/** Espelha a tabela `horarios` (7.3). */
export interface Horario {
  id: number;
  remedioId: number;
  horaMinuto: string;
  ordem: number;
  criadoEm: string;
}

/** Espelha a tabela `remedios` (7.2). */
export interface Remedio {
  id: number;
  nome: string;
  dose: string | null;
  forma: Forma;
  frequencia: Frequencia;
  intervaloDias: number | null;
  diasSemana: string | null;
  observacao: string | null;
  lembreteAtivo: boolean;
  cor: Cor;
  arquivadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

/** Um remédio com seus horários carregados — a unidade de trabalho da Home (8.1) e do serviço de lembretes (13-A.2). */
export interface RemedioComHorarios extends Remedio {
  horarios: Horario[];
}

/** Espelha a tabela `notificacoes_agendadas` (7.4). */
export interface NotificacaoAgendada {
  id: number;
  horarioId: number;
  identificadorIos: string;
  disparoEm: string | null;
  criadoEm: string;
}

/** Espelha a linha única de `preferencias` (7.5). */
export interface Preferencias {
  id: 1;
  escalaFonte: EscalaFonte;
  somLembrete: boolean;
  onboardingConcluidoEm: string | null;
  atualizadoEm: string;
}

/**
 * Entrada para `repositorioRemedios.criar` e `.atualizar` (13-A.1).
 * `horarios` é a lista de "HH:MM" a gravar — o repositório reescreve as
 * linhas de `horarios` inteiras a cada chamada, nunca faz merge parcial.
 */
export interface NovoRemedio {
  nome: string;
  dose: string | null;
  forma: Forma;
  frequencia: Frequencia;
  intervaloDias: number | null;
  diasSemana: string | null;
  observacao: string | null;
  lembreteAtivo: boolean;
  cor: Cor;
  horarios: string[];
}
