import { eq } from 'drizzle-orm';

import { db } from '../db/client';
import * as schema from '../db/schema';
import { rodarSeed } from '../db/seed';
import type { EscalaFonte, Preferencias } from '../types/domain';

/**
 * `repositorioPreferencias` — acesso à linha única de `preferencias`
 * (7.5, 13-A.1 por extensão). Usado pelo serviço de lembretes (13-A.2)
 * para saber se o som está ligado ao agendar, e pela tela de Ajustes
 * (8.6) para ler/gravar as preferências do usuário.
 */
export const repositorioPreferencias = {
  /**
   * Lê a linha única de preferências.
   *
   * Recebe: nada.
   * Devolve: `Preferencias` — sempre existe, criada pelo seed (7.9).
   */
  async obter(): Promise<Preferencias> {
    const linha = db.select().from(schema.preferencias).where(eq(schema.preferencias.id, 1)).get();
    if (!linha) {
      throw new Error('preferencias.id=1 não existe — seed não rodou');
    }
    return {
      id: 1,
      escalaFonte: linha.escalaFonte as EscalaFonte,
      somLembrete: linha.somLembrete === 1,
      onboardingConcluidoEm: linha.onboardingConcluidoEm,
      atualizadoEm: linha.atualizadoEm,
    };
  },

  /**
   * Grava a escala de fonte (8.6 — "Tamanho das letras").
   *
   * Recebe: `'grande'` ou `'gigante'`.
   * Devolve: nada. Quem lê via `useEscalaFonte()` reage sozinho
   * (`PreferencesContext` usa `useLiveQuery`).
   */
  async atualizarEscalaFonte(escala: EscalaFonte): Promise<void> {
    await db.update(schema.preferencias).set({ escalaFonte: escala }).where(eq(schema.preferencias.id, 1));
  },

  /**
   * Grava se o lembrete toca com som. Quem chama ainda precisa reagendar
   * as notificações (o som é gravado no momento do agendamento, não da
   * entrega — 8.6) chamando `reconciliar()` em seguida.
   *
   * Recebe: `true`/`false`.
   * Devolve: nada.
   */
  async atualizarSomLembrete(ligado: boolean): Promise<void> {
    await db
      .update(schema.preferencias)
      .set({ somLembrete: ligado ? 1 : 0 })
      .where(eq(schema.preferencias.id, 1));
  },

  /**
   * Grava a conclusão do onboarding (8.7).
   *
   * Recebe: nada.
   * Devolve: nada.
   */
  async concluirOnboarding(): Promise<void> {
    await db
      .update(schema.preferencias)
      .set({ onboardingConcluidoEm: new Date().toISOString() })
      .where(eq(schema.preferencias.id, 1));
  },

  /**
   * Apaga o banco inteiro e recria a linha única de `preferencias` com os
   * defaults do seed (8.6 — "Apagar todos os meus dados").
   *
   * Recebe: nada.
   * Devolve: nada. Cancelar as notificações pendentes no iOS é
   * responsabilidade de quem chama, **antes** deste método
   * (`servicoLembretes.cancelarTudo()`) — apagar `remedios` já arrasta
   * `horarios` e `notificacoes_agendadas` em cascata (7.3, 7.4), mas não
   * cancela o que já foi pedido ao sistema operacional.
   */
  async apagarTudo(): Promise<void> {
    await db.delete(schema.remedios);
    await db.delete(schema.preferencias);
    await rodarSeed(db);
  },
};
