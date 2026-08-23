import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { TextoGrande } from '../../components/TextoGrande';
import { CORES_SEMANTICAS, PALETA_REMEDIOS } from '../../theme/colors';
import { RAIO } from '../../theme/spacing';
import type { RemedioComHorarios } from '../../types/domain';
import { TEXTOS } from '../../constants/textos';
import { FORMA_ICONE } from './formaIcone';
import { formatarFrequencia } from './formatarFrequencia';

interface MedicationCardProps {
  remedio: RemedioComHorarios;
  onPress: () => void;
}

/**
 * Linha de remédio da Home (8.1): nome, dose, ícone da forma, observação e
 * indicador de aviso, dentro de uma lista agrupada nativa — fundo branco,
 * um círculo colorido de identificação à esquerda (a cor do remédio vira
 * o círculo, não mais o fundo inteiro do cartão) e um chevron à direita.
 * Redesenho de 2026-08-23.
 *
 * Recebe: o remédio (com horários, mas a linha não lista horário — o
 * agrupamento já mostra isso no cabeçalho do grupo) e o callback de toque
 * para abrir o detalhe (8.3).
 * Devolve: a linha tocável.
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
      style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}
    >
      <View style={[styles.iconeCirculo, { backgroundColor: paleta.fundo }]}>
        <Ionicons name={FORMA_ICONE[remedio.forma]} size={24} color={paleta.detalhe} />
      </View>

      <View style={styles.conteudo}>
        <TextoGrande token="titulo" cor={CORES_SEMANTICAS.neutroTexto}>
          {remedio.nome}
        </TextoGrande>

        {remedio.dose ? (
          <TextoGrande token="corpo" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.linhaTexto}>
            {remedio.dose}
          </TextoGrande>
        ) : null}

        {remedio.observacao ? (
          <View style={styles.linhaComIcone}>
            <Ionicons name="alert-circle-outline" size={17} color={CORES_SEMANTICAS.atencao} />
            <TextoGrande token="apoio" cor={CORES_SEMANTICAS.atencao} style={styles.linhaComIconeTexto}>
              {remedio.observacao}
            </TextoGrande>
          </View>
        ) : null}

        {frequenciaTexto ? (
          <View style={styles.linhaComIcone}>
            <Ionicons name="calendar-outline" size={17} color={CORES_SEMANTICAS.neutroTextoSecundario} />
            <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.linhaComIconeTexto}>
              {frequenciaTexto}
            </TextoGrande>
          </View>
        ) : null}

        {mostraSemAviso ? (
          <View style={styles.linhaComIcone}>
            <Ionicons name="notifications-off-outline" size={17} color={CORES_SEMANTICAS.neutroTextoSecundario} />
            <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.linhaComIconeTexto}>
              {TEXTOS.home.semAviso}
            </TextoGrande>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    borderRadius: RAIO.card,
    padding: 14,
    gap: 14,
  },
  pressionado: {
    opacity: 0.6,
  },
  iconeCirculo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  conteudo: {
    flex: 1,
  },
  linhaTexto: {
    marginTop: 2,
  },
  linhaComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
  },
  linhaComIconeTexto: {
    marginTop: 0,
  },
});
