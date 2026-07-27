import * as Notifications from 'expo-notifications';

import * as schema from '../../db/schema';
import { db } from '../../db/client';
import { repositorioRemedios } from '../../repositories/medications';
import { repositorioPreferencias } from '../../repositories/preferences';
import type { RemedioComHorarios } from '../../types/domain';
import { COTA_NOTIFICACOES_IOS, paraGatilhoNativo, type Agendamento, type GatilhoAgendamento } from './servicoLembretes';
import { montarAgendamentos } from './agendamentoPuro';
import { TEXTOS } from '../../constants/textos';

export interface RelatorioReconciliacao {
  canceladas: number;
  agendadas: number;
  custoTotal: number;
  cotaEstourada: boolean;
}

interface AgendamentoComRemedio extends Agendamento {
  remedio: RemedioComHorarios;
}

/**
 * Próximo horário em que um gatilho dispararia, a partir de agora.
 * Cálculo aproximado em JS puro (sem chamada nativa) — usado só para
 * ordenar por proximidade, não para agendar de verdade.
 *
 * Recebe: o gatilho e o instante de referência.
 * Devolve: a próxima data de disparo.
 *
 * Implementa a priorização da 11.4: "por proximidade do próximo disparo,
 * sem exceção. Não invente prioridade por remédio, por cor ou por ordem
 * de cadastro."
 */
function calcularProximoDisparo(gatilho: GatilhoAgendamento, agora: Date): Date {
  if (gatilho.tipo === 'data') {
    return new Date(gatilho.data);
  }

  if (gatilho.tipo === 'diario') {
    const candidato = new Date(agora);
    candidato.setHours(gatilho.hour, gatilho.minute, 0, 0);
    if (candidato <= agora) candidato.setDate(candidato.getDate() + 1);
    return candidato;
  }

  // dias_semana: nosso dígito 1=domingo..7=sábado é o mesmo `getDay()` do
  // JS (0=domingo..6=sábado) mais 1 — por isso o -1 abaixo (11.2).
  const diaAlvo = gatilho.weekday - 1;
  let diasAte = (diaAlvo - agora.getDay() + 7) % 7;
  const candidato = new Date(agora);
  candidato.setHours(gatilho.hour, gatilho.minute, 0, 0);
  if (diasAte === 0 && candidato <= agora) diasAte = 7;
  candidato.setDate(agora.getDate() + diasAte);
  candidato.setHours(gatilho.hour, gatilho.minute, 0, 0);
  return candidato;
}

/**
 * `reconciliadorLembretes.reconciliar` — a rotina da regra 11.5.
 *
 * Recebe: nada.
 * Devolve: um `RelatorioReconciliacao` (quantas foram canceladas,
 * agendadas, o custo total e se a cota estourou).
 *
 * Implementa os 6 passos da 11.5. Estratégia: cancela tudo o que está
 * pendente no iOS e todas as linhas de `notificacoes_agendadas`, depois
 * reconstrói do zero a partir de `remedios` + `horarios` (que são a
 * fonte de verdade sobre o que o usuário quer — 7.4). Como o volume é de
 * dezenas de linhas (17.5), refazer tudo é mais simples e igualmente
 * correto do que comparar item a item, e ainda satisfaz "na divergência,
 * o iOS ganha e a tabela é reescrita": a tabela é sempre reescrita para
 * bater exatamente com o que acabou de ser agendado.
 *
 * A priorização por proximidade (11.4) é calculada em JS puro
 * (`calcularProximoDisparo`), sem depender do estado que o iOS já tinha.
 */
export async function reconciliar(): Promise<RelatorioReconciliacao> {
  const pendentesAntes = await Notifications.getAllScheduledNotificationsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await db.delete(schema.notificacoesAgendadas);

  const remediosAtivos = await repositorioRemedios.listarAtivos();
  const agora = new Date();

  const todosAgendamentos: AgendamentoComRemedio[] = [];
  for (const remedio of remediosAtivos) {
    for (const agendamento of montarAgendamentos(remedio)) {
      todosAgendamentos.push({ ...agendamento, remedio });
    }
  }

  todosAgendamentos.sort(
    (a, b) => calcularProximoDisparo(a.gatilho, agora).getTime() - calcularProximoDisparo(b.gatilho, agora).getTime(),
  );

  const custoTotal = todosAgendamentos.length;
  const cotaEstourada = custoTotal > COTA_NOTIFICACOES_IOS;
  const paraAgendar = todosAgendamentos.slice(0, COTA_NOTIFICACOES_IOS);

  const preferencias = await repositorioPreferencias.obter();
  let agendadas = 0;

  for (const item of paraAgendar) {
    try {
      const identificador = await Notifications.scheduleNotificationAsync({
        content: {
          title: TEXTOS.notificacao.titulo,
          body: item.remedio.dose ? `${item.remedio.nome} — ${item.remedio.dose}` : item.remedio.nome,
          sound: preferencias.somLembrete,
        },
        trigger: paraGatilhoNativo(item.gatilho),
      });

      await db.insert(schema.notificacoesAgendadas).values({
        horarioId: item.horarioId,
        identificadorIos: identificador,
        disparoEm: item.disparoEm,
      });
      agendadas++;
    } catch (erro) {
      console.error('[reconciliadorLembretes] falha ao agendar', item.remedio.nome, erro);
    }
  }

  if (cotaEstourada) {
    console.warn(
      `[reconciliadorLembretes] cota de ${COTA_NOTIFICACOES_IOS} notificações estourada: ` +
        `${custoTotal} pedidos calculados, ${agendadas} agendados.`,
    );
  }

  return {
    canceladas: pendentesAntes.length,
    agendadas,
    custoTotal,
    cotaEstourada,
  };
}

export const reconciliadorLembretes = { reconciliar };
