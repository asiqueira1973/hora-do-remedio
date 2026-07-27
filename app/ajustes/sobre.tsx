import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import appJson from '../../app.json';
import { TextoGrande } from '../../src/components/TextoGrande';
import { TEXTOS } from '../../src/constants/textos';
import { CORES_SEMANTICAS } from '../../src/theme/colors';
import { ESPACAMENTO, TOQUE_MINIMO } from '../../src/theme/spacing';

/**
 * "Sobre o app" (8.6, rota `/ajustes/sobre`).
 *
 * Recebe: nada.
 * Devolve: versão do app, a frase de privacidade e o link para a
 * Política de Privacidade — nada mais (8.6: "e nada mais").
 *
 * O link abre no navegador padrão via `Linking.openURL` (nunca dentro de
 * uma WebView do app), e o iOS volta sozinho ao Hora do Remédio ao
 * fechar o navegador — não há nada a fazer aqui para isso funcionar.
 */
export default function SobreScreen() {
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
          {TEXTOS.ajustes.sobre}
        </TextoGrande>
      </View>

      <View style={styles.conteudo}>
        <TextoGrande token="corpo" cor="#6B6B70">
          {`Versão ${appJson.expo.version}`}
        </TextoGrande>
        <TextoGrande token="corpo" style={styles.privacidade}>
          {TEXTOS.ajustes.privacidade}
        </TextoGrande>
        <Pressable
          onPress={() => Linking.openURL(TEXTOS.sobre.urlPoliticaPrivacidade)}
          accessibilityRole="link"
          style={styles.linkBotao}
        >
          <TextoGrande token="corpo" cor={CORES_SEMANTICAS.acao}>
            {TEXTOS.sobre.politicaPrivacidade}
          </TextoGrande>
        </Pressable>
      </View>
    </SafeAreaView>
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
    gap: 16,
  },
  privacidade: {
    marginTop: 8,
  },
  linkBotao: {
    minHeight: TOQUE_MINIMO,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
