import { View, StyleSheet } from 'react-native';

import { TextoGrande } from '../src/components/TextoGrande';
import { CORES_SEMANTICAS } from '../src/theme/colors';

// Placeholder temporário da Home — substituído pela tela real do épico 8.1.
export default function Home() {
  return (
    <View style={styles.container}>
      <TextoGrande token="display">Hora do Remédio</TextoGrande>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES_SEMANTICAS.neutroFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
