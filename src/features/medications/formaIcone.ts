import { Ionicons } from '@expo/vector-icons';

import type { Forma } from '../../types/domain';

/**
 * Ícone do `@expo/vector-icons` para cada forma farmacêutica (7.6).
 * Escolha livre de ícone concreto, conforme 16.8.
 */
export const FORMA_ICONE: Record<Forma, keyof typeof Ionicons.glyphMap> = {
  comprimido: 'ellipse-outline',
  capsula: 'medical-outline',
  gotas: 'water-outline',
  xarope: 'flask-outline',
  injecao: 'medkit-outline',
  pomada: 'bandage-outline',
  spray: 'cloud-outline',
  outro: 'ellipsis-horizontal-circle-outline',
};
