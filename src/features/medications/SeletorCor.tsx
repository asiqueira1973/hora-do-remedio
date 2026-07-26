import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ORDEM_RODIZIO_CORES, PALETA_REMEDIOS } from '../../theme/colors';
import { TOQUE_MINIMO } from '../../theme/spacing';
import type { Cor } from '../../types/domain';

interface SeletorCorProps {
  selecionada: Cor;
  aoSelecionar: (cor: Cor) => void;
}

/**
 * 6 círculos grandes da paleta (8.2, bloco 8) para escolher a cor de
 * identificação do card.
 *
 * Recebe: a cor selecionada e o callback de troca.
 * Devolve: os 6 círculos tocáveis (mín. 60×60pt), na ordem da 16.3, com
 * um ✓ no círculo escolhido — a cor nunca é a única informação (17.3),
 * por isso o marcador visual explícito além do preenchimento.
 */
export function SeletorCor({ selecionada, aoSelecionar }: SeletorCorProps) {
  return (
    <View style={styles.linha}>
      {ORDEM_RODIZIO_CORES.map((cor) => {
        const marcada = cor === selecionada;
        return (
          <Pressable
            key={cor}
            onPress={() => aoSelecionar(cor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: marcada }}
            accessibilityLabel={cor}
            style={[styles.circulo, { backgroundColor: PALETA_REMEDIOS[cor].detalhe }, marcada && styles.circuloMarcado]}
          >
            {marcada ? <Ionicons name="checkmark" size={28} color="#FFFFFF" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  circulo: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    borderRadius: TOQUE_MINIMO / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloMarcado: {
    borderWidth: 3,
    borderColor: '#1C1C1E',
  },
});
