import type { Cor } from '../types/domain';

/**
 * Paleta de identificação visual dos cards de remédio (16.3).
 *
 * Recebe: nada — é uma tabela estática.
 * Devolve: para cada cor do enum `remedios.cor`, o fundo do card, o texto
 * sobre esse fundo e a cor de detalhe/ícone.
 *
 * Implementa a regra dura da 16.4: estas seis cores são identificação, não
 * significado. Nenhuma delas pode coincidir com as cores semânticas de
 * `CORES_SEMANTICAS` abaixo.
 */
export const PALETA_REMEDIOS: Record<Cor, { fundo: string; texto: string; detalhe: string }> = {
  coral: { fundo: '#FFD9D0', texto: '#3A2520', detalhe: '#E8654A' },
  azul: { fundo: '#CFE4FF', texto: '#1C2B3D', detalhe: '#2F7FE0' },
  verde: { fundo: '#CFF0D8', texto: '#1D3325', detalhe: '#2FA35C' },
  amarelo: { fundo: '#FFEBB8', texto: '#3A3018', detalhe: '#E5A400' },
  lilas: { fundo: '#E4D9FF', texto: '#2C2340', detalhe: '#7C5AE0' },
  pessego: { fundo: '#FFE0C2', texto: '#3A2A18', detalhe: '#E07B2F' },
};

/**
 * Ordem do rodízio de cores no cadastro (11.8). A cor sugerida é a próxima
 * depois da do último remédio criado, voltando ao início ao passar de
 * `pessego`.
 */
export const ORDEM_RODIZIO_CORES: Cor[] = ['coral', 'azul', 'verde', 'amarelo', 'lilas', 'pessego'];

/**
 * Cores semânticas (16.4) — reservadas, nunca entram na paleta de cards.
 * Cada uma tem um significado exclusivo: `acao` é sempre confirmação/
 * sucesso, `perigo` é sempre destrutivo, etc.
 */
export const CORES_SEMANTICAS = {
  acao: '#1E9E5A',
  perigo: '#D93025',
  atencao: '#B25E00',
  neutroTexto: '#1C1C1E',
  neutroFundo: '#F5F5F7',
  neutroSuperficie: '#FFFFFF',
  neutroBorda: '#D6D6DB',
} as const;
