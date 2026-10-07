import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { TEXTOS } from '../../src/constants/textos';
import { registrar } from '../../src/features/analytics/analytics';
import { MedicationForm } from '../../src/features/medications/MedicationForm';
import { reconciliar } from '../../src/features/reminders/reconciliadorLembretes';
import { servicoLembretes } from '../../src/features/reminders/servicoLembretes';
import { repositorioRemedios } from '../../src/repositories/medications';
import type { NovoRemedio } from '../../src/types/domain';

/**
 * Tela de cadastro de remédio novo (8.2, rota `/remedio/novo`).
 *
 * Recebe: nada (aberta pelo FAB da Home).
 * Devolve: o `MedicationForm` em modo de criação.
 *
 * Implementa a orquestração que a 13-A.1 deixa para a tela: chama
 * `repositorioRemedios.criar` e, se o remédio ficou com lembrete ligado,
 * decide entre a tela explicativa de permissão (8.4, só na primeira vez
 * — permissão ainda `undetermined`) ou reconciliar direto.
 */
export default function NovoRemedioScreen() {
  const router = useRouter();
  const corSugerida = useMemo(() => repositorioRemedios.proximaCor(), []);

  async function aoSalvar(dados: NovoRemedio) {
    await repositorioRemedios.criar(dados);
    registrar('remedio_cadastrado', {
      tela: 'CadastroRemedio',
      propriedades: { frequencia: dados.frequencia, lembreteAtivo: dados.lembreteAtivo, quantidadeHorarios: dados.horarios.length },
    });

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
      tituloBotaoSalvar={TEXTOS.cadastro.salvar}
      corSugerida={corSugerida}
      aoSalvar={aoSalvar}
      aoCancelar={() => router.back()}
    />
  );
}
