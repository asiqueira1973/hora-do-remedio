import { asc, isNull } from 'drizzle-orm';

import { db } from '../db/client';
import * as schema from '../db/schema';
import type { Cor, Forma, Frequencia, Horario, RemedioComHorarios } from '../types/domain';

/**
 * Traduz uma linha crua do banco (mais seus horários) para o tipo de
 * domínio `RemedioComHorarios`.
 *
 * Recebe: a linha devolvida pela query relacional do Drizzle.
 * Devolve: o objeto de domínio, com `lembreteAtivo` já como boolean.
 *
 * Implementa a fronteira de idioma da 18.1/13-A.1: é aqui, na camada de
 * repositório, que 0/1 do banco vira `boolean` do domínio.
 */
function paraDominio(linha: typeof schema.remedios.$inferSelect & { horarios: (typeof schema.horarios.$inferSelect)[] }): RemedioComHorarios {
  return {
    id: linha.id,
    nome: linha.nome,
    dose: linha.dose,
    forma: linha.forma as Forma,
    frequencia: linha.frequencia as Frequencia,
    intervaloDias: linha.intervaloDias,
    diasSemana: linha.diasSemana,
    observacao: linha.observacao,
    lembreteAtivo: linha.lembreteAtivo === 1,
    cor: linha.cor as Cor,
    arquivadoEm: linha.arquivadoEm,
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
    horarios: linha.horarios as Horario[],
  };
}

/**
 * `repositorioRemedios` — acesso a dados (13-A.1). Nenhuma tela fala com o
 * banco direto; tudo passa por aqui.
 */
export const repositorioRemedios = {
  /**
   * Query relacional crua de remédios ativos, com horários ordenados.
   *
   * Recebe: nada.
   * Devolve: o *query builder* do Drizzle (não resolvido) — para telas
   * usarem com `useLiveQuery` e reagir a mudanças (8.1).
   *
   * Implementa a seção 7.2: filtra por `arquivado_em IS NULL`.
   */
  queryAtivos() {
    return db.query.remedios.findMany({
      where: isNull(schema.remedios.arquivadoEm),
      with: { horarios: { orderBy: asc(schema.horarios.horaMinuto) } },
    });
  },

  /**
   * Remédios ativos (`arquivado_em IS NULL`), com horários. Base da Home
   * (8.1) para quem não precisa de reatividade (ex.: cálculo de
   * agendamento em background).
   *
   * Recebe: nada.
   * Devolve: `RemedioComHorarios[]`.
   */
  async listarAtivos(): Promise<RemedioComHorarios[]> {
    const linhas = await this.queryAtivos();
    return linhas.map(paraDominio);
  },
};

export { paraDominio as remedioParaDominio };
