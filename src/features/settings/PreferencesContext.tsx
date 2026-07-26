import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { createContext, useContext, type ReactNode } from 'react';

import { db } from '../../db/client';
import * as schema from '../../db/schema';
import type { EscalaFonte } from '../../types/domain';

interface PreferencesContextValue {
  /** Escala de fonte ativa (16.2). `'grande'` até a primeira leitura do banco terminar. */
  escalaFonte: EscalaFonte;
  /** Se o lembrete toca com som (8.6). `true` até a primeira leitura terminar. */
  somLembrete: boolean;
  carregando: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  escalaFonte: 'grande',
  somLembrete: true,
  carregando: true,
});

/**
 * Disponibiliza `preferencias` (linha única, 7.5) para o app inteiro,
 * reagindo a mudanças sem precisar de reload manual.
 *
 * Recebe: os componentes filhos.
 * Devolve: o provider do Context.
 *
 * Implementa o critério de aceite de 8.6: "Mudar para Gigante aumenta o
 * texto de toda a Home imediatamente, sem reiniciar o app" — todo
 * componente que usa `useEscalaFonte()` re-renderiza sozinho quando a
 * linha de `preferencias` muda, via `useLiveQuery` (4.2).
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { data } = useLiveQuery(db.select().from(schema.preferencias).limit(1));
  const linha = data?.[0];

  const value: PreferencesContextValue = {
    escalaFonte: (linha?.escalaFonte as EscalaFonte | undefined) ?? 'grande',
    somLembrete: linha ? linha.somLembrete === 1 : true,
    carregando: linha === undefined,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/** Escala de fonte ativa, para uso em qualquer componente de texto. */
export function useEscalaFonte(): EscalaFonte {
  return useContext(PreferencesContext).escalaFonte;
}

export function usePreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}
