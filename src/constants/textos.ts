/**
 * Todas as strings de interface do app, num lugar só.
 *
 * Recebe: nada — é uma tabela estática.
 * Devolve: os textos exatos da seção 15.5 do spec, agrupados por tela
 * (15.1). Não é i18n — o app é só pt-BR (4.5) — é para o texto ser
 * revisável num lugar só, e para nenhuma string de interface aparecer
 * solta dentro de um componente.
 *
 * Duas entradas são funções porque interpolam o nome do remédio
 * (`detalhe.pararConfirmacaoTitulo`, `detalhe.arquivadoFaixa`) — o resto é
 * texto fixo. Vocabulário obrigatório da 15.4: nunca "excluir", é
 * "Parar de tomar".
 */
export const TEXTOS = {
  home: {
    saudacaoManha: 'Bom dia',
    saudacaoTarde: 'Boa tarde',
    saudacaoNoite: 'Boa noite',
    vazioTitulo: 'Você ainda não cadastrou nenhum remédio',
    vazioTexto: 'Toque no botão verde para cadastrar o primeiro',
    botaoAdicionar: '+ Adicionar remédio',
    botaoCompartilhar: 'Compartilhar minha lista',
    botaoCompartilharDesabilitado: 'Cadastre um remédio primeiro',
    semAviso: 'sem aviso',
    quandoPrecisar: 'Quando precisar',
    avisosDesligados: 'Os avisos estão desligados no iPhone. Toque aqui para ligar',
    cotaEstourada:
      'Você tem muitos remédios cadastrados. Alguns avisos podem não chegar. Abra o app uma vez por dia para manter os avisos em dia.',
  },
  cadastro: {
    nomePergunta: 'Qual o nome do remédio?',
    dosePergunta: 'Qual a dose?',
    doseExemplo: 'Ex.: 50mg, 1 comprimido, 10 gotas',
    formaPergunta: 'Como você toma?',
    frequenciaPergunta: 'Com que frequência?',
    horariosPergunta: 'A que horas?',
    horariosAdicionar: 'Adicionar horário',
    // Não existe string equivalente na 15.5 — o spec não especifica o
    // texto dos botões do seletor de hora nativo (bloco 5). Seguindo o
    // vocabulário e o tom da 15.2 (direto, sem jargão).
    horarioConfirmar: 'Pronto',
    horarioCancelarSelecao: 'Cancelar',
    lembretePergunta: 'Quer ser lembrado?',
    lembreteSim: 'Sim, me avise',
    lembreteNao: 'Não precisa avisar',
    observacaoPergunta: 'Alguma observação?',
    observacaoExemplo: 'Ex.: tomar em jejum',
    corPergunta: 'Escolha uma cor',
    salvar: 'Salvar remédio',
    salvarEdicao: 'Salvar alterações',
    cancelar: 'Cancelar',
    erroNomeVazio: 'Escreva o nome do remédio',
    erroSemHorario: 'Escolha pelo menos uma hora',
    erroSemDiaSemana: 'Escolha pelo menos um dia',
    erroHorarioRepetido: 'Esse horário já está na lista',
    erroMaximoHorarios: 'São no máximo 6 horários por remédio',
    erroAoSalvar: 'Não conseguimos salvar. Tente de novo.',
    sairSemSalvarTitulo: 'Sair sem salvar?',
    sairSemSalvarTexto: 'O que você preencheu será perdido.',
    // Rótulos dos botões do alerta acima — a 15.5 não especifica o texto
    // dos botões, só o título e o corpo.
    sairSemSalvarContinuar: 'Continuar editando',
    sairSemSalvarConfirmar: 'Sair sem salvar',
  },
  detalhe: {
    editar: 'Editar',
    parar: 'Parar de tomar',
    voltar: 'Voltar',
    pararConfirmacaoTitulo: (nome: string) => `Parar de tomar ${nome}?`,
    pararConfirmacaoTexto: 'Ele sai da sua lista e os avisos param. Você pode voltar a tomar depois.',
    pararConfirmacaoSim: 'Sim, parar',
    pararConfirmacaoCancelar: 'Cancelar',
    arquivadoFaixa: (nome: string) => `${nome} foi arquivado`,
    arquivadoDesfazer: 'Desfazer',
    mudarParaQuandoPrecisarTitulo: 'Tirar dos horários?',
    mudarParaQuandoPrecisarTexto: 'Esse remédio vai sair dos horários e os avisos vão parar. Continuar?',
  },
  permissao: {
    titulo: 'Para avisar na hora do remédio, o app precisa da sua permissão',
    texto: 'Na próxima tela, toque em Permitir.',
    continuar: 'Continuar',
    agoraNao: 'Agora não',
  },
  ajustes: {
    titulo: 'Ajustes',
    tamanhoLetras: 'Tamanho das letras',
    tamanhoGrande: 'Grande',
    tamanhoGigante: 'Gigante',
    somAviso: 'Som do aviso',
    arquivados: 'Remédios que parei',
    sobre: 'Sobre o app',
    apagarTudo: 'Apagar todos os meus dados',
    privacidade: 'Seus dados ficam só no seu iPhone. Nada é enviado para a internet.',
  },
  sobre: {
    politicaPrivacidade: 'Política de Privacidade',
  },
  arquivados: {
    vazio: 'Você não parou de tomar nenhum remédio',
    voltarATomar: 'Voltar a tomar',
  },
  onboarding: {
    tela1Titulo: 'Seus remédios, na hora certa',
    tela1Texto: 'Cadastre o que você toma e o app avisa na hora.',
    tela1Botao: 'Continuar',
    tela2Titulo: 'Tudo fica só no seu iPhone',
    tela2Texto: 'Nada é enviado para a internet. Funciona sem sinal.',
    tela2Botao: 'Começar',
  },
  erro: {
    bancoTitulo: 'Não conseguimos abrir seus dados',
    bancoTexto: 'Feche o app e abra de novo.',
    bancoBotao: 'Tentar de novo',
    agendamento: 'Não conseguimos programar o aviso deste remédio.',
  },
  notificacao: {
    titulo: 'Hora do remédio 💊',
  },
} as const;
