import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { TEXTOS } from '../../src/constants/textos';
import { MedicationForm } from '../../src/features/medications/MedicationForm';
import { repositorioRemedios } from '../../src/repositories/medications';
import type { NovoRemedio } from '../../src/types/domain';

/**
 * Tela de cadastro de remédio novo (8.2, rota `/remedio/novo`).
 *
 * Recebe: nada (aberta pelo FAB da Home).
 * Devolve: o `MedicationForm` em modo de criação.
 *
 * Implementa a orquestração que a 13-A.1 deixa para a tela: chama
 * `repositorioRemedios.criar`, dispara a háptica de sucesso e fecha a
 * tela. O agendamento de notificação (servicoLembretes, 13-A.2) ainda
 * não existe — entra no épico 8.4, que vai acrescentar essa chamada
 * aqui sem mudar o resto do fluxo.
 */
export default function NovoRemedioScreen() {
  const router = useRouter();
  const corSugerida = useMemo(() => repositorioRemedios.proximaCor(), []);

  async function aoSalvar(dados: NovoRemedio) {
    await repositorioRemedios.criar(dados);
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
