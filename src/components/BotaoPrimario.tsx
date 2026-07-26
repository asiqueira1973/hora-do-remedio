import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { CORES_SEMANTICAS } from '../theme/colors';
import { RAIO, ALTURAS } from '../theme/spacing';
import { TextoGrande } from './TextoGrande';

interface BotaoPrimarioProps extends PressableProps {
  texto: string;
  desabilitado?: boolean;
}

/**
 * Botão principal do app: fundo verde de ação, texto branco, largura
 * total, altura 64pt (16.5).
 *
 * Recebe: `texto` do rótulo, `desabilitado` (opcional), e as props normais
 * de `Pressable` (`onPress`, etc.).
 * Devolve: um botão tocável de no mínimo 60×60pt (princípio 0.2), com
 * `accessibilityRole="button"` para o VoiceOver (17.3).
 */
export function BotaoPrimario({ texto, desabilitado = false, style, ...rest }: BotaoPrimarioProps) {
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
      <TextoGrande token="botao" cor="#FFFFFF">
        {texto}
      </TextoGrande>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: CORES_SEMANTICAS.acao,
    height: ALTURAS.botaoPrimario,
    borderRadius: RAIO.botao,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pressionado: {
    opacity: 0.85,
  },
  desabilitado: {
    opacity: 0.4,
  },
});
