import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';

import migrations from './migrations/migrations';
import * as schema from './schema';
import { rodarSeed } from './seed';

const NOME_ARQUIVO_BANCO = 'horadoremedio.db';

const conexaoNativa = openDatabaseSync(NOME_ARQUIVO_BANCO, { enableChangeListener: true });

/**
 * Instância do Drizzle usada por todo o app para ler e escrever no banco.
 * Implementa a seção 7 (schema) sobre a conexão aberta em `conexaoNativa`.
 */
export const db = drizzle(conexaoNativa, { schema });

/**
 * Inicializa o banco na abertura do app: liga os PRAGMAs, roda as
 * migrations empacotadas e o seed.
 *
 * Recebe: nada.
 * Devolve: nada — lança erro se qualquer etapa falhar, para a splash
 * screen (8.0) decidir mostrar a tela de erro da regra 12.4.
 *
 * Implementa a seção 8.0 (fundação): "abre o banco, aplica PRAGMA
 * foreign_keys = ON e journal_mode = WAL, roda migrations, roda o seed, e
 * só então libera a splash". A ordem importa: `foreign_keys` precisa estar
 * ligado antes de qualquer INSERT/DELETE em cascade funcionar (7.7), e as
 * migrations precisam rodar antes do seed poder inserir a linha de
 * `preferencias`.
 */
export async function inicializarBanco(): Promise<void> {
  conexaoNativa.execSync('PRAGMA foreign_keys = ON;');
  conexaoNativa.execSync('PRAGMA journal_mode = WAL;');

  await migrate(db, migrations);
  await rodarSeed(db);
}
