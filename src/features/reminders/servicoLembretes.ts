import { eq, inArray } from 'drizzle-orm';
import * as Notifications from 'expo-notifications';

import { db } from '../../db/client';
import * as schema from '../../db/schema';
import { repositorioPreferencias } from '../../repositories/preferences';
import { TEXTOS } from '../../constants/textos';
import type { RemedioComHorarios } from '../../types/domain';
import { calcularCustoDeAgendamento, montarAgendamentos, type GatilhoAgendamento } from './agendamentoPuro';

export { calcularCustoDeAgendamento, montarAgendamentos, JANELA_DIAS_INTERVALO, COTA_NOTIFICACOES_IOS } from './agendamentoPuro';
export type { Agendamento, GatilhoAgendamento } from './agendamentoPuro';

/** Os 4 estados de permissão de notificação (12.3). */
export type EstadoPermissao = 'undetermined' | 'granted' | 'denied' | 'provisional';

/** Traduz nosso `GatilhoAgendamento` (puro) no trigger real do expo-notifications. */
export function paraGatilhoNativo(gatilho: GatilhoAgendamento): Notifications.SchedulableNotificationTriggerInput {
  switch (gatilho.tipo) {
    case 'diario':
      return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: gatilho.hour, minute: gatilho.minute };
    case 'dias_semana':
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: gatilho.weekday,
        hour: gatilho.hour,
        minute: gatilho.minute,
      };
    case 'data':
      return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(gatilho.data) };
  }
}

/**
 * Texto da notificação, conforme a tabela 15.3: título fixo, corpo com
 * nome e dose (ou só nome, sem dose).
 */
export function conteudoNotificacao(remedio: Pick<RemedioComHorarios, 'nome' | 'dose'>): { title: string; body: string } {
  return {
    title: TEXTOS.notificacao.titulo,
    body: remedio.dose ? `${remedio.nome} — ${remedio.dose}` : remedio.nome,
  };
}

/** Os 4 estados da 12.3, a partir da resposta nativa de permissão. */
function paraEstadoPermissao(resposta: Notifications.NotificationPermissionsStatus): EstadoPermissao {
  const status = resposta.ios?.status;
  if (status === Notifications.IosAuthorizationStatus.DENIED) return 'denied';
  if (status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'provisional';
  if (status === Notifications.IosAuthorizationStatus.AUTHORIZED || status === Notifications.IosAuthorizationStatus.EPHEMERAL) {
    return 'granted';
  }
  return 'undetermined';
}

/**
 * `servicoLembretes` — agendamento (13-A.2). Traduz remédios em
 * notificações reais do iOS e mantém `notificacoes_agendadas` (7.4)
 * espelhando o que foi pedido. `calcularCustoDeAgendamento` e
 * `montarAgendamentos` são reexportadas de `agendamentoPuro.ts`, que não
 * importa banco nem módulo nativo nenhum — são as duas funções puras que
 * o teste 22.1.1/22.1.2 cobre isoladamente.
 */
export const servicoLembretes = {
  /**
   * Estado atual da permissão de notificação (12.3), sem pedir nada.
   *
   * Recebe: nada.
   * Devolve: um dos 4 estados — `undetermined` significa que o app ainda
   * não pediu.
   */
  async verificarPermissao(): Promise<EstadoPermissao> {
    const resposta = await Notifications.getPermissionsAsync();
    return paraEstadoPermissao(resposta);
  },

  /**
   * Dispara o diálogo nativo de permissão do iOS. Só deve ser chamado
   * depois da tela explicativa própria (regra da 8.4 — "Antes do diálogo
   * do iOS, uma tela própria explica").
   *
   * Recebe: nada.
   * Devolve: o estado resultante.
   */
  async pedirPermissao(): Promise<EstadoPermissao> {
    const resposta = await Notifications.requestPermissionsAsync();
    return paraEstadoPermissao(resposta);
  },

  calcularCustoDeAgendamento,
  montarAgendamentos,

  /**
   * Agenda todas as notificações de um remédio no iOS e grava as linhas
   * correspondentes em `notificacoes_agendadas`.
   *
   * Recebe: o remédio ativo (com horários).
   * Devolve: nada. Falha ao agendar um horário não interrompe os
   * outros — o remédio nunca deixa de existir por causa do aviso (12.4).
   */
  async agendarDoRemedio(remedio: RemedioComHorarios): Promise<void> {
    const agendamentos = montarAgendamentos(remedio);
    if (agendamentos.length === 0) return;

    const preferencias = await repositorioPreferencias.obter();
    const conteudo = conteudoNotificacao(remedio);

    for (const agendamento of agendamentos) {
      try {
        const identificador = await Notifications.scheduleNotificationAsync({
          content: { ...conteudo, sound: preferencias.somLembrete },
          trigger: paraGatilhoNativo(agendamento.gatilho),
        });

        await db.insert(schema.notificacoesAgendadas).values({
          horarioId: agendamento.horarioId,
          identificadorIos: identificador,
          disparoEm: agendamento.disparoEm,
        });
      } catch (erro) {
        console.error('[servicoLembretes] falha ao agendar', remedio.nome, erro);
      }
    }
  },

  /**
   * Cancela todas as notificações agendadas de um remédio, no iOS e no
   * banco.
   *
   * Recebe: `remedioId`.
   * Devolve: nada.
   *
   * Implementa o cancelamento da 12.2 (arquivamento, lembrete desligado,
   * edição de horário — "cancelar e recriar é a única operação
   * confiável").
   */
  async cancelarDoRemedio(remedioId: number): Promise<void> {
    const linhas = await db
      .select({ identificadorIos: schema.notificacoesAgendadas.identificadorIos, id: schema.notificacoesAgendadas.id })
      .from(schema.notificacoesAgendadas)
      .innerJoin(schema.horarios, eq(schema.notificacoesAgendadas.horarioId, schema.horarios.id))
      .where(eq(schema.horarios.remedioId, remedioId));

    for (const linha of linhas) {
      try {
        await Notifications.cancelScheduledNotificationAsync(linha.identificadorIos);
      } catch (erro) {
        console.error('[servicoLembretes] falha ao cancelar', linha.identificadorIos, erro);
      }
    }

    const ids = linhas.map((l) => l.id);
    if (ids.length > 0) {
      await db.delete(schema.notificacoesAgendadas).where(inArray(schema.notificacoesAgendadas.id, ids));
    }
  },

  /**
   * Cancela todos os pedidos pendentes no iOS e esvazia
   * `notificacoes_agendadas` — usado por "Apagar todos os meus dados" (8.6).
   *
   * Recebe: nada.
   * Devolve: nada.
   */
  async cancelarTudo(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await db.delete(schema.notificacoesAgendadas);
  },
};
