import { Pressable, StyleSheet, View } from 'react-native';

import { TextoGrande } from '../../components/TextoGrande';
import { CORES_SEMANTICAS } from '../../theme/colors';
import { TOQUE_MINIMO } from '../../theme/spacing';

/** Dígito (11.2) → letra única exibida no círculo (bloco 4a da 8.2). */
const DIAS: { digito: string; letra: string; nomeCompleto: string }[] = [
  { digito: '1', letra: 'D', nomeCompleto: 'Domingo' },
  { digito: '2', letra: 'S', nomeCompleto: 'Segunda' },
  { digito: '3', letra: 'T', nomeCompleto: 'Terça' },
  { digito: '4', letra: 'Q', nomeCompleto: 'Quarta' },
  { digito: '5', letra: 'Q', nomeCompleto: 'Quinta' },
  { digito: '6', letra: 'S', nomeCompleto: 'Sexta' },
  { digito: '7', letra: 'S', nomeCompleto: 'Sábado' },
];

interface SeletorDiasSemanaProps {
  selecionados: string;
  aoAlternar: (digito: string) => void;
}

/**
 * 7 botões redondos (D S T Q Q S S) para marcar os dias da semana
 * (8.2, bloco 4a).
 *
 * Recebe: os dígitos já marcados (string, ex. "246") e o callback de
 * alternar um dígito.
 * Devolve: a linha de botões — quebra para a linha de baixo quando não
 * cabem os 7 num só row sem furar o toque mínimo de 60×60pt (0.2); a
 * área tocável nunca encolhe para caber.
 */
export function SeletorDiasSemana({ selecionados, aoAlternar }: SeletorDiasSemanaProps) {
  return (
    <View style={styles.linha}>
      {DIAS.map(({ digito, letra, nomeCompleto }) => {
        const marcado = selecionados.includes(digito);
        return (
          <Pressable
            key={digito}
            onPress={() => aoAlternar(digito)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marcado }}
            accessibilityLabel={nomeCompleto}
            style={[styles.circulo, marcado && styles.circuloMarcado]}
          >
            <TextoGrande token="corpo" cor={marcado ? '#FFFFFF' : CORES_SEMANTICAS.neutroTexto}>
              {letra}
            </TextoGrande>
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
    gap: 10,
  },
  circulo: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    borderRadius: TOQUE_MINIMO / 2,
    borderWidth: 2,
    borderColor: CORES_SEMANTICAS.neutroBorda,
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloMarcado: {
    backgroundColor: CORES_SEMANTICAS.acao,
    borderColor: CORES_SEMANTICAS.acao,
  },
});
