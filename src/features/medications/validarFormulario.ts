import { TEXTOS } from '../../constants/textos';
import type { Cor, Forma } from '../../types/domain';

/**
 * Frequências oferecidas no formulário (8.2, bloco 4). `intervalo_dias`
 * não entra na UI — decisão registrada na pergunta 25.8: ninguém que o
 * usuário conhece usa "a cada X dias" de fato, então o bloco 4b do spec
 * (stepper de 2 a 30 dias) não foi implementado. O banco continua
 * aceitando o valor (seção 7 é literal), só a interface não oferece.
 */
export type FrequenciaFormulario = 'diario' | 'dias_semana' | 'quando_precisar';

export interface EstadoFormulario {
  nome: string;
  dose: string;
  forma: Forma;
  frequencia: FrequenciaFormulario;
  diasSemana: string;
  horarios: string[];
  lembreteAtivo: boolean;
  observacao: string;
  cor: Cor;
}

export interface ErrosFormulario {
  nome?: string;
  diasSemana?: string;
  horarios?: string;
}

/**
 * Valida o formulário de cadastro/edição de remédio (8.2).
 *
 * Recebe: o estado atual do formulário.
 * Devolve: os erros encontrados (objeto vazio = válido).
 *
 * Implementa os critérios de aceite de 8.2: nome vazio bloqueia salvar;
 * "Alguns dias da semana" exige pelo menos um dia marcado (11.3); toda
 * frequência exceto `quando_precisar` exige pelo menos um horário (11.1).
 * A validação só é chamada ao tocar em Salvar — nunca durante a digitação.
 */
export function validarFormulario(estado: EstadoFormulario): ErrosFormulario {
  const erros: ErrosFormulario = {};

  if (estado.nome.trim().length === 0) {
    erros.nome = TEXTOS.cadastro.erroNomeVazio;
  }

  if (estado.frequencia === 'dias_semana' && estado.diasSemana.length === 0) {
    erros.diasSemana = TEXTOS.cadastro.erroSemDiaSemana;
  }

  if (estado.frequencia !== 'quando_precisar' && estado.horarios.length === 0) {
    erros.horarios = TEXTOS.cadastro.erroSemHorario;
  }

  return erros;
}
