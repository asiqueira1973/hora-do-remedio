import { Share } from 'react-native';

import { agruparPorHorario, ROTULOS_FAIXA, type FaixaHorario } from '../medications/agruparPorHorario';
import { formatarFrequencia } from '../medications/formatarFrequencia';
import type { RemedioComHorarios } from '../../types/domain';

/** Emoji de cada faixa do dia no texto exportado (14.1.4). */
const EMOJI_FAIXA: Record<FaixaHorario, string> = {
  madrugada: '🌃',
  manha: '🌅',
  tarde: '🌇',
  noite: '🌙',
};

function paraDataDDMMAAAA(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

/** Linhas de um remédio dentro de um bloco: nome/dose, depois ⚠️, depois 📅 (14.1.5, 14.1.6, 14.1.8). */
function linhasDoRemedio(remedio: RemedioComHorarios): string[] {
  const linhas: string[] = [remedio.dose ? `• ${remedio.nome} — ${remedio.dose}` : `• ${remedio.nome}`];

  if (remedio.observacao) {
    linhas.push(`  ⚠️ ${remedio.observacao}`);
  }

  const frequencia = formatarFrequencia(remedio);
  if (frequencia) {
    linhas.push(`  📅 ${frequencia}`);
  }

  return linhas;
}

/**
 * `gerarTexto` (13-A.4) — monta o texto de exportação exatamente como a
 * 14.1 especifica, caractere por caractere.
 *
 * Recebe: os remédios **ativos** (mesmo contrato de `agruparPorHorario`,
 * 8.1) — quem chama já filtrou `arquivado_em IS NULL` (14.1.11).
 * Devolve: o texto pronto para a share sheet, com uma linha em branco
 * entre cada linha de conteúdo (14.1.2), sem espaço sobrando no fim de
 * linha e sem linha em branco dupla (14.1.14).
 *
 * Função pura — nenhuma chamada nativa aqui — porque o critério de aceite
 * de 8.5 é comparação literal com o exemplo da 14.1 (teste 22.1.3).
 */
export function gerarTexto(remedios: RemedioComHorarios[]): string {
  const { grupos, quandoPrecisar } = agruparPorHorario(remedios);
  const linhas: string[] = ['💊 MEUS REMÉDIOS', `Atualizado em ${paraDataDDMMAAAA(new Date())}`];

  for (const grupo of grupos) {
    linhas.push(`${EMOJI_FAIXA[grupo.faixa]} ${ROTULOS_FAIXA[grupo.faixa].toUpperCase()} — ${grupo.horaMinuto}`);
    for (const item of grupo.itens) {
      linhas.push(...linhasDoRemedio(item.remedio));
    }
  }

  if (quandoPrecisar.length > 0) {
    linhas.push('💊 QUANDO PRECISAR');
    for (const remedio of quandoPrecisar) {
      linhas.push(...linhasDoRemedio(remedio));
    }
  }

  linhas.push('—', 'Lista gerada pelo app Hora do Remédio');

  return linhas.join('\n\n');
}

/**
 * Abre a share sheet nativa do iOS com o texto já montado (8.5).
 *
 * Recebe: o texto gerado por `gerarTexto`.
 * Devolve: nada — a escolha de destino (WhatsApp, E-mail, Mensagens,
 * Copiar) é toda do usuário, na folha nativa.
 */
export async function compartilhar(texto: string): Promise<void> {
  await Share.share({ message: texto });
}
