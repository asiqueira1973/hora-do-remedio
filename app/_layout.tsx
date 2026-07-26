import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BotaoPrimario } from '../src/components/BotaoPrimario';
import { TextoGrande } from '../src/components/TextoGrande';
import { inicializarBanco } from '../src/db/client';
import { PreferencesProvider } from '../src/features/settings/PreferencesContext';
import { CORES_SEMANTICAS } from '../src/theme/colors';
import { TEXTOS } from '../src/constants/textos';

// Segura a splash nativa até a fonte carregar e o banco migrar (8.0) — só
// então a primeira tela aparece, nunca uma tela branca no meio do caminho.
SplashScreen.preventAutoHideAsync();

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
    <PreferencesProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PreferencesProvider>
  );
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
