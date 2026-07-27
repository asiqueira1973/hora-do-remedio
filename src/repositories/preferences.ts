import { eq } from 'drizzle-orm';

import { db } from '../db/client';
import * as schema from '../db/schema';
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
};
