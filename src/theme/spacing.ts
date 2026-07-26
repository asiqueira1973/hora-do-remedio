/**
 * Espaçamento, raios e alturas mínimas de toque (16.5).
 *
 * São constantes fixas do design system — não editáveis pelo agente sem
 * aprovação (16.8).
 */
export const RAIO = {
  card: 20,
  botao: 16,
};

/** Área tocável mínima do app inteiro: 60×60pt (princípio 0.2). */
export const TOQUE_MINIMO = 60;

export const ALTURAS = {
  botaoPrimario: 64,
  fab: 68,
};

export const ESPACAMENTO = {
  entreCards: 16,
  margemLateralTela: 20,
  paddingCard: 20,
};

/** Sombra sutil e única do app (16.5): y:2, blur:8, opacidade 0.08. */
export const SOMBRA = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};
