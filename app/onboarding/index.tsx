import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '../../src/components/BotaoPrimario';
import { TextoGrande } from '../../src/components/TextoGrande';
import { TEXTOS } from '../../src/constants/textos';
import { CORES_SEMANTICAS } from '../../src/theme/colors';
import { ESPACAMENTO } from '../../src/theme/spacing';

/**
 * Onboarding, tela 1 de 2 (8.7, rota `/onboarding`).
 *
 * Recebe: nada.
 * Devolve: ilustração + a frase de proposta do app + "Continuar".
 *
 * Implementa o fluxo da 8.7: só diz o que o app faz, não pede nenhum
 * dado pessoal nem permissão (isso fica para o 8.4, no primeiro remédio
 * com lembrete).
 */
export default function OnboardingTela1() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
        <View style={styles.ilustracao}>
          <Ionicons name="medical-outline" size={72} color={CORES_SEMANTICAS.acao} />
        </View>
        <TextoGrande token="display" style={styles.texto}>
          {TEXTOS.onboarding.tela1Titulo}
        </TextoGrande>
        <TextoGrande token="corpo" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.texto}>
          {TEXTOS.onboarding.tela1Texto}
        </TextoGrande>
      </View>
      <View style={styles.botao}>
        <BotaoPrimario texto={TEXTOS.onboarding.tela1Botao} onPress={() => router.push('/onboarding/privacidade')} />
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
