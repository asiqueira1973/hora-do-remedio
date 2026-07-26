import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { TextoGrande } from '../../components/TextoGrande';
import { PALETA_REMEDIOS } from '../../theme/colors';
import { ESPACAMENTO, RAIO } from '../../theme/spacing';
import type { RemedioComHorarios } from '../../types/domain';
import { TEXTOS } from '../../constants/textos';
import { FORMA_ICONE } from './formaIcone';
import { formatarFrequencia } from './formatarFrequencia';

interface MedicationCardProps {
  remedio: RemedioComHorarios;
  onPress: () => void;
}

/**
 * Card de remédio da Home (8.1): nome, dose, ícone da forma, observação e
 * indicador de aviso, sobre o fundo na cor do remédio.
 *
 * Recebe: o remédio (com horários, mas o card não lista horário — o
 * agrupamento já mostra isso no cabeçalho do grupo) e o callback de toque
 * para abrir o detalhe (8.3).
 * Devolve: o card tocável.
 *
 * Implementa a tabela "Conteúdo do card" da 8.1: dose e observação
 * omitidas quando nulas (sem linha vazia, sem traço), frequência só
 * quando ≠ diário, e o aviso de "sem aviso" nunca aparece para
 * `quando_precisar` (11.1 — lá o aviso nunca existiu).
 */
export function MedicationCard({ remedio, onPress }: MedicationCardProps) {
  const paleta = PALETA_REMEDIOS[remedio.cor];
  const frequenciaTexto = formatarFrequencia(remedio);
  const mostraSemAviso = !remedio.lembreteAtivo && remedio.frequencia !== 'quando_precisar';
  const rotuloAcessivel = [remedio.nome, remedio.dose].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      style={({ pressed }) => [styles.card, { backgroundColor: paleta.fundo }, pressed && styles.pressionado]}
    >
      <View style={styles.iconeCirculo}>
        <Ionicons name={FORMA_ICONE[remedio.forma]} size={30} color={paleta.detalhe} />
      </View>

      <View style={styles.conteudo}>
        <TextoGrande token="titulo" cor={paleta.texto}>
          {remedio.nome}
        </TextoGrande>

        {remedio.dose ? (
          <TextoGrande token="corpo" cor={paleta.texto} style={styles.linha}>
            {remedio.dose}
          </TextoGrande>
        ) : null}

        {remedio.observacao ? (
          <TextoGrande token="corpo" cor={paleta.texto} style={styles.linha}>
            ⚠️ {remedio.observacao}
          </TextoGrande>
        ) : null}

        {frequenciaTexto ? (
          <TextoGrande token="apoio" cor={paleta.texto} style={styles.linha}>
            {frequenciaTexto}
          </TextoGrande>
        ) : null}

        {mostraSemAviso ? (
          <View style={styles.semAvisoLinha}>
            <Ionicons name="notifications-off-outline" size={20} color={paleta.texto} />
            <TextoGrande token="apoio" cor={paleta.texto} style={styles.semAvisoTexto}>
              {TEXTOS.home.semAviso}
            </TextoGrande>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: RAIO.card,
    padding: ESPACAMENTO.paddingCard,
    gap: 16,
  },
  pressionado: {
    opacity: 0.85,
  },
  iconeCirculo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    flex: 1,
  },
  linha: {
    marginTop: 6,
  },
  semAvisoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  semAvisoTexto: {
    marginTop: 0,
  },
});
