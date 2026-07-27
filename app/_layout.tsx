import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BotaoPrimario } from '../src/components/BotaoPrimario';
import { TextoGrande } from '../src/components/TextoGrande';
import { inicializarBanco } from '../src/db/client';
import { ArchiveBannerProvider } from '../src/features/medications/ArchiveBannerContext';
import { reconciliar } from '../src/features/reminders/reconciliadorLembretes';
import { PreferencesProvider, usePreferences } from '../src/features/settings/PreferencesContext';
import { CORES_SEMANTICAS } from '../src/theme/colors';
import { TEXTOS } from '../src/constants/textos';

// Segura a splash nativa até a fonte carregar e o banco migrar (8.0) — só
// então a primeira tela aparece, nunca uma tela branca no meio do caminho.
SplashScreen.preventAutoHideAsync();

// Comportamento da notificação com o app aberto em primeiro plano: mostra
// igual a uma notificação normal, respeitando o som (que já vem definido
// por remédio no agendamento — 15.3/13-A.2). API atual do SDK 54, sem os
// campos depreciados (4.6).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Acima de 1 hora em background, a volta ao app dispara reconciliação (11.5). */
const LIMIAR_RECONCILIACAO_MS = 60 * 60 * 1000;

/**
 * Layout raiz do app: carrega a Nunito, inicializa o banco (migrations +
 * seed) e só libera a splash quando os dois terminarem.
 *
 * Recebe: nada (é o root do Expo Router).
 * Devolve: a árvore de rotas dentro do `PreferencesProvider`, ou a tela de
 * erro da regra 12.4 se a inicialização do banco falhar.
 *
 * Implementa a seção 8.0: "Inicialização: abre o banco, aplica PRAGMA
 * foreign_keys = ON e journal_mode = WAL, roda migrations, roda o seed, e
 * só então libera a splash."
 */
export default function RootLayout() {
  const [fontesCarregadas, erroFontes] = useFonts({
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
  });

  const [estadoBanco, setEstadoBanco] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const ultimaVezAtivoRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelado = false;

    inicializarBanco()
      .then(() => {
        if (!cancelado) setEstadoBanco('pronto');
      })
      .catch((erro) => {
        console.error('Falha ao inicializar o banco:', erro);
        if (!cancelado) setEstadoBanco('erro');
      });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (fontesCarregadas && estadoBanco !== 'carregando') {
      SplashScreen.hideAsync();
    }
  }, [fontesCarregadas, estadoBanco]);

  // Reconciliação (11.5): roda na abertura do app, depois da migration, sem
  // travar a interface (por isso não é `await`ada aqui), e de novo sempre
  // que o app volta do background depois de mais de 1 hora.
  useEffect(() => {
    if (estadoBanco !== 'pronto') return;

    reconciliar().catch((erro) => console.error('[reconciliação] falha na abertura', erro));
    ultimaVezAtivoRef.current = Date.now();

    const assinatura = AppState.addEventListener('change', (proximoEstado: AppStateStatus) => {
      if (proximoEstado !== 'active') return;
      const agora = Date.now();
      if (agora - ultimaVezAtivoRef.current > LIMIAR_RECONCILIACAO_MS) {
        reconciliar().catch((erro) => console.error('[reconciliação] falha ao voltar do background', erro));
      }
      ultimaVezAtivoRef.current = agora;
    });

    return () => assinatura.remove();
  }, [estadoBanco]);

  if (!fontesCarregadas && !erroFontes) {
    return null;
  }

  if (estadoBanco === 'carregando') {
    return null;
  }

  if (estadoBanco === 'erro') {
    return (
      <TelaErroBanco
        aoTentarNovamente={() => {
          setEstadoBanco('carregando');
          inicializarBanco()
            .then(() => setEstadoBanco('pronto'))
            .catch((erro) => {
              console.error('Falha ao inicializar o banco:', erro);
              setEstadoBanco('erro');
            });
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <ArchiveBannerProvider>
          <PortaoOnboarding />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="permissao-aviso" options={{ presentation: 'modal' }} />
          </Stack>
        </ArchiveBannerProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

/**
 * Mantém a rota coerente com `preferencias.onboarding_concluido_em` nos
 * dois sentidos: manda para o onboarding (8.7) enquanto ele estiver vazio
 * — na primeira abertura e de novo depois de "Apagar todos os meus
 * dados" (8.6), que recria a linha de `preferencias` do zero — e manda
 * de volta para a Home se, por algum motivo, a pessoa ainda estiver no
 * onboarding depois dele já ter sido concluído.
 *
 * As duas direções importam: `concluirOnboarding()` grava no banco e
 * `useLiveQuery` propaga a mudança de forma assíncrona, então a tela de
 * onboarding também chama `router.replace('/')` sozinha ao terminar — se
 * esse replace acontecer um instante antes do valor reativo atualizar,
 * só o segundo `if` aqui embaixo corrige a rota; sem ele a pessoa fica
 * presa de volta no onboarding.
 *
 * Recebe: nada.
 * Devolve: nada — só o efeito de navegação; não renderiza UI própria.
 */
function PortaoOnboarding() {
  const { onboardingConcluidoEm, carregando } = usePreferences();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;
    const jaEstaNoOnboarding = pathname.startsWith('/onboarding');
    if (!onboardingConcluidoEm && !jaEstaNoOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingConcluidoEm && jaEstaNoOnboarding) {
      router.replace('/');
    }
  }, [carregando, onboardingConcluidoEm, pathname, router]);

  return null;
}

/**
 * Tela cheia de erro quando o banco não abre (regra 12.4). Nunca some
 * sozinha e nunca apaga o banco automaticamente — só o botão "Tentar de
 * novo" tenta reinicializar.
 */
function TelaErroBanco({ aoTentarNovamente }: { aoTentarNovamente: () => void }) {
  return (
    <View style={styles.containerErro}>
      <TextoGrande token="titulo" style={styles.centralizado}>
        {TEXTOS.erro.bancoTitulo}
      </TextoGrande>
      <TextoGrande token="corpo" style={styles.centralizado}>
        {TEXTOS.erro.bancoTexto}
      </TextoGrande>
      <View style={styles.botaoWrapper}>
        <BotaoPrimario texto={TEXTOS.erro.bancoBotao} onPress={aoTentarNovamente} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerErro: {
    flex: 1,
    backgroundColor: CORES_SEMANTICAS.neutroFundo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  centralizado: {
    textAlign: 'center',
  },
  botaoWrapper: {
    marginTop: 24,
    width: '100%',
  },
});
