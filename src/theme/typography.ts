import type { EscalaFonte } from '../types/domain';

/** Nomes de família registrados pelo `useFonts` (ver app/_layout.tsx). */
export const FONT_FAMILIES = {
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extraBold: 'Nunito-ExtraBold',
} as const;

export type TokenTipografia = 'display' | 'titulo' | 'corpo' | 'botao' | 'apoio';

/**
 * Tamanhos de fonte por token e por escala (16.2).
 *
 * `apoio` em `grande` (20pt) é o piso absoluto do app (princípio 0.1) — não
 * existe token menor em lugar nenhum do projeto.
 */
const TAMANHOS: Record<TokenTipografia, Record<EscalaFonte, number>> = {
  display: { grande: 34, gigante: 40 },
  titulo: { grande: 28, gigante: 34 },
  corpo: { grande: 22, gigante: 26 },
  botao: { grande: 24, gigante: 28 },
  apoio: { grande: 20, gigante: 22 },
};

const FAMILIAS: Record<TokenTipografia, string> = {
  display: FONT_FAMILIES.extraBold,
  titulo: FONT_FAMILIES.bold,
  corpo: FONT_FAMILIES.semiBold,
  botao: FONT_FAMILIES.bold,
  apoio: FONT_FAMILIES.semiBold,
};

/**
 * Devolve o estilo de texto (família, tamanho, altura de linha) para um
 * token tipográfico, na escala de fonte ativa.
 *
 * Recebe: o token (`display`/`titulo`/`corpo`/`botao`/`apoio`) e a escala
 * atual do usuário (`preferencias.escala_fonte`, seção 7.5).
 * Devolve: `{ fontFamily, fontSize, lineHeight }` pronto para um StyleSheet.
 *
 * Implementa a seção 16.2: altura de linha é sempre 1.35× o tamanho da
 * fonte, em todos os tokens.
 */
export function obterEstiloTipografico(token: TokenTipografia, escala: EscalaFonte) {
  const fontSize = TAMANHOS[token][escala];
  return {
    fontFamily: FAMILIAS[token],
    fontSize,
    lineHeight: Math.round(fontSize * 1.35),
  };
}
