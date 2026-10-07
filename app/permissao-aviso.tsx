import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '../src/components/BotaoPrimario';
import { BotaoSecundario } from '../src/components/BotaoSecundario';
import { TextoGrande } from '../src/components/TextoGrande';
import { TEXTOS } from '../src/constants/textos';
import { registrar } from '../src/features/analytics/analytics';
import { reconciliar } from '../src/features/reminders/reconciliadorLembretes';
import { servicoLembretes } from '../src/features/reminders/servicoLembretes';
import { CORES_SEMANTICAS } from '../src/theme/colors';
import { ESPACAMENTO } from '../src/theme/spacing';

/**
 * Tela explicativa de permissão de aviso (8.4, rota `/permissao-aviso`,
 * modal). Aparece antes do diálogo nativo do iOS, só no primeiro remédio
 * salvo com lembrete ligado.
 *
 * Recebe: nada.
 * Devolve: a explicação + "Continuar" (dispara o diálogo do iOS) ou
 * "Agora não" (pula o diálogo por enquanto).
 *
 * Implementa o fluxo de permissão da 8.4: "Antes do diálogo do iOS, uma
 * tela própria explica... Na próxima tela, toque em Permitir." Em
 * qualquer um dos dois casos, roda a reconciliação (11.5) e volta para a
 * Home — o remédio já foi salvo antes de chegar aqui, então não há nada
 * a desfazer se a pessoa negar.
 */
export default function PermissaoAvisoScreen() {
  async function aoContinuar() {
    const resultado = await servicoLembretes.pedirPermissao();
    registrar('permissao_notificacao_respondida', { tela: 'PermissaoAviso', propriedades: { resultado } });
    await reconciliar();
    router.replace('/');
  }

  async function aoTocarAgoraNao() {
    registrar('permissao_notificacao_respondida', { tela: 'PermissaoAviso', propriedades: { resultado: 'pulado' } });
    await reconciliar();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
        <TextoGrande token="titulo" style={styles.texto}>
          {TEXTOS.permissao.titulo}
        </TextoGrande>
        <TextoGrande token="corpo" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.texto}>
          {TEXTOS.permissao.texto}
        </TextoGrande>
      </View>
      <View style={styles.botoes}>
        <BotaoPrimario texto={TEXTOS.permissao.continuar} onPress={aoContinuar} />
        <BotaoSecundario texto={TEXTOS.permissao.agoraNao} onPress={aoTocarAgoraNao} />
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
    justifyContent: 'center',
    gap: 16,
  },
  texto: {
    textAlign: 'center',
  },
  botoes: {
    gap: 12,
    paddingBottom: 24,
  },
});
