import { Text, type TextProps } from 'react-native';

import { useEscalaFonte } from '../features/settings/PreferencesContext';
import { CORES_SEMANTICAS } from '../theme/colors';
import { obterEstiloTipografico, type TokenTipografia } from '../theme/typography';

interface TextoGrandeProps extends TextProps {
  token?: TokenTipografia;
  cor?: string;
}

/**
 * Texto padrão do app: sempre usa a fonte do sistema (San Francisco no
 * iOS) e um dos 5 tokens tipográficos (16.2), na escala de fonte ativa do
 * usuário (`preferencias.escala_fonte`).
 *
 * Recebe: `token` (default `'corpo'`), `cor` (default `neutro_texto`, 16.4)
 * e as props normais de `Text`.
 * Devolve: um `<Text>` estilizado.
 *
 * Implementa o princípio 0.1: nenhum texto do app usa `fontSize` fora dos
 * tokens de `src/theme/typography.ts`, e o menor deles (`apoio`, 20pt) é o
 * piso absoluto — não existe caminho para renderizar menor que isso.
 */
export function TextoGrande({ token = 'corpo', cor = CORES_SEMANTICAS.neutroTexto, style, ...rest }: TextoGrandeProps) {
  const escala = useEscalaFonte();
  const estilo = obterEstiloTipografico(token, escala);

  return <Text {...rest} style={[{ color: cor }, estilo, style]} />;
}
