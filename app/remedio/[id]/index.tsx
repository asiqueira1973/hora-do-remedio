import { Ionicons } from '@expo/vector-icons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextoGrande } from '../../../src/components/TextoGrande';
import { TEXTOS } from '../../../src/constants/textos';
import { registrar } from '../../../src/features/analytics/analytics';
import { FORMA_ICONE } from '../../../src/features/medications/formaIcone';
import { formatarFrequencia } from '../../../src/features/medications/formatarFrequencia';
import { useArchiveBanner } from '../../../src/features/medications/ArchiveBannerContext';
import { reconciliar } from '../../../src/features/reminders/reconciliadorLembretes';
import { remedioParaDominio, repositorioRemedios } from '../../../src/repositories/medications';
import { CORES_SEMANTICAS, PALETA_REMEDIOS } from '../../../src/theme/colors';
import { ESPACAMENTO, RAIO, TOQUE_MINIMO } from '../../../src/theme/spacing';

/**
 * Detalhe de um remédio (8.3, rota `/remedio/[id]`).
 *
 * Recebe: `id` do remédio, pela rota.
 * Devolve: a tela cheia com todos os horários do remédio juntos e os
 * três botões — Editar, Parar de tomar, Voltar.
 *
 * Implementa o fluxo da 8.3: "mesma informação do card, em tela cheia e
 * ainda maior, com todos os horários do remédio juntos (não só o do
 * grupo em que ele foi tocado)".
 */
export default function DetalheRemedioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const remedioId = Number(id);
  const { mostrarBanner } = useArchiveBanner();

  const { data: linha } = useLiveQuery(repositorioRemedios.queryPorId(remedioId));

  if (!linha) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.carregando} />
      </SafeAreaView>
    );
  }

  const remedio = remedioParaDominio(linha);
  const paleta = PALETA_REMEDIOS[remedio.cor];
  const frequenciaTexto = formatarFrequencia(remedio);
  const mostraSemAviso = !remedio.lembreteAtivo && remedio.frequencia !== 'quando_precisar';

  function aoTocarParar() {
    Alert.alert(TEXTOS.detalhe.pararConfirmacaoTitulo(remedio.nome), TEXTOS.detalhe.pararConfirmacaoTexto, [
      { text: TEXTOS.detalhe.pararConfirmacaoCancelar, style: 'cancel' },
      {
        text: TEXTOS.detalhe.pararConfirmacaoSim,
        style: 'destructive',
        onPress: async () => {
          await repositorioRemedios.arquivar(remedio.id);
          registrar('remedio_arquivado', { tela: 'DetalheRemedio' });
          await reconciliar();
          mostrarBanner({ remedioId: remedio.id, nome: remedio.nome });
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.botaoVoltar}>
          <Ionicons name="chevron-back" size={28} color={CORES_SEMANTICAS.acao} />
          <TextoGrande token="corpo" cor={CORES_SEMANTICAS.acao}>
            {TEXTOS.detalhe.voltar}
          </TextoGrande>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.hero}>
          <View style={[styles.iconeCirculo, { backgroundColor: paleta.fundo }]}>
            <Ionicons name={FORMA_ICONE[remedio.forma]} size={40} color={paleta.detalhe} />
          </View>

          <TextoGrande token="display" style={styles.centralizado}>
            {remedio.nome}
          </TextoGrande>

          {remedio.dose ? (
            <TextoGrande token="corpo" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={[styles.centralizado, styles.espacoTopo]}>
              {remedio.dose}
            </TextoGrande>
          ) : null}
        </View>

        <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.sectionHeader}>
          {TEXTOS.detalhe.tituloDetalhes}
        </TextoGrande>
        <View style={styles.grupo}>
          <View style={[styles.linha, styles.linhaComBorda]}>
            <Ionicons name="time-outline" size={22} color={CORES_SEMANTICAS.acao} style={styles.linhaIcone} />
            <TextoGrande token="corpo">
              {remedio.frequencia === 'quando_precisar'
                ? TEXTOS.home.quandoPrecisar
                : remedio.horarios.map((h) => h.horaMinuto).join(', ')}
            </TextoGrande>
          </View>

          {frequenciaTexto ? (
            <View style={[styles.linha, styles.linhaComBorda]}>
              <Ionicons name="calendar-outline" size={22} color={CORES_SEMANTICAS.acao} style={styles.linhaIcone} />
              <TextoGrande token="corpo">{frequenciaTexto}</TextoGrande>
            </View>
          ) : null}

          {remedio.observacao ? (
            <View style={[styles.linha, styles.linhaComBorda]}>
              <Ionicons name="alert-circle-outline" size={22} color={CORES_SEMANTICAS.atencao} style={styles.linhaIcone} />
              <TextoGrande token="corpo" style={styles.linhaTextoFlex}>
                {remedio.observacao}
              </TextoGrande>
            </View>
          ) : null}

          <View style={styles.linha}>
            <Ionicons
              name={mostraSemAviso ? 'notifications-off-outline' : 'notifications-outline'}
              size={22}
              color={mostraSemAviso ? CORES_SEMANTICAS.neutroTextoSecundario : CORES_SEMANTICAS.acao}
              style={styles.linhaIcone}
            />
            <TextoGrande token="corpo" cor={mostraSemAviso ? CORES_SEMANTICAS.neutroTextoSecundario : CORES_SEMANTICAS.neutroTexto}>
              {mostraSemAviso ? TEXTOS.home.semAviso : TEXTOS.detalhe.avisosLigados}
            </TextoGrande>
          </View>
        </View>

        <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.sectionHeader}>
          {TEXTOS.detalhe.tituloAcoes}
        </TextoGrande>
        <View style={styles.grupo}>
          <Pressable
            onPress={() => router.push(`/remedio/${remedio.id}/editar`)}
            accessibilityRole="button"
            style={[styles.linhaAcao, styles.linhaComBorda]}
          >
            <TextoGrande token="corpo" cor={CORES_SEMANTICAS.acao}>
              {TEXTOS.detalhe.editar}
            </TextoGrande>
          </Pressable>
          <Pressable onPress={aoTocarParar} accessibilityRole="button" style={styles.linhaAcao}>
            <TextoGrande token="corpo" cor={CORES_SEMANTICAS.perigo}>
              {TEXTOS.detalhe.parar}
            </TextoGrande>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES_SEMANTICAS.neutroFundo,
  },
  carregando: {
    flex: 1,
  },
  topo: {
    paddingHorizontal: ESPACAMENTO.margemLateralTela,
    paddingTop: 8,
  },
  botaoVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOQUE_MINIMO,
    alignSelf: 'flex-start',
  },
  conteudo: {
    padding: ESPACAMENTO.margemLateralTela,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 24,
  },
  iconeCirculo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  centralizado: {
    textAlign: 'center',
  },
  espacoTopo: {
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 8,
    marginLeft: 4,
  },
  grupo: {
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    borderRadius: RAIO.card,
    overflow: 'hidden',
    marginBottom: 24,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOQUE_MINIMO,
    paddingHorizontal: 16,
    gap: 12,
  },
  linhaComBorda: {
    borderBottomWidth: 1,
    borderBottomColor: CORES_SEMANTICAS.neutroBorda,
  },
  linhaIcone: {
    flexShrink: 0,
  },
  linhaTextoFlex: {
    flex: 1,
  },
  linhaAcao: {
    minHeight: TOQUE_MINIMO,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
