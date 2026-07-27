import { asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { db } from '../db/client';
import * as schema from '../db/schema';
import { ORDEM_RODIZIO_CORES } from '../theme/colors';
import type { Cor, Forma, Frequencia, Horario, NovoRemedio, RemedioComHorarios } from '../types/domain';

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

  /**
   * Insere um remédio novo e seus horários numa transação só (13-A.1):
   * falha em qualquer parte desfaz tudo.
   *
   * Recebe: `NovoRemedio` (dados do formulário 8.2).
   * Devolve: o remédio criado, com horários.
   *
   * Implementa o critério de aceite de 8.2: preencher só o nome e salvar
   * cria um remédio com os defaults (diario/comprimido/08:00/lembrete
   * ligado). Não agenda notificação — quem orquestra isso é a tela,
   * chamando o serviço de lembretes depois (13-A.2, a partir de 8.4).
   */
  async criar(dados: NovoRemedio): Promise<RemedioComHorarios> {
    return db.transaction((tx) => {
      const remedioInserido = tx
        .insert(schema.remedios)
        .values({
          nome: dados.nome,
          dose: dados.dose,
          forma: dados.forma,
          frequencia: dados.frequencia,
          intervaloDias: dados.intervaloDias,
          diasSemana: dados.diasSemana,
          observacao: dados.observacao,
          lembreteAtivo: dados.lembreteAtivo ? 1 : 0,
          cor: dados.cor,
        })
        .returning()
        .get();

      if (dados.horarios.length > 0) {
        tx.insert(schema.horarios)
          .values(dados.horarios.map((horaMinuto, ordem) => ({ remedioId: remedioInserido.id, horaMinuto, ordem })))
          .run();
      }

      const horariosInseridos = tx
        .select()
        .from(schema.horarios)
        .where(eq(schema.horarios.remedioId, remedioInserido.id))
        .orderBy(asc(schema.horarios.horaMinuto))
        .all();

      return paraDominio({ ...remedioInserido, horarios: horariosInseridos });
    });
  },

  /**
   * Query relacional crua de um remédio por id, com horários ordenados.
   *
   * Recebe: `id` do remédio.
   * Devolve: o *query builder* (não resolvido) — para a tela de detalhe
   * (8.3) usar com `useLiveQuery`.
   */
  queryPorId(id: number) {
    return db.query.remedios.findFirst({
      where: eq(schema.remedios.id, id),
      with: { horarios: { orderBy: asc(schema.horarios.horaMinuto) } },
    });
  },

  /**
   * Busca um remédio por id, com horários (8.3 — tela de detalhe).
   *
   * Recebe: `id` do remédio.
   * Devolve: `RemedioComHorarios` ou `null` se não existir.
   */
  async buscarPorId(id: number): Promise<RemedioComHorarios | null> {
    const linha = await this.queryPorId(id);
    return linha ? paraDominio(linha) : null;
  },

  /**
   * Query relacional crua de remédios arquivados, mais recentes primeiro.
   *
   * Recebe: nada.
   * Devolve: o *query builder* — para "Remédios que parei" (8.3) reagir
   * a mudanças via `useLiveQuery`.
   */
  queryArquivados() {
    return db.query.remedios.findMany({
      where: isNotNull(schema.remedios.arquivadoEm),
      with: { horarios: { orderBy: asc(schema.horarios.horaMinuto) } },
      orderBy: desc(schema.remedios.arquivadoEm),
    });
  },

  /**
   * Remédios arquivados (`arquivado_em` preenchido), mais recentes
   * primeiro (8.3).
   *
   * Recebe: nada.
   * Devolve: `RemedioComHorarios[]`.
   */
  async listarArquivados(): Promise<RemedioComHorarios[]> {
    const linhas = await this.queryArquivados();
    return linhas.map(paraDominio);
  },

  /**
   * Atualiza os dados de um remédio e **reescreve** seus horários numa
   * transação só (13-A.1): apaga os horários antigos (o cascade some
   * junto com as notificações agendadas deles, 7.4) e insere os novos.
   *
   * Recebe: `id` do remédio e `NovoRemedio` com os dados do formulário
   * de edição (8.3, mesmo formulário do 8.2).
   * Devolve: o remédio atualizado, com os novos horários.
   *
   * Implementa a regra de edição da 8.3: "editar horários reescreve as
   * linhas de horarios... nunca edita notificação existente — cancelar e
   * recriar é a única operação confiável." O agendamento em si é
   * responsabilidade da tela, a partir do épico 8.4.
   */
  async atualizar(id: number, dados: NovoRemedio): Promise<RemedioComHorarios> {
    return db.transaction((tx) => {
      const remedioAtualizado = tx
        .update(schema.remedios)
        .set({
          nome: dados.nome,
          dose: dados.dose,
          forma: dados.forma,
          frequencia: dados.frequencia,
          intervaloDias: dados.intervaloDias,
          diasSemana: dados.diasSemana,
          observacao: dados.observacao,
          lembreteAtivo: dados.lembreteAtivo ? 1 : 0,
          cor: dados.cor,
        })
        .where(eq(schema.remedios.id, id))
        .returning()
        .get();

      tx.delete(schema.horarios).where(eq(schema.horarios.remedioId, id)).run();

      if (dados.horarios.length > 0) {
        tx.insert(schema.horarios)
          .values(dados.horarios.map((horaMinuto, ordem) => ({ remedioId: id, horaMinuto, ordem })))
          .run();
      }

      const horariosAtualizados = tx
        .select()
        .from(schema.horarios)
        .where(eq(schema.horarios.remedioId, id))
        .orderBy(asc(schema.horarios.horaMinuto))
        .all();

      return paraDominio({ ...remedioAtualizado, horarios: horariosAtualizados });
    });
  },

  /**
   * Arquiva um remédio (soft delete, 7.8): preenche `arquivado_em`. Não
   * apaga nada.
   *
   * Recebe: `id` do remédio.
   * Devolve: nada.
   *
   * Implementa "Parar de tomar" (8.3) — o cancelamento das notificações
   * é responsabilidade da tela, chamando o serviço de lembretes (13-A.2,
   * a partir de 8.4).
   */
  async arquivar(id: number): Promise<void> {
    await db
      .update(schema.remedios)
      .set({ arquivadoEm: sql`(datetime('now'))` })
      .where(eq(schema.remedios.id, id));
  },

  /**
   * Desarquiva um remédio: limpa `arquivado_em`, trazendo-o de volta aos
   * ativos com os horários originais intactos.
   *
   * Recebe: `id` do remédio.
   * Devolve: nada.
   *
   * Implementa "Voltar a tomar" (8.3). O reagendamento das notificações
   * é responsabilidade da tela (13-A.2, a partir de 8.4).
   */
  async desarquivar(id: number): Promise<void> {
    await db.update(schema.remedios).set({ arquivadoEm: null }).where(eq(schema.remedios.id, id));
  },

  /**
   * Próxima cor do rodízio (11.8): a seguinte, na ordem da paleta, depois
   * da cor do último remédio criado — incluindo arquivados. Sem remédio
   * nenhum ainda, começa em `coral`.
   *
   * Recebe: nada.
   * Devolve: a cor sugerida para o bloco 8 do cadastro (8.2).
   */
  proximaCor(): Cor {
    const ultimo = db.select({ cor: schema.remedios.cor }).from(schema.remedios).orderBy(desc(schema.remedios.id)).limit(1).get();

    if (!ultimo) return ORDEM_RODIZIO_CORES[0];

    const indiceAtual = ORDEM_RODIZIO_CORES.indexOf(ultimo.cor as Cor);
    const proximoIndice = (indiceAtual + 1) % ORDEM_RODIZIO_CORES.length;
    return ORDEM_RODIZIO_CORES[proximoIndice];
  },
};

export { paraDominio as remedioParaDominio };
