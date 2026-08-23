import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { CORES_SEMANTICAS } from '../theme/colors';
import { obterEstiloTipografico } from '../theme/typography';
import { RAIO, TOQUE_MINIMO } from '../theme/spacing';
import { useEscalaFonte } from '../features/settings/PreferencesContext';
import { TextoGrande } from './TextoGrande';

interface CampoTextoProps extends TextInputProps {
  /** Omitido quando a pergunta já é mostrada por fora (ex.: dentro de um `Bloco` do formulário 8.2). */
  rotulo?: string;
  exemplo?: string;
  erro?: string;
}

/**
 * Campo de texto do formulário de cadastro (8.2): rótulo em cima (quando
 * fornecido), campo grande embaixo, exemplo em cinza quando fornecido, e
 * erro em texto grande abaixo quando houver.
 *
 * Recebe: `rotulo` (opcional — omita se a pergunta já aparece fora do
 * campo), `exemplo` (opcional), `erro` (opcional) e as props normais de
 * `TextInput`.
 * Devolve: o campo, com rótulo/exemplo/erro conforme fornecido.
 *
 * Implementa a regra de 8.2: "Validação acontece ao tocar em Salvar... o
 * app rola até o primeiro bloco com problema, o destaca, e mostra a
 * mensagem em texto grande abaixo do bloco" — a borda vermelha e o texto
 * de erro aqui são exatamente esse destaque.
 */
export function CampoTexto({ rotulo, exemplo, erro, style, ...rest }: CampoTextoProps) {
  const escala = useEscalaFonte();
  const estiloTexto = obterEstiloTipografico('corpo', escala);

  return (
    <View>
      {rotulo ? (
        <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTexto} style={styles.rotulo}>
          {rotulo}
        </TextoGrande>
      ) : null}
      <TextInput
        {...rest}
        style={[styles.campo, estiloTexto, erro && styles.campoComErro, style]}
        placeholderTextColor="#B9B9BE"
      />
      {erro ? (
        <TextoGrande token="apoio" cor={CORES_SEMANTICAS.perigo} style={styles.mensagem}>
          {erro}
        </TextoGrande>
      ) : exemplo ? (
        <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTextoSecundario} style={styles.mensagem}>
          {exemplo}
        </TextoGrande>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: {
    marginBottom: 8,
  },
  campo: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.card,
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: CORES_SEMANTICAS.neutroTexto,
  },
  campoComErro: {
    borderWidth: 2,
    borderColor: CORES_SEMANTICAS.perigo,
  },
  mensagem: {
    marginTop: 8,
  },
});
