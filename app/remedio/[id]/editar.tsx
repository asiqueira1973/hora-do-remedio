import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { TEXTOS } from '../../../src/constants/textos';
import { registrar } from '../../../src/features/analytics/analytics';
import { MedicationForm } from '../../../src/features/medications/MedicationForm';
import type { FrequenciaFormulario } from '../../../src/features/medications/validarFormulario';
import { reconciliar } from '../../../src/features/reminders/reconciliadorLembretes';
import { servicoLembretes } from '../../../src/features/reminders/servicoLembretes';
import { remedioParaDominio, repositorioRemedios } from '../../../src/repositories/medications';
import { CORES_SEMANTICAS } from '../../../src/theme/colors';
import type { NovoRemedio } from '../../../src/types/domain';

/**
 * Edição de remédio (8.3, rota `/remedio/[id]/editar`) — o mesmo
 * formulário do cadastro (8.2), preenchido com os dados atuais.
 *
 * Recebe: `id` do remédio, pela rota.
 * Devolve: `MedicationForm` em modo de edição, com "Salvar alterações".
 *
 * Implementa a regra de edição da 8.3: salvar reescreve os horários numa
 * transação só (repositorioRemedios.atualizar, 13-A.1) — o reagendamento
 * das notificações antigas/novas entra no épico 8.4.
 */
export default function EditarRemedioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const remedioId = Number(id);

  const { data: linha } = useLiveQuery(repositorioRemedios.queryPorId(remedioId));

  if (!linha) {
    return <View style={{ flex: 1, backgroundColor: CORES_SEMANTICAS.neutroFundo }} />;
  }

  const remedio = remedioParaDominio(linha);
  // O formulário nunca cria `intervalo_dias` (25.8) — se o dado vier assim
  // do banco por algum outro caminho, trata como "diario" na edição em vez
  // de quebrar o formulário.
  const frequenciaFormulario: FrequenciaFormulario = remedio.frequencia === 'intervalo_dias' ? 'diario' : remedio.frequencia;

  async function aoSalvar(dados: NovoRemedio) {
    await repositorioRemedios.atualizar(remedioId, dados);
    registrar('remedio_editado', { tela: 'EdicaoRemedio', propriedades: { frequencia: dados.frequencia, lembreteAtivo: dados.lembreteAtivo } });

    if (dados.lembreteAtivo) {
      const estadoPermissao = await servicoLembretes.verificarPermissao();
      if (estadoPermissao === 'undetermined') {
        router.replace('/permissao-aviso');
        return;
      }
    }

    await reconciliar();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <MedicationForm
      tituloBotaoSalvar={TEXTOS.cadastro.salvarEdicao}
      corSugerida={remedio.cor}
      valoresIniciais={{
        nome: remedio.nome,
        dose: remedio.dose ?? '',
        forma: remedio.forma,
        frequencia: frequenciaFormulario,
        diasSemana: remedio.diasSemana ?? '',
        horarios: remedio.horarios.map((h) => h.horaMinuto),
        lembreteAtivo: remedio.lembreteAtivo,
        observacao: remedio.observacao ?? '',
        cor: remedio.cor,
      }}
      aoSalvar={aoSalvar}
      aoCancelar={() => router.back()}
    />
  );
}
