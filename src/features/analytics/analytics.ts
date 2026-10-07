import AsyncStorage from '@react-native-async-storage/async-storage';

// Chave de ingestão (write-only) do Visão de Produto — mesmo desenho de
// qualquer SDK de analytics client-side (Mixpanel/Amplitude/PostHog):
// feita pra ir no bundle do app, só aceita escrita, nunca lê dado nenhum.
// Não é segredo no mesmo sentido do ASC API key (eas.json/secrets/).
const CHAVE_API_INGESTAO = 'ing_GjGpKvfMBmByBLaqyAXB8_ZTdUGBggAk5dbbPkG_POQ';
const URL_INGESTAO = 'https://api.visaodeproduto.com.br/functions/v1/ingest';
const CHAVE_DISTINCT_ID = '@hora_do_remedio:analytics_distinct_id';

/**
 * Ações principais instrumentadas (16/09/2026) — cobre o que o Alexandre
 * pediu pra entender uso real: abertura, onboarding, CRUD de remédio,
 * compartilhamento, resposta de permissão, e os dois ajustes que mudam
 * comportamento (escala de letra, som do aviso) + apagar tudo.
 */
export type NomeEvento =
  | 'app_aberto'
  | 'onboarding_concluido'
  | 'remedio_cadastrado'
  | 'remedio_editado'
  | 'remedio_arquivado'
  | 'remedio_reativado'
  | 'lista_compartilhada'
  | 'permissao_notificacao_respondida'
  | 'escala_fonte_alterada'
  | 'som_aviso_alterado'
  | 'todos_dados_apagados';

/**
 * UUID v4 sem depender de `crypto.randomUUID` (não garantido no Hermes/RN
 * sem polyfill) — serve só de identificador de evento/instalação, sem
 * necessidade de força criptográfica.
 */
function gerarUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const aleatorio = (Math.random() * 16) | 0;
    const valor = c === 'x' ? aleatorio : (aleatorio & 0x3) | 0x8;
    return valor.toString(16);
  });
}

let distinctIdEmMemoria: string | null = null;

/**
 * `distinct_id` anônimo e estável por instalação (o app não tem conta nem
 * e-mail) — gerado uma vez, guardado no AsyncStorage, reaproveitado depois.
 */
async function obterDistinctId(): Promise<string> {
  if (distinctIdEmMemoria) return distinctIdEmMemoria;

  const salvo = await AsyncStorage.getItem(CHAVE_DISTINCT_ID);
  if (salvo) {
    distinctIdEmMemoria = salvo;
    return salvo;
  }

  const novo = gerarUuidV4();
  await AsyncStorage.setItem(CHAVE_DISTINCT_ID, novo);
  distinctIdEmMemoria = novo;
  return novo;
}

/**
 * Registra um evento de produto no Visão de Produto.
 *
 * Recebe: o nome do evento e, opcionalmente, a tela de origem, uma
 * descrição curta e propriedades extras.
 * Devolve: nada — best-effort: nunca lança erro pra quem chamou (métrica
 * não pode derrubar o app) e some em silêncio se o aparelho estiver
 * offline. Sem fila de retry por enquanto — o app é local-first e roda
 * bastante tempo sem internet, então uma fração dos eventos vai se perder;
 * aceitável para uma primeira visão de uso, revisitar se precisar de
 * contagem exata.
 */
export async function registrar(
  nome: NomeEvento,
  opcoes?: { tela?: string; descricao?: string; propriedades?: Record<string, unknown> }
): Promise<void> {
  try {
    const distinctId = await obterDistinctId();
    await fetch(URL_INGESTAO, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': CHAVE_API_INGESTAO },
      body: JSON.stringify({
        eventos: [
          {
            id: gerarUuidV4(),
            nome,
            distinct_id: distinctId,
            ocorrido_em: new Date().toISOString(),
            tela: opcoes?.tela,
            descricao: opcoes?.descricao,
            propriedades: opcoes?.propriedades,
          },
        ],
      }),
    });
  } catch (erro) {
    if (__DEV__) {
      console.warn('[analytics] falha ao registrar evento', nome, erro);
    }
  }
}
