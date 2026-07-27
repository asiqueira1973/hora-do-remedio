import type { RemedioComHorarios } from '../../types/domain';

/**
 * Funções puras de agendamento (13-A.2): nenhum import daqui toca banco
 * ou módulo nativo, de propósito — são exatamente as duas funções onde
 * um erro produz lembrete que não toca, silenciosamente (11.4), então
 * precisam ser testáveis isoladamente (22.1.1, 22.1.2) sem precisar
 * simular `expo-sqlite`/`expo-notifications` no Jest.
 */

/** Janela de agendamento de `intervalo_dias`, em dias (11.3). */
export const JANELA_DIAS_INTERVALO = 30;

/** Cota de notificações locais pendentes por app no iOS (11.4, 4.6). */
export const COTA_NOTIFICACOES_IOS = 64;

/**
 * Um agendamento a fazer para um horário específico. Representação
 * própria (não a do SDK do expo-notifications) para esta função
 * continuar pura e testável sem depender de módulo nativo.
 */
export type GatilhoAgendamento =
  | { tipo: 'diario'; hour: number; minute: number }
  | { tipo: 'dias_semana'; weekday: number; hour: number; minute: number }
  | { tipo: 'data'; data: string };

export interface Agendamento {
  horarioId: number;
  gatilho: GatilhoAgendamento;
  /** ISO 8601, só preenchido para gatilhos de data única (`intervalo_dias`). */
  disparoEm: string | null;
}

/**
 * Calcula quantos pedidos de notificação um conjunto de remédios consome
 * da cota do iOS.
 *
 * Recebe: lista de remédios ativos com seus horários.
 * Devolve: número total de pedidos que seriam agendados.
 *
 * Implementa a regra 11.4 do spec: o iOS aceita no máximo 64 notificações
 * locais pendentes por app e descarta o excedente em silêncio, então o
 * app precisa saber o custo ANTES de agendar. `intervalo_dias` não tem
 * caminho na interface (decisão 25.8), mas o cálculo continua correto
 * aqui — é a função pura que o teste 22.1.1 cobre.
 */
export function calcularCustoDeAgendamento(remedios: RemedioComHorarios[]): number {
  return remedios.reduce((total, remedio) => {
    if (!remedio.lembreteAtivo) return total;

    switch (remedio.frequencia) {
      case 'quando_precisar':
        return total;

      case 'diario':
        // Trigger de calendário repetitivo: 1 pedido por horário, para sempre (11.4)
        return total + remedio.horarios.length;

      case 'dias_semana': {
        // O iOS não repete "seg/qua/sex" num pedido só — precisa de um por
        // combinação dia × horário (11.4)
        const dias = remedio.diasSemana?.length ?? 0;
        return total + dias * remedio.horarios.length;
      }

      case 'intervalo_dias': {
        // Não existe trigger nativo de "a cada N dias". Agendamos datas
        // concretas cobrindo a janela de 30 dias da regra 11.3, e a
        // reconciliação (11.5) renova essa janela a cada abertura.
        const n = remedio.intervaloDias ?? 1;
        return total + Math.ceil(JANELA_DIAS_INTERVALO / n) * remedio.horarios.length;
      }

      default:
        return total;
    }
  }, 0);
}

/** Data local (sem hora) de `criado_em`, para ancorar o cálculo de `intervalo_dias` (11.6). */
function nomearDia(criadoEm: string): Date {
  const data = new Date(criadoEm.replace(' ', 'T') + 'Z');
  data.setHours(0, 0, 0, 0);
  return data;
}

/**
 * Traduz frequência + horários de um remédio nos gatilhos que seriam
 * agendados no iOS.
 *
 * Recebe: um remédio ativo, com horários.
 * Devolve: a lista de agendamentos (função pura — o teste 22.1.2 cobre
 * cada frequência, inclusive `intervalo_dias` gerando ⌈30/N⌉ datas).
 *
 * Implementa 11.1 (semântica de cada frequência) e 11.2 (codificação de
 * `dias_semana`: dígito 1 é domingo, 7 é sábado — o mesmo `weekday` do
 * `UNCalendarNotificationTrigger`/`WeeklyTriggerInput` do iOS, sem
 * conversão nenhuma). Remédio sem lembrete ligado ou "quando precisar"
 * não gera nada.
 */
export function montarAgendamentos(remedio: RemedioComHorarios): Agendamento[] {
  if (!remedio.lembreteAtivo || remedio.frequencia === 'quando_precisar') {
    return [];
  }

  const agendamentos: Agendamento[] = [];

  for (const horario of remedio.horarios) {
    const [horaTexto, minutoTexto] = horario.horaMinuto.split(':');
    const hour = Number(horaTexto);
    const minute = Number(minutoTexto);

    if (remedio.frequencia === 'diario') {
      agendamentos.push({
        horarioId: horario.id,
        gatilho: { tipo: 'diario', hour, minute },
        disparoEm: null,
      });
    } else if (remedio.frequencia === 'dias_semana') {
      const digitos = (remedio.diasSemana ?? '').split('');
      for (const digito of digitos) {
        agendamentos.push({
          horarioId: horario.id,
          gatilho: { tipo: 'dias_semana', weekday: Number(digito), hour, minute },
          disparoEm: null,
        });
      }
    } else if (remedio.frequencia === 'intervalo_dias') {
      const n = remedio.intervaloDias ?? 1;
      const quantidade = Math.ceil(JANELA_DIAS_INTERVALO / n);
      const diaBase = nomearDia(remedio.criadoEm);
      for (let i = 0; i < quantidade; i++) {
        const data = new Date(diaBase);
        data.setDate(data.getDate() + i * n);
        data.setHours(hour, minute, 0, 0);
        agendamentos.push({
          horarioId: horario.id,
          gatilho: { tipo: 'data', data: data.toISOString() },
          disparoEm: data.toISOString(),
        });
      }
    }
  }

  return agendamentos;
}
