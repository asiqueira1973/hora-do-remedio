import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { CORES_SEMANTICAS } from '../theme/colors';
import { RAIO, TOQUE_MINIMO } from '../theme/spacing';
import { TextoGrande } from './TextoGrande';

interface BotaoDestrutivoProps extends PressableProps {
  texto: string;
}

/**
 * Ação destrutiva (16.5): texto em `perigo`, sem fundo nem borda — o
 * padrão de linha de lista destrutiva do iOS (Ajustes → "Apagar Conta").
 * Usado em "Parar de tomar" (8.3) e "Apagar todos os meus dados" (8.6) —
 * nunca com fundo vermelho cheio, porque isso assusta o público (regra
 * explícita da 16.5); o redesenho de 2026-08-23 também tira a borda, que
 * já não é o padrão visual do app.
 *
 * Recebe: `texto` do rótulo e as props normais de `Pressable`.
 * Devolve: um elemento tocável de no mínimo 60×60pt (princípio 0.2).
 */
export function BotaoDestrutivo({ texto, style, ...rest }: BotaoDestrutivoProps) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={texto}
      style={(state) => [styles.base, state.pressed && styles.pressionado, typeof style === 'function' ? style(state) : style]}
    >
      <TextoGrande token="botao" cor={CORES_SEMANTICAS.perigo}>
        {texto}
      </TextoGrande>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.botao,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pressionado: {
    opacity: 0.5,
  },
});
