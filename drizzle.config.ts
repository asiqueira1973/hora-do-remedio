import type { Config } from 'drizzle-kit';

/**
 * Configuração do drizzle-kit para gerar as migrations do banco local.
 *
 * As migrations são geradas em `src/db/migrations` e empacotadas no bundle
 * do app (7.9) — não há como rodar `drizzle-kit` no aparelho do usuário.
 */
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
