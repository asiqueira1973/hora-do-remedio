import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { CORES_SEMANTICAS } from '../theme/colors';
import { RAIO, TOQUE_MINIMO } from '../theme/spacing';
import { TextoGrande } from './TextoGrande';

interface BotaoSecundarioProps extends PressableProps {
  texto: string;
  desabilitado?: boolean;
}

/**
 * Botão secundário: fundo neutro, borda de 2pt (16.5). Usado para ações
 * que não são a principal da tela (ex.: "Cancelar", "Voltar").
 *
 * Recebe: `texto` do rótulo, `desabilitado` (opcional), e as props normais
 * de `Pressable`.
 * Devolve: um botão tocável de no mínimo 60×60pt (princípio 0.2).
 */
export function BotaoSecundario({ texto, desabilitado = false, style, ...rest }: BotaoSecundarioProps) {
  return (
    <Pressable
      {...rest}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: desabilitado }}
      style={(state) => [
        styles.base,
        desabilitado && styles.desabilitado,
        state.pressed && !desabilitado && styles.pressionado,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <TextoGrande token="botao" cor={CORES_SEMANTICAS.neutroTexto}>
        {texto}
      </TextoGrande>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    borderWidth: 2,
    borderColor: CORES_SEMANTICAS.neutroBorda,
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.botao,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pressionado: {
    opacity: 0.7,
  },
  desabilitado: {
    opacity: 0.4,
  },
});
