import { Ionicons } from '@expo/vector-icons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextoGrande } from '../src/components/TextoGrande';
import { TEXTOS } from '../src/constants/textos';
import { agruparPorHorario, ROTULOS_FAIXA } from '../src/features/medications/agruparPorHorario';
import { useArchiveBanner } from '../src/features/medications/ArchiveBannerContext';
import { MedicationCard } from '../src/features/medications/MedicationCard';
import { remedioParaDominio, repositorioRemedios } from '../src/repositories/medications';
import { CORES_SEMANTICAS } from '../src/theme/colors';
import { ALTURAS, ESPACAMENTO, SOMBRA, TOQUE_MINIMO } from '../src/theme/spacing';
import type { RemedioComHorarios } from '../src/types/domain';

const DIAS_SEMANA_EXTENSO = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const MESES_EXTENSO = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * Saudação por período do dia (11.6): manhã 05:00–11:59, tarde
 * 12:00–17:59, noite 18:00–04:59 (faixa diferente da do agrupamento de
 * card — aqui é só 3 períodos, não 4).
 */
function obterSaudacao(hora: number): string {
  if (hora >= 5 && hora < 12) return TEXTOS.home.saudacaoManha;
  if (hora >= 12 && hora < 18) return TEXTOS.home.saudacaoTarde;
  return TEXTOS.home.saudacaoNoite;
}

/** Data por extenso no formato do exemplo da 8.1: "Domingo, 26 de julho". */
function formatarDataPorExtenso(data: Date): string {
  return `${DIAS_SEMANA_EXTENSO[data.getDay()]}, ${data.getDate()} de ${MESES_EXTENSO[data.getMonth()]}`;
}

interface Secao {
  key: string;
  titulo: string;
  data: RemedioComHorarios[];
}

/**
 * Tela principal (8.1): lista os remédios ativos, agrupados por horário.
 *
 * Recebe: nada (rota `/`, seção 10).
 * Devolve: a Home renderizada, reagindo ao banco via `useLiveQuery` — ao
 * cadastrar um remédio a lista atualiza sozinha, sem reload manual.
 *
 * Implementa o fluxo completo da 8.1: cabeçalho com saudação e data,
 * agrupamento por horário (11.7, via `agruparPorHorario`), bloco "Quando
 * precisar" separado, estado vazio, e o FAB "+ Adicionar remédio".
 */
export default function Home() {
  const router = useRouter();
  const agora = new Date();
  const { data: linhas } = useLiveQuery(repositorioRemedios.queryAtivos());
  const { banner, ocultarBanner } = useArchiveBanner();

  const remedios = (linhas ?? []).map(remedioParaDominio);
  const { grupos, quandoPrecisar } = agruparPorHorario(remedios);

  const secoes: Secao[] = [
    ...grupos.map((grupo) => ({
      key: grupo.horaMinuto,
      titulo: `${ROTULOS_FAIXA[grupo.faixa]} — ${grupo.horaMinuto}`,
      data: grupo.itens.map((item) => item.remedio),
    })),
    ...(quandoPrecisar.length > 0
      ? [{ key: 'quando-precisar', titulo: TEXTOS.home.quandoPrecisar, data: quandoPrecisar }]
      : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <TextoGrande token="display">{obterSaudacao(agora.getHours())}</TextoGrande>
        <TextoGrande token="apoio" cor="#6B6B70" style={styles.data}>
          {formatarDataPorExtenso(agora)}
        </TextoGrande>
      </View>

      {remedios.length === 0 ? (
        <View style={styles.vazio}>
          <View style={styles.vazioIlustracao}>
            <Ionicons name="medical-outline" size={56} color={CORES_SEMANTICAS.acao} />
          </View>
          <TextoGrande token="titulo" style={styles.vazioTexto}>
            {TEXTOS.home.vazioTitulo}
          </TextoGrande>
          <TextoGrande token="corpo" cor="#6B6B70" style={styles.vazioTexto}>
            {TEXTOS.home.vazioTexto}
          </TextoGrande>
        </View>
      ) : (
        <SectionList
          sections={secoes}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.lista}
          renderSectionHeader={({ section }) => (
            <TextoGrande token="apoio" cor="#6B6B70" style={styles.cabecalhoGrupo}>
              {section.titulo}
            </TextoGrande>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <MedicationCard remedio={item} onPress={() => router.push(`/remedio/${item.id}`)} />
            </View>
          )}
        />
      )}

      <View style={styles.fabWrapper}>
        <Pressable
          onPress={() => router.push('/remedio/novo')}
          accessibilityRole="button"
          accessibilityLabel={TEXTOS.home.botaoAdicionar}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressionado]}
        >
          <Ionicons name="add-circle" size={28} color="#FFFFFF" style={styles.fabIcone} />
          <TextoGrande token="botao" cor="#FFFFFF">
            {TEXTOS.home.botaoAdicionar}
          </TextoGrande>
        </Pressable>
      </View>

      {banner ? (
        <View style={styles.faixa}>
          <TextoGrande token="corpo" cor="#FFFFFF" style={styles.faixaTexto}>
            {TEXTOS.detalhe.arquivadoFaixa(banner.nome)}
          </TextoGrande>
          <Pressable
            onPress={async () => {
              await repositorioRemedios.desarquivar(banner.remedioId);
              ocultarBanner();
            }}
            accessibilityRole="button"
            style={styles.faixaBotao}
          >
            <TextoGrande token="botao" cor="#FFFFFF">
              {TEXTOS.detalhe.arquivadoDesfazer}
            </TextoGrande>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES_SEMANTICAS.neutroFundo,
  },
  cabecalho: {
    paddingHorizontal: ESPACAMENTO.margemLateralTela,
    paddingTop: 16,
    paddingBottom: 8,
  },
  data: {
    marginTop: 4,
  },
  lista: {
    paddingHorizontal: ESPACAMENTO.margemLateralTela,
    paddingBottom: ALTURAS.fab + 48,
  },
  cabecalhoGrupo: {
    marginTop: 20,
    marginBottom: 10,
  },
  itemCard: {
    marginBottom: ESPACAMENTO.entreCards,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  vazioIlustracao: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vazioTexto: {
    textAlign: 'center',
  },
  fabWrapper: {
    position: 'absolute',
    right: ESPACAMENTO.margemLateralTela,
    bottom: 24,
  },
  fab: {
    flexDirection: 'row',
    minHeight: ALTURAS.fab,
    minWidth: TOQUE_MINIMO,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTURAS.fab / 2,
    backgroundColor: CORES_SEMANTICAS.acao,
    ...SOMBRA,
  },
  fabPressionado: {
    opacity: 0.9,
  },
  fabIcone: {
    marginRight: 8,
  },
  faixa: {
    position: 'absolute',
    left: ESPACAMENTO.margemLateralTela,
    right: ESPACAMENTO.margemLateralTela,
    bottom: 24 + ALTURAS.fab + 16,
    minHeight: TOQUE_MINIMO,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  faixaTexto: {
    flex: 1,
  },
  faixaBotao: {
    minHeight: TOQUE_MINIMO,
    justifyContent: 'center',
    paddingLeft: 16,
  },
});
