import { Ionicons } from '@expo/vector-icons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoDestrutivo } from '../../../src/components/BotaoDestrutivo';
import { BotaoPrimario } from '../../../src/components/BotaoPrimario';
import { BotaoSecundario } from '../../../src/components/BotaoSecundario';
import { TextoGrande } from '../../../src/components/TextoGrande';
import { TEXTOS } from '../../../src/constants/textos';
import { FORMA_ICONE } from '../../../src/features/medications/formaIcone';
import { formatarFrequencia } from '../../../src/features/medications/formatarFrequencia';
import { useArchiveBanner } from '../../../src/features/medications/ArchiveBannerContext';
import { reconciliar } from '../../../src/features/reminders/reconciliadorLembretes';
import { remedioParaDominio, repositorioRemedios } from '../../../src/repositories/medications';
import { PALETA_REMEDIOS } from '../../../src/theme/colors';
import { ESPACAMENTO, RAIO } from '../../../src/theme/spacing';

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
          await reconciliar();
          mostrarBanner({ remedioId: remedio.id, nome: remedio.nome });
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={[styles.cartao, { backgroundColor: paleta.fundo }]}>
          <View style={styles.iconeCirculo}>
            <Ionicons name={FORMA_ICONE[remedio.forma]} size={44} color={paleta.detalhe} />
          </View>

          <TextoGrande token="display" cor={paleta.texto} style={styles.espacoTopo}>
            {remedio.nome}
          </TextoGrande>

          {remedio.dose ? (
            <TextoGrande token="corpo" cor={paleta.texto} style={styles.espacoTopo}>
              {remedio.dose}
            </TextoGrande>
          ) : null}

          <TextoGrande token="apoio" cor={paleta.texto} style={styles.espacoTopo}>
            {remedio.frequencia === 'quando_precisar' ? TEXTOS.home.quandoPrecisar : remedio.horarios.map((h) => h.horaMinuto).join(', ')}
          </TextoGrande>

          {frequenciaTexto ? (
            <TextoGrande token="apoio" cor={paleta.texto} style={styles.espacoTopo}>
              {frequenciaTexto}
            </TextoGrande>
          ) : null}

          {remedio.observacao ? (
            <TextoGrande token="corpo" cor={paleta.texto} style={styles.espacoTopo}>
              ⚠️ {remedio.observacao}
            </TextoGrande>
          ) : null}

          {mostraSemAviso ? (
            <View style={styles.semAvisoLinha}>
              <Ionicons name="notifications-off-outline" size={22} color={paleta.texto} />
              <TextoGrande token="apoio" cor={paleta.texto} style={styles.semAvisoTexto}>
                {TEXTOS.home.semAviso}
              </TextoGrande>
            </View>
          ) : null}
        </View>

        <View style={styles.botoes}>
          <BotaoPrimario texto={TEXTOS.detalhe.editar} onPress={() => router.push(`/remedio/${remedio.id}/editar`)} />
          <BotaoDestrutivo texto={TEXTOS.detalhe.parar} onPress={aoTocarParar} />
          <BotaoSecundario texto={TEXTOS.detalhe.voltar} onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  carregando: {
    flex: 1,
  },
  conteudo: {
    padding: ESPACAMENTO.margemLateralTela,
  },
  cartao: {
    borderRadius: RAIO.card,
    padding: ESPACAMENTO.paddingCard,
  },
  iconeCirculo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  espacoTopo: {
    marginTop: 8,
  },
  semAvisoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  semAvisoTexto: {
    marginTop: 0,
  },
  botoes: {
    marginTop: 24,
    gap: 16,
  },
});
