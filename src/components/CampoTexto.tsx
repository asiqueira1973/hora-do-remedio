import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { CORES_SEMANTICAS } from '../theme/colors';
import { obterEstiloTipografico } from '../theme/typography';
import { RAIO, TOQUE_MINIMO } from '../theme/spacing';
import { useEscalaFonte } from '../features/settings/PreferencesContext';
import { TextoGrande } from './TextoGrande';

interface CampoTextoProps extends TextInputProps {
  rotulo: string;
  exemplo?: string;
  erro?: string;
}

/**
 * Campo de texto do formulário de cadastro (8.2): rótulo em cima, campo
 * grande embaixo, exemplo em cinza quando fornecido, e erro em texto
 * grande abaixo quando houver.
 *
 * Recebe: `rotulo`, `exemplo` (opcional), `erro` (opcional) e as props
 * normais de `TextInput`.
 * Devolve: o bloco completo (rótulo + campo + exemplo/erro).
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
      <TextoGrande token="apoio" cor={CORES_SEMANTICAS.neutroTexto} style={styles.rotulo}>
        {rotulo}
      </TextoGrande>
      <TextInput
        {...rest}
        style={[
          styles.campo,
          estiloTexto,
          { borderColor: erro ? CORES_SEMANTICAS.perigo : CORES_SEMANTICAS.neutroBorda },
          style,
        ]}
        placeholderTextColor="#8A8A8E"
      />
      {erro ? (
        <TextoGrande token="apoio" cor={CORES_SEMANTICAS.perigo} style={styles.mensagem}>
          {erro}
        </TextoGrande>
      ) : exemplo ? (
        <TextoGrande token="apoio" cor="#6B6B70" style={styles.mensagem}>
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
    borderWidth: 2,
    borderRadius: RAIO.botao,
    backgroundColor: CORES_SEMANTICAS.neutroSuperficie,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: CORES_SEMANTICAS.neutroTexto,
  },
  mensagem: {
    marginTop: 8,
  },
});
