import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '../../components/BotaoPrimario';
import { BotaoSecundario } from '../../components/BotaoSecundario';
import { CampoTexto } from '../../components/CampoTexto';
import { SeletorOpcao } from '../../components/SeletorOpcao';
import { TextoGrande } from '../../components/TextoGrande';
import { TEXTOS } from '../../constants/textos';
import { CORES_SEMANTICAS } from '../../theme/colors';
import { ESPACAMENTO, RAIO, TOQUE_MINIMO } from '../../theme/spacing';
import type { Cor, Forma, NovoRemedio } from '../../types/domain';
import { FORMA_ICONE, FORMA_ROTULO } from './formaIcone';
import { SeletorCor } from './SeletorCor';
import { SeletorDiasSemana } from './SeletorDiasSemana';
import { validarFormulario, type EstadoFormulario, type FrequenciaFormulario } from './validarFormulario';

const OPCOES_FORMA = (Object.keys(FORMA_ROTULO) as Forma[]).map((valor) => ({
  valor,
  rotulo: FORMA_ROTULO[valor],
  icone: FORMA_ICONE[valor],
}));

const OPCOES_FREQUENCIA: { valor: FrequenciaFormulario; rotulo: string }[] = [
  { valor: 'diario', rotulo: 'Todo dia' },
  { valor: 'dias_semana', rotulo: 'Alguns dias da semana' },
  { valor: 'quando_precisar', rotulo: 'Quando precisar' },
];

const MAXIMO_HORARIOS = 6;

function paraDate(horaMinuto: string): Date {
  const [hora, minuto] = horaMinuto.split(':').map(Number);
  const data = new Date();
  data.setHours(hora, minuto, 0, 0);
  return data;
}

function paraHoraMinuto(data: Date): string {
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${hora}:${minuto}`;
}

interface BlocoProps {
  titulo: string;
  erro?: string;
  onLayout?: (evento: LayoutChangeEvent) => void;
  children: ReactNode;
}

/** Um bloco do formulário (8.2): pergunta + controle + erro opcional abaixo. */
function Bloco({ titulo, erro, onLayout, children }: BlocoProps) {
  return (
    <View style={styles.bloco} onLayout={onLayout}>
      <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTexto} style={styles.blocoTitulo}>
        {titulo}
      </TextoGrande>
      {children}
      {erro ? (
        <TextoGrande token="apoio" cor={CORES_SEMANTICAS.perigo} style={styles.blocoErro}>
          {erro}
        </TextoGrande>
      ) : null}
    </View>
  );
}

type EstadoPicker = { modo: 'novo' } | { modo: 'editar'; index: number } | null;

export interface MedicationFormProps {
  tituloBotaoSalvar: string;
  valoresIniciais?: Partial<EstadoFormulario>;
  corSugerida: Cor;
  aoSalvar: (dados: NovoRemedio) => Promise<void>;
  aoCancelar: () => void;
}

/**
 * Formulário de cadastro e edição de remédio (8.2). Uma tela só, com
 * rolagem, blocos bem separados — nunca um wizard de várias telas.
 *
 * Recebe: o rótulo do botão de salvar (varia entre cadastro e edição,
 * 8.3), valores iniciais (para edição), a cor sugerida do rodízio (11.8)
 * e os callbacks de salvar/cancelar — a orquestração de banco, háptica e
 * navegação fica com a tela que usa este componente (novo.tsx / editar.tsx).
 * Devolve: o formulário completo.
 *
 * Implementa a tabela de blocos da 8.2 (nome → dose → forma → frequência
 * → [dias da semana] → horários → lembrete → observação → cor), a regra
 * de que os blocos 5 e 6 somem inteiramente quando a frequência é "Quando
 * precisar" (11.1), a validação só ao tocar em Salvar (nunca durante a
 * digitação), e o destaque + rolagem até o primeiro bloco com erro.
 *
 * A frequência "A cada X dias" não está entre as opções do bloco 4 —
 * decisão registrada respondendo à pergunta aberta 25.8 do spec (ver
 * DOCUMENTACAO-TECNICA.md §19.6).
 */
export function MedicationForm({ tituloBotaoSalvar, valoresIniciais, corSugerida, aoSalvar, aoCancelar }: MedicationFormProps) {
  const [nome, setNome] = useState(valoresIniciais?.nome ?? '');
  const [dose, setDose] = useState(valoresIniciais?.dose ?? '');
  const [forma, setForma] = useState<Forma>(valoresIniciais?.forma ?? 'comprimido');
  const [frequencia, setFrequencia] = useState<FrequenciaFormulario>(valoresIniciais?.frequencia ?? 'diario');
  const [diasSemana, setDiasSemana] = useState(valoresIniciais?.diasSemana ?? '');
  const [horarios, setHorarios] = useState<string[]>(valoresIniciais?.horarios ?? ['08:00']);
  const [lembreteAtivo, setLembreteAtivo] = useState(valoresIniciais?.lembreteAtivo ?? true);
  const [observacao, setObservacao] = useState(valoresIniciais?.observacao ?? '');
  const [cor, setCor] = useState<Cor>(valoresIniciais?.cor ?? corSugerida);

  const [erros, setErros] = useState<{ nome?: string; diasSemana?: string; horarios?: string }>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [pickerEstado, setPickerEstado] = useState<EstadoPicker>(null);
  const [horaTemporaria, setHoraTemporaria] = useState(new Date());
  const [erroHorario, setErroHorario] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const offsetsRef = useRef<Record<string, number>>({});

  const mostraHorarioELembrete = frequencia !== 'quando_precisar';

  function selecionarFrequencia(valor: FrequenciaFormulario) {
    setFrequencia(valor);
    if (valor !== 'quando_precisar' && horarios.length === 0) {
      setHorarios(['08:00']);
    }
  }

  function alternarDiaSemana(digito: string) {
    setDiasSemana((atual) => {
      const digitos = atual.split('').filter(Boolean);
      const tem = digitos.includes(digito);
      const novos = tem ? digitos.filter((d) => d !== digito) : [...digitos, digito];
      return novos.sort().join('');
    });
  }

  function abrirNovoHorario() {
    if (horarios.length >= MAXIMO_HORARIOS) return;
    setHoraTemporaria(new Date());
    setErroHorario(null);
    setPickerEstado({ modo: 'novo' });
  }

  function abrirEditarHorario(index: number) {
    setHoraTemporaria(paraDate(horarios[index]));
    setErroHorario(null);
    setPickerEstado({ modo: 'editar', index });
  }

  function confirmarHorario() {
    if (!pickerEstado) return;
    const novoValor = paraHoraMinuto(horaTemporaria);
    const outros = pickerEstado.modo === 'editar' ? horarios.filter((_, i) => i !== pickerEstado.index) : horarios;

    if (outros.includes(novoValor)) {
      setErroHorario(TEXTOS.cadastro.erroHorarioRepetido);
      return;
    }

    setHorarios([...outros, novoValor].sort());
    setPickerEstado(null);
  }

  function removerHorario(index: number) {
    setHorarios((atual) => atual.filter((_, i) => i !== index));
  }

  function medir(chave: string) {
    return (evento: LayoutChangeEvent) => {
      offsetsRef.current[chave] = evento.nativeEvent.layout.y;
    };
  }

  function houveAlteracao(): boolean {
    return (
      nome.trim() !== '' ||
      dose.trim() !== '' ||
      observacao.trim() !== '' ||
      forma !== (valoresIniciais?.forma ?? 'comprimido') ||
      frequencia !== (valoresIniciais?.frequencia ?? 'diario') ||
      cor !== (valoresIniciais?.cor ?? corSugerida) ||
      lembreteAtivo !== (valoresIniciais?.lembreteAtivo ?? true) ||
      JSON.stringify(horarios) !== JSON.stringify(valoresIniciais?.horarios ?? ['08:00'])
    );
  }

  function aoTocarCancelar() {
    if (!houveAlteracao()) {
      aoCancelar();
      return;
    }
    Alert.alert(TEXTOS.cadastro.sairSemSalvarTitulo, TEXTOS.cadastro.sairSemSalvarTexto, [
      { text: TEXTOS.cadastro.sairSemSalvarContinuar, style: 'cancel' },
      { text: TEXTOS.cadastro.sairSemSalvarConfirmar, style: 'destructive', onPress: aoCancelar },
    ]);
  }

  function aoTocarSalvar() {
    const estado: EstadoFormulario = { nome, dose, forma, frequencia, diasSemana, horarios, lembreteAtivo, observacao, cor };
    const novosErros = validarFormulario(estado);
    setErros(novosErros);
    setErroSalvar(null);

    const primeiraChaveComErro = (['nome', 'diasSemana', 'horarios'] as const).find((chave) => novosErros[chave]);
    if (primeiraChaveComErro) {
      const y = offsetsRef.current[primeiraChaveComErro];
      if (y !== undefined) {
        scrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
      }
      return;
    }

    const dados: NovoRemedio = {
      nome: nome.trim(),
      dose: dose.trim() || null,
      forma,
      frequencia,
      intervaloDias: null,
      diasSemana: frequencia === 'dias_semana' ? diasSemana : null,
      observacao: observacao.trim() || null,
      lembreteAtivo: mostraHorarioELembrete ? lembreteAtivo : false,
      cor,
      horarios: mostraHorarioELembrete ? horarios : [],
    };

    setSalvando(true);
    aoSalvar(dados)
      .catch(() => setErroSalvar(TEXTOS.cadastro.erroAoSalvar))
      .finally(() => setSalvando(false));
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topo}>
        <Pressable onPress={aoTocarCancelar} accessibilityRole="button" style={styles.botaoTopo}>
          <TextoGrande token="corpo" cor={CORES_SEMANTICAS.acao}>
            {TEXTOS.cadastro.cancelar}
          </TextoGrande>
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Bloco titulo={TEXTOS.cadastro.nomePergunta} erro={erros.nome} onLayout={medir('nome')}>
          <CampoTexto value={nome} onChangeText={setNome} maxLength={60} autoCapitalize="words" returnKeyType="done" />
        </Bloco>

        <Bloco titulo={TEXTOS.cadastro.dosePergunta}>
          <CampoTexto value={dose} onChangeText={setDose} maxLength={40} exemplo={TEXTOS.cadastro.doseExemplo} returnKeyType="done" />
        </Bloco>

        <Bloco titulo={TEXTOS.cadastro.formaPergunta}>
          <SeletorOpcao opcoes={OPCOES_FORMA} selecionados={[forma]} aoAlternar={(v) => setForma(v)} />
        </Bloco>

        <Bloco titulo={TEXTOS.cadastro.frequenciaPergunta}>
          <View style={styles.frequenciaLista}>
            {OPCOES_FREQUENCIA.map((opcao) => {
              const marcado = frequencia === opcao.valor;
              return (
                <Pressable
                  key={opcao.valor}
                  onPress={() => selecionarFrequencia(opcao.valor)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: marcado }}
                  style={[styles.frequenciaBotao, marcado && styles.frequenciaBotaoMarcado]}
                >
                  <TextoGrande token="corpo" cor={marcado ? '#FFFFFF' : CORES_SEMANTICAS.neutroTexto}>
                    {opcao.rotulo}
                  </TextoGrande>
                </Pressable>
              );
            })}
          </View>
        </Bloco>

        {frequencia === 'dias_semana' ? (
          <Bloco titulo="Quais dias?" erro={erros.diasSemana} onLayout={medir('diasSemana')}>
            <SeletorDiasSemana selecionados={diasSemana} aoAlternar={alternarDiaSemana} />
          </Bloco>
        ) : null}

        {mostraHorarioELembrete ? (
          <Bloco titulo={TEXTOS.cadastro.horariosPergunta} erro={erros.horarios} onLayout={medir('horarios')}>
            {horarios.map((hora, index) => (
              <View key={hora} style={styles.horarioLinha}>
                <Pressable
                  onPress={() => abrirEditarHorario(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Horário ${hora}`}
                  style={styles.horarioChip}
                >
                  <TextoGrande token="corpo">{hora}</TextoGrande>
                </Pressable>
                <Pressable
                  onPress={() => removerHorario(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover horário ${hora}`}
                  style={styles.horarioRemover}
                >
                  <Ionicons name="close-circle" size={32} color={CORES_SEMANTICAS.perigo} />
                </Pressable>
              </View>
            ))}
            <BotaoSecundario
              texto={TEXTOS.cadastro.horariosAdicionar}
              onPress={abrirNovoHorario}
              desabilitado={horarios.length >= MAXIMO_HORARIOS}
            />
            {horarios.length >= MAXIMO_HORARIOS ? (
              <TextoGrande token="apoio" cor={CORES_SEMANTICAS.atencao} style={styles.avisoMaximo}>
                {TEXTOS.cadastro.erroMaximoHorarios}
              </TextoGrande>
            ) : null}
          </Bloco>
        ) : null}

        {mostraHorarioELembrete ? (
          <Bloco titulo={TEXTOS.cadastro.lembretePergunta}>
            <Pressable
              onPress={() => setLembreteAtivo((v) => !v)}
              accessibilityRole="switch"
              accessibilityState={{ checked: lembreteAtivo }}
              style={styles.linhaSwitch}
            >
              <TextoGrande token="corpo">{lembreteAtivo ? TEXTOS.cadastro.lembreteSim : TEXTOS.cadastro.lembreteNao}</TextoGrande>
              <Switch value={lembreteAtivo} onValueChange={setLembreteAtivo} trackColor={{ true: CORES_SEMANTICAS.acao, false: undefined }} />
            </Pressable>
          </Bloco>
        ) : null}

        <Bloco titulo={TEXTOS.cadastro.observacaoPergunta}>
          <CampoTexto
            value={observacao}
            onChangeText={setObservacao}
            maxLength={200}
            multiline
            numberOfLines={3}
            exemplo={TEXTOS.cadastro.observacaoExemplo}
            style={styles.campoMultilinha}
          />
        </Bloco>

        <Bloco titulo={TEXTOS.cadastro.corPergunta}>
          <SeletorCor selecionada={cor} aoSelecionar={setCor} />
        </Bloco>
      </ScrollView>

      <View style={styles.rodape}>
        {erroSalvar ? (
          <TextoGrande token="apoio" cor={CORES_SEMANTICAS.perigo} style={styles.erroSalvarTexto}>
            {erroSalvar}
          </TextoGrande>
        ) : null}
        <BotaoPrimario texto={tituloBotaoSalvar} onPress={aoTocarSalvar} desabilitado={salvando} />
      </View>

      <Modal visible={pickerEstado !== null} transparent animationType="slide" onRequestClose={() => setPickerEstado(null)}>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <DateTimePicker
              value={horaTemporaria}
              mode="time"
              display="spinner"
              is24Hour
              onChange={(_evento: DateTimePickerEvent, data?: Date) => data && setHoraTemporaria(data)}
            />
            {erroHorario ? (
              <TextoGrande token="apoio" cor={CORES_SEMANTICAS.perigo}>
                {erroHorario}
              </TextoGrande>
            ) : null}
            <View style={styles.modalBotoes}>
              <View style={styles.modalBotao}>
                <BotaoSecundario texto={TEXTOS.cadastro.horarioCancelarSelecao} onPress={() => setPickerEstado(null)} />
              </View>
              <View style={styles.modalBotao}>
                <BotaoPrimario texto={TEXTOS.cadastro.horarioConfirmar} onPress={confirmarHorario} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
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
  botaoTopo: {
    minHeight: TOQUE_MINIMO,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  conteudo: {
    paddingHorizontal: ESPACAMENTO.margemLateralTela,
    paddingBottom: 32,
  },
  bloco: {
    marginTop: 28,
  },
  blocoTitulo: {
    marginBottom: 12,
  },
  blocoErro: {
    marginTop: 8,
  },
  frequenciaLista: {
    gap: 12,
  },
  frequenciaBotao: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.botao,
    borderWidth: 2,
    borderColor: CORES_SEMANTICAS.neutroBorda,
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  frequenciaBotaoMarcado: {
    backgroundColor: CORES_SEMANTICAS.acao,
    borderColor: CORES_SEMANTICAS.acao,
  },
  horarioLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  horarioChip: {
    flex: 1,
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.botao,
    borderWidth: 2,
    borderColor: CORES_SEMANTICAS.neutroBorda,
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horarioRemover: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoMaximo: {
    marginTop: 8,
  },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOQUE_MINIMO,
  },
  campoMultilinha: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  rodape: {
    paddingHorizontal: ESPACAMENTO.margemLateralTela,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: CORES_SEMANTICAS.neutroFundo,
    borderTopWidth: 1,
    borderTopColor: CORES_SEMANTICAS.neutroBorda,
  },
  erroSalvarTexto: {
    textAlign: 'center',
    marginBottom: 12,
  },
  modalFundo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalConteudo: {
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    borderTopLeftRadius: RAIO.card,
    borderTopRightRadius: RAIO.card,
    padding: ESPACAMENTO.margemLateralTela,
    paddingBottom: 40,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalBotao: {
    flex: 1,
  },
});
