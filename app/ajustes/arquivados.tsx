import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { TextoGrande } from '../../src/components/TextoGrande';
import { TEXTOS } from '../../src/constants/textos';
import { FORMA_ICONE } from '../../src/features/medications/formaIcone';
import { reconciliar } from '../../src/features/reminders/reconciliadorLembretes';
import { remedioParaDominio, repositorioRemedios } from '../../src/repositories/medications';
import { PALETA_REMEDIOS, CORES_SEMANTICAS } from '../../src/theme/colors';
import { ESPACAMENTO, RAIO, TOQUE_MINIMO } from '../../src/theme/spacing';
import type { RemedioComHorarios } from '../../src/types/domain';

/**
 * "Remédios que parei" (8.3, rota `/ajustes/arquivados`).
 *
 * Recebe: nada.
 * Devolve: a lista de remédios arquivados, cada um com o botão
 * "Voltar a tomar".
 *
 * Implementa o critério de aceite de 8.3: lista exatamente os remédios
 * com `arquivado_em` preenchido, e "Voltar a tomar" limpa esse campo,
 * trazendo os horários originais intactos (repositorioRemedios.
 * desarquivar, 13-A.1).
 */
export default function ArquivadosScreen() {
  const { data: linhas } = useLiveQuery(repositorioRemedios.queryArquivados());
  const remedios = (linhas ?? []).map(remedioParaDominio);

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
          {TEXTOS.ajustes.arquivados}
        </TextoGrande>
      </View>

      {remedios.length === 0 ? (
        <View style={styles.vazio}>
          <TextoGrande token="corpo" cor="#6B6B70" style={styles.vazioTexto}>
            {TEXTOS.arquivados.vazio}
          </TextoGrande>
        </View>
      ) : (
        <FlatList
          data={remedios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => <ItemArquivado remedio={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function ItemArquivado({ remedio }: { remedio: RemedioComHorarios }) {
  const paleta = PALETA_REMEDIOS[remedio.cor];

  return (
    <View style={[styles.item, { backgroundColor: paleta.fundo }]}>
      <View style={styles.itemLinha}>
        <View style={styles.itemIcone}>
          <Ionicons name={FORMA_ICONE[remedio.forma]} size={28} color={paleta.detalhe} />
        </View>
        <View style={styles.itemTexto}>
          <TextoGrande token="titulo" cor={paleta.texto}>
            {remedio.nome}
          </TextoGrande>
          {remedio.dose ? (
            <TextoGrande token="corpo" cor={paleta.texto}>
              {remedio.dose}
            </TextoGrande>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={async () => {
          await repositorioRemedios.desarquivar(remedio.id);
          await reconciliar();
        }}
        accessibilityRole="button"
        accessibilityLabel={TEXTOS.arquivados.voltarATomar}
        style={styles.botaoVoltarATomar}
      >
        <TextoGrande token="corpo" cor={CORES_SEMANTICAS.acao}>
          {TEXTOS.arquivados.voltarATomar}
        </TextoGrande>
      </Pressable>
    </View>
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
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  vazioTexto: {
    textAlign: 'center',
  },
  lista: {
    paddingHorizontal: ESPACAMENTO.margemLateralTela,
    paddingBottom: 32,
  },
  item: {
    borderRadius: RAIO.card,
    padding: ESPACAMENTO.paddingCard,
    marginBottom: ESPACAMENTO.entreCards,
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIcone: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTexto: {
    flex: 1,
  },
  botaoVoltarATomar: {
    minHeight: TOQUE_MINIMO,
    justifyContent: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
});
