import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import * as schema from './schema';

/**
 * Garante que a linha única de `preferencias` (id = 1) existe, com os
 * valores padrão.
 *
 * Recebe: a instância do Drizzle já com as migrations aplicadas.
 * Devolve: nada.
 *
 * Implementa a seção 7.9 (seed): "insere a linha `preferencias` com
 * `id = 1` e os defaults, se ela não existir. Nenhum remédio de exemplo é
 * criado — lista falsa confunde este público mais do que a tela vazia."
 */
export async function rodarSeed(db: ExpoSQLiteDatabase<typeof schema>): Promise<void> {
  const existente = await db
    .select({ id: schema.preferencias.id })
    .from(schema.preferencias)
    .where(eq(schema.preferencias.id, 1))
    .limit(1);

  if (existente.length > 0) {
    return;
  }

  await db.insert(schema.preferencias).values({
    id: 1,
    escalaFonte: 'grande',
    somLembrete: 1,
    onboardingConcluidoEm: null,
  });
}
