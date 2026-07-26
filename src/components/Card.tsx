import { View, StyleSheet, type ViewProps } from 'react-native';

import { CORES_SEMANTICAS } from '../theme/colors';
import { ESPACAMENTO, RAIO, SOMBRA } from '../theme/spacing';

interface CardProps extends ViewProps {
  corFundo?: string;
}

/**
 * Contêiner visual padrão: fundo sólido, raio de 20pt, padding de 20pt,
 * sombra sutil única (16.5).
 *
 * Recebe: `corFundo` (default `neutro_superficie`, 16.4) e as props normais
 * de `View`.
 * Devolve: um `<View>` estilizado como card.
 */
export function Card({ corFundo = CORES_SEMANTICAS.neutroSuperficie, style, children, ...rest }: CardProps) {
  return (
    <View {...rest} style={[styles.base, { backgroundColor: corFundo }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RAIO.card,
    padding: ESPACAMENTO.paddingCard,
    ...SOMBRA,
  },
});
