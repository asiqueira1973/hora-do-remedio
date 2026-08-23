import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '../../src/components/BotaoPrimario';
import { TextoGrande } from '../../src/components/TextoGrande';
import { TEXTOS } from '../../src/constants/textos';
import { repositorioPreferencias } from '../../src/repositories/preferences';
import { CORES_SEMANTICAS } from '../../src/theme/colors';
import { ESPACAMENTO } from '../../src/theme/spacing';

/**
 * Onboarding, tela 2 de 2 (8.7, rota `/onboarding/privacidade`).
 *
 * Recebe: nada.
 * Devolve: ilustração + a frase de privacidade + "Começar".
 *
 * Implementa o fim do fluxo da 8.7: "Começar" grava
 * `onboarding_concluido_em` e abre a Home no estado vazio — nada de
 * nome, idade ou permissão é pedido aqui.
 */
export default function OnboardingTela2() {
  async function aoTocarComecar() {
    await repositorioPreferencias.concluirOnboarding();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
        <View style={styles.ilustracao}>
          <Ionicons name="lock-closed-outline" size={72} color={CORES_SEMANTICAS.acao} />
        </View>
        <TextoGrande token="display" style={styles.texto}>
          {TEXTOS.onboarding.tela2Titulo}
        </TextoGrande>
        <TextoGrande token="corpo" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.texto}>
          {TEXTOS.onboarding.tela2Texto}
        </TextoGrande>
      </View>
      <View style={styles.botao}>
        <BotaoPrimario texto={TEXTOS.onboarding.tela2Botao} onPress={aoTocarComecar} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES_SEMANTICAS.neutroFundo,
    justifyContent: 'space-between',
    padding: ESPACAMENTO.margemLateralTela,
  },
  conteudo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ilustracao: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  texto: {
    textAlign: 'center',
  },
  botao: {
    paddingBottom: 24,
  },
});
