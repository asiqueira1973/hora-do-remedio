import { Ionicons } from '@expo/vector-icons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoDestrutivo } from '../../src/components/BotaoDestrutivo';
import { TextoGrande } from '../../src/components/TextoGrande';
import { TEXTOS } from '../../src/constants/textos';
import { registrar } from '../../src/features/analytics/analytics';
import { compartilhar, gerarTexto } from '../../src/features/export/exportadorLista';
import { reconciliar } from '../../src/features/reminders/reconciliadorLembretes';
import { servicoLembretes } from '../../src/features/reminders/servicoLembretes';
import { usePreferences } from '../../src/features/settings/PreferencesContext';
import { remedioParaDominio, repositorioRemedios } from '../../src/repositories/medications';
import { repositorioPreferencias } from '../../src/repositories/preferences';
import { CORES_SEMANTICAS } from '../../src/theme/colors';
import { obterEstiloTipografico } from '../../src/theme/typography';
import { ESPACAMENTO, RAIO, TOQUE_MINIMO } from '../../src/theme/spacing';
import type { EscalaFonte } from '../../src/types/domain';

/**
 * Tela de Ajustes (8.6, rota `/ajustes`).
 *
 * Recebe: nada.
 * Devolve: os itens da tabela da 8.6, nesta ordem — Tamanho das letras,
 * Som do aviso, Remédios que parei, Compartilhar minha lista, Sobre o
 * app, Apagar todos os meus dados.
 */
export default function AjustesScreen() {
  const { escalaFonte, somLembrete } = usePreferences();
  const { data: linhas } = useLiveQuery(repositorioRemedios.queryAtivos());
  const remedios = (linhas ?? []).map(remedioParaDominio);

  async function aoEscolherEscala(escala: EscalaFonte) {
    await repositorioPreferencias.atualizarEscalaFonte(escala);
    registrar('escala_fonte_alterada', { tela: 'Ajustes', propriedades: { escala } });
  }

  async function aoAlternarSom(ligado: boolean) {
    await repositorioPreferencias.atualizarSomLembrete(ligado);
    registrar('som_aviso_alterado', { tela: 'Ajustes', propriedades: { ligado } });
    await reconciliar();
  }

  function aoTocarCompartilhar() {
    registrar('lista_compartilhada', { tela: 'Ajustes', propriedades: { quantidadeRemedios: remedios.length } });
    compartilhar(gerarTexto(remedios));
  }

  function aoTocarApagarTudo() {
    Alert.alert(TEXTOS.ajustes.apagarConfirmacao1Titulo, TEXTOS.ajustes.apagarConfirmacao1Texto, [
      { text: TEXTOS.ajustes.apagarConfirmacao1Cancelar, style: 'cancel' },
      {
        text: TEXTOS.ajustes.apagarConfirmacao1Continuar,
        style: 'destructive',
        onPress: () => {
          Alert.alert(TEXTOS.ajustes.apagarConfirmacao2Titulo, TEXTOS.ajustes.apagarConfirmacao2Texto, [
            { text: TEXTOS.ajustes.apagarConfirmacao2Cancelar, style: 'cancel' },
            {
              text: TEXTOS.ajustes.apagarConfirmacao2Confirmar,
              style: 'destructive',
              onPress: async () => {
                await servicoLembretes.cancelarTudo();
                await repositorioPreferencias.apagarTudo();
                registrar('todos_dados_apagados', { tela: 'Ajustes' });
                router.replace('/');
              },
            },
          ]);
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
        <TextoGrande token="display" style={styles.titulo}>
          {TEXTOS.ajustes.titulo}
        </TextoGrande>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <SectionHeader texto={TEXTOS.ajustes.tamanhoLetras} />
        <View style={[styles.grupo, styles.escalaGrupo]}>
          <BotaoEscala escala="grande" selecionada={escalaFonte === 'grande'} onPress={() => aoEscolherEscala('grande')} />
          <BotaoEscala escala="gigante" selecionada={escalaFonte === 'gigante'} onPress={() => aoEscolherEscala('gigante')} />
        </View>

        <SectionHeader texto={TEXTOS.ajustes.somAviso} />
        <View style={styles.grupo}>
          <View style={styles.linha}>
            <Ionicons name="volume-high-outline" size={22} color={CORES_SEMANTICAS.acao} />
            <TextoGrande token="corpo" style={styles.linhaTextoFlex}>
              {TEXTOS.ajustes.somAviso}
            </TextoGrande>
            <Switch value={somLembrete} onValueChange={aoAlternarSom} trackColor={{ true: CORES_SEMANTICAS.acao, false: undefined }} />
          </View>
        </View>

        <SectionHeader texto={TEXTOS.ajustes.tituloRemedios} />
        <View style={styles.grupo}>
          <Pressable
            onPress={() => router.push('/ajustes/arquivados')}
            accessibilityRole="button"
            style={[styles.linha, styles.linhaComBorda]}
          >
            <Ionicons name="archive-outline" size={22} color={CORES_SEMANTICAS.acao} />
            <TextoGrande token="corpo" style={styles.linhaTextoFlex}>
              {TEXTOS.ajustes.arquivados}
            </TextoGrande>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </Pressable>

          <Pressable
            onPress={aoTocarCompartilhar}
            disabled={remedios.length === 0}
            accessibilityRole="button"
            style={[styles.linha, remedios.length === 0 && styles.linhaDesabilitada]}
          >
            <Ionicons
              name="share-outline"
              size={22}
              color={remedios.length === 0 ? CORES_SEMANTICAS.neutroTextoSecundario : CORES_SEMANTICAS.acao}
            />
            <TextoGrande
              token="corpo"
              cor={remedios.length === 0 ? CORES_SEMANTICAS.neutroTextoSecundario : CORES_SEMANTICAS.neutroTexto}
              style={styles.linhaTextoFlex}
            >
              {remedios.length === 0 ? TEXTOS.home.botaoCompartilharDesabilitado : TEXTOS.home.botaoCompartilhar}
            </TextoGrande>
          </Pressable>
        </View>

        <SectionHeader texto={TEXTOS.ajustes.tituloSobre} />
        <View style={styles.grupo}>
          <Pressable onPress={() => router.push('/ajustes/sobre')} accessibilityRole="button" style={styles.linha}>
            <Ionicons name="information-circle-outline" size={22} color={CORES_SEMANTICAS.acao} />
            <TextoGrande token="corpo" style={styles.linhaTextoFlex}>
              {TEXTOS.ajustes.sobre}
            </TextoGrande>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </Pressable>
        </View>

        <View style={[styles.grupo, styles.apagarGrupo]}>
          <BotaoDestrutivo texto={TEXTOS.ajustes.apagarTudo} onPress={aoTocarApagarTudo} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BotaoEscala({ escala, selecionada, onPress }: { escala: EscalaFonte; selecionada: boolean; onPress: () => void }) {
  const estiloExemplo = obterEstiloTipografico('corpo', escala);
  const rotulo = escala === 'grande' ? TEXTOS.ajustes.tamanhoGrande : TEXTOS.ajustes.tamanhoGigante;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: selecionada, checked: selecionada }}
      accessibilityLabel={rotulo}
      style={[styles.botaoEscala, selecionada && styles.botaoEscalaMarcado]}
    >
      <TextoGrande token="apoio" cor={selecionada ? CORES_SEMANTICAS.acao : CORES_SEMANTICAS.neutroTexto}>
        {rotulo}
      </TextoGrande>
      <Text style={[estiloExemplo, styles.escalaExemplo, selecionada && { color: CORES_SEMANTICAS.acao }]} numberOfLines={1}>
        {TEXTOS.ajustes.tamanhoExemplo}
      </Text>
    </Pressable>
  );
}

function SectionHeader({ texto }: { texto: string }) {
  return (
    <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.sectionHeader}>
      {texto.toUpperCase()}
    </TextoGrande>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES_SEMANTICAS.neutroFundo,
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
  titulo: {
    marginTop: 8,
    marginBottom: 16,
  },
  conteudo: {
    paddingHorizontal: ESPACAMENTO.margemLateralTela,
    paddingBottom: 48,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  grupo: {
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    borderRadius: RAIO.card,
    overflow: 'hidden',
  },
  escalaGrupo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
    padding: 0,
  },
  botaoEscala: {
    flex: 1,
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.card,
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  botaoEscalaMarcado: {
    borderWidth: 2,
    borderColor: CORES_SEMANTICAS.acao,
  },
  escalaExemplo: {
    color: CORES_SEMANTICAS.neutroTexto,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOQUE_MINIMO,
    paddingHorizontal: 16,
    gap: 12,
  },
  linhaTextoFlex: {
    flex: 1,
  },
  linhaComBorda: {
    borderBottomWidth: 1,
    borderBottomColor: CORES_SEMANTICAS.neutroBorda,
  },
  linhaDesabilitada: {
    opacity: 0.5,
  },
  apagarGrupo: {
    marginTop: 32,
    backgroundColor: 'transparent',
  },
});
