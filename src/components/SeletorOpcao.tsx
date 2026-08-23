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
 * Lista de opções em linhas, cada uma com ícone à esquerda e uma marca de
 * seleção à direita (círculo azul preenchido ou vazio) — o padrão nativo
 * de lista de escolha do iOS (Ajustes → seleção única), usado nos blocos
 * de escolha do cadastro (8.2): forma, frequência, dias da semana.
 * Redesenho de 2026-08-23: era uma grade de botões com borda.
 *
 * Recebe: a lista de opções, quais estão selecionadas, e o callback de
 * alternar. `multiplo` controla se mais de uma opção pode ficar marcada.
 * Devolve: as linhas, cada uma com no mínimo 60×60pt (princípio 0.2).
 *
 * Implementa a regra da 2.2/8.2: "frequência e horário oferecidos como
 * escolhas prontas em vez de campos livres" — nenhuma opção deste
 * componente é um campo de texto digitável.
 */
export function SeletorOpcao<T extends string>({ opcoes, selecionados, aoAlternar, multiplo = false }: SeletorOpcaoProps<T>) {
  return (
    <View style={styles.grupo}>
      {opcoes.map((opcao, index) => {
        const marcado = selecionados.includes(opcao.valor);
        return (
          <Pressable
            key={opcao.valor}
            onPress={() => aoAlternar(opcao.valor)}
            accessibilityRole={multiplo ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: marcado, checked: marcado }}
            accessibilityLabel={opcao.rotulo}
            style={[styles.linha, index < opcoes.length - 1 && styles.linhaComBorda]}
          >
            {opcao.icone ? (
              <Ionicons name={opcao.icone} size={24} color={CORES_SEMANTICAS.acao} style={styles.icone} />
            ) : null}
            <TextoGrande token="corpo" cor={CORES_SEMANTICAS.neutroTexto} style={styles.rotulo}>
              {opcao.rotulo}
            </TextoGrande>
            {marcado ? (
              <View style={styles.marca}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.marcaVazia} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: {
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    borderRadius: RAIO.card,
    overflow: 'hidden',
  },
  linha: {
    minHeight: TOQUE_MINIMO,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  linhaComBorda: {
    borderBottomWidth: 1,
    borderBottomColor: CORES_SEMANTICAS.neutroBorda,
  },
  rotulo: {
    flex: 1,
  },
  icone: {
    flexShrink: 0,
  },
  marca: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: CORES_SEMANTICAS.acao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaVazia: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: CORES_SEMANTICAS.neutroBorda,
  },
});
