import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { servicoLembretes, type EstadoPermissao } from './servicoLembretes';

/**
 * Estado atual da permissão de notificação, verificado ao montar e toda
 * vez que o app volta ao primeiro plano — a pessoa pode ter mudado nos
 * Ajustes do iOS (12.3: "Verificado na abertura do app e ao voltar do
 * background").
 *
 * Recebe: nada.
 * Devolve: o estado (`undetermined` até a primeira checagem terminar).
 *
 * Usado pela Home (8.4) para mostrar a faixa "Os avisos estão desligados
 * no iPhone" quando o estado é `denied`.
 */
export function usePermissaoNotificacao(): EstadoPermissao {
  const [estado, setEstado] = useState<EstadoPermissao>('undetermined');

  useEffect(() => {
    let cancelado = false;

    function verificar() {
      servicoLembretes.verificarPermissao().then((valor) => {
        if (!cancelado) setEstado(valor);
      });
    }

    verificar();

    const assinatura = AppState.addEventListener('change', (proximoEstado: AppStateStatus) => {
      if (proximoEstado === 'active') verificar();
    });

    return () => {
      cancelado = true;
      assinatura.remove();
    };
  }, []);

  return estado;
}
