import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CORES_SEMANTICAS } from '../theme/colors';
import { RAIO, TOQUE_MINIMO } from '../theme/spacing';
import { TextoGrande } from './TextoGrande';

export interface OpcaoSeletor<T extends string> {
  valor: T;
  rotulo: string;
  icone?: keyof typeof Ionicons.glyphMap;
}

interface SeletorOpcaoProps<T extends string> {
  opcoes: OpcaoSeletor<T>[];
  selecionados: T[];
  aoAlternar: (valor: T) => void;
  /** `true` permite marcar mais de uma opção (ex.: dias da semana, 8.2 bloco 4a). */
  multiplo?: boolean;
}

/**
 * Grade de botões grandes com ícone e rótulo, usada nos blocos de escolha
 * do cadastro (8.2): forma, frequência, dias da semana.
 *
 * Recebe: a lista de opções, quais estão selecionadas, e o callback de
 * alternar. `multiplo` controla se mais de uma opção pode ficar marcada.
 * Devolve: os botões, cada um com no mínimo 60×60pt (princípio 0.2).
 *
 * Implementa a regra da 2.2/8.2: "frequência e horário oferecidos como
 * escolhas prontas em vez de campos livres" — nenhuma opção deste
 * componente é um campo de texto digitável.
 */
export function SeletorOpcao<T extends string>({ opcoes, selecionados, aoAlternar, multiplo = false }: SeletorOpcaoProps<T>) {
  return (
    <View style={styles.grade}>
      {opcoes.map((opcao) => {
        const marcado = selecionados.includes(opcao.valor);
        return (
          <Pressable
            key={opcao.valor}
            onPress={() => aoAlternar(opcao.valor)}
            accessibilityRole={multiplo ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: marcado, checked: marcado }}
            accessibilityLabel={opcao.rotulo}
            style={[styles.botao, marcado && styles.botaoMarcado]}
          >
            {opcao.icone ? (
              <Ionicons
                name={opcao.icone}
                size={28}
                color={marcado ? CORES_SEMANTICAS.acao : CORES_SEMANTICAS.neutroTexto}
                style={styles.icone}
              />
            ) : null}
            <TextoGrande token="corpo" cor={marcado ? CORES_SEMANTICAS.acao : CORES_SEMANTICAS.neutroTexto}>
              {opcao.rotulo}
            </TextoGrande>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  botao: {
    minHeight: TOQUE_MINIMO,
    minWidth: TOQUE_MINIMO,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RAIO.botao,
    borderWidth: 2,
    borderColor: CORES_SEMANTICAS.neutroBorda,
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
  },
  botaoMarcado: {
    borderColor: CORES_SEMANTICAS.acao,
    backgroundColor: '#E6F5EC',
  },
  icone: {
    marginRight: 8,
  },
});
