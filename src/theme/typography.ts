import { Platform } from 'react-native';
import type { EscalaFonte } from '../types/domain';

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
  botao: { grande: 22, gigante: 26 },
  apoio: { grande: 20, gigante: 22 },
};

/**
 * Peso por token, na fonte do sistema (San Francisco no iOS) — redesenho
 * de 2026-08-23 para o padrão visual nativo da Apple: em vez de empacotar
 * uma fonte própria (Nunito), o app usa a família padrão do aparelho.
 * Deixar `fontFamily` indefinido no iOS já faz o React Native renderizar
 * com San Francisco; `fontWeight` é quem faz o trabalho de hierarquia.
 */
const PESOS: Record<TokenTipografia, string> = {
  display: '800',
  titulo: '700',
  corpo: '600',
  botao: '700',
  apoio: '600',
};

/**
 * Devolve o estilo de texto (peso, tamanho, altura de linha) para um
 * token tipográfico, na escala de fonte ativa.
 *
 * Recebe: o token (`display`/`titulo`/`corpo`/`botao`/`apoio`) e a escala
 * atual do usuário (`preferencias.escala_fonte`, seção 7.5).
 * Devolve: `{ fontFamily, fontWeight, fontSize, lineHeight }` pronto para
 * um StyleSheet — `fontFamily` só é definido fora do iOS, onde não existe
 * San Francisco (Android usa Roboto do sistema mesmo assim).
 *
 * Implementa a seção 16.2: altura de linha é sempre 1.35× o tamanho da
 * fonte, em todos os tokens.
 */
export function obterEstiloTipografico(token: TokenTipografia, escala: EscalaFonte) {
  const fontSize = TAMANHOS[token][escala];
  return {
    fontFamily: Platform.select({ ios: undefined, default: 'sans-serif' }),
    fontWeight: PESOS[token] as
      | 'normal'
      | 'bold'
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900',
    fontSize,
    lineHeight: Math.round(fontSize * 1.35),
  };
}
