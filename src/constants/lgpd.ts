// TASK-73 (FIX_7): reescrito para os 5 tipos REAIS do enum Java
// (consentimento/lgpd/TipoConsentimento.java) e do CHECK constraint do Oracle
// (V1__initial_schema.sql:241-243) — TELEORIENTACAO, LEMBRETES, DADOS_ANONIMOS,
// COMPARTILHAR_SEGURADORA, MARKETING. Os 3 tipos anteriores (COMUNICACAO_WHATSAPP,
// DADOS_CLINICOS_IA, COMPARTILHAMENTO_LABORATORIO) não existem no backend — todo
// aceite/revogação contra eles devolvia 400 (B0.1 do KURA_BACKLOG_FIX_7). Decisão do
// Felipe: alinhar a UI aos 5 tipos reais, sem remapear semanticamente nenhum dos 3
// antigos para um dos novos (gravar propósito diferente do que o tutor leu seria
// pior que a funcionalidade quebrada). TELEORIENTACAO e LEMBRETES já tinham
// equivalente semântico no texto anterior (COMUNICACAO_WHATSAPP ~ LEMBRETES,
// DADOS_CLINICOS_IA tinha tom parecido com o de TELEORIENTACAO) — reaproveitado como
// base de tom, não de conteúdo (os dois são conceitos diferentes agora).
export const LGPD_CONSENTIMENTOS = {
  TELEORIENTACAO: {
    titulo: 'Teleorientação por vídeo',
    resumo: 'Autorizo o uso de teleorientação (chamada de vídeo) quando indicado pelo veterinário.',
    textoCompleto:
      'Ao aceitar, você autoriza a clínica veterinária parceira a realizar orientações remotas ' +
      'por chamada de vídeo (teleorientação) com seu pet, quando o veterinário responsável julgar ' +
      'adequado. A chamada é processada pelo provedor de vídeo Daily.co, contratado pela KURA, e ' +
      'pode ser complementada por transcrição automática para apoiar o registro clínico — toda ' +
      'sugestão gerada por IA nesse processo é revisada e confirmada pelo veterinário antes de ' +
      'entrar no prontuário.\n\n' +
      'Você pode revogar este consentimento a qualquer momento nesta tela. Revogar não cancela ' +
      'consultas presenciais nem outros atendimentos já agendados.\n' +
      'Base legal: Consentimento (Art. 7º, I, LGPD).',
  },
  LEMBRETES: {
    titulo: 'Lembretes e comunicados da clínica',
    resumo: 'Autorizo o envio de lembretes de vacina, consultas e comunicados da clínica.',
    textoCompleto:
      'Ao aceitar, você autoriza a clínica veterinária parceira a enviar lembretes de vacina, ' +
      'confirmações e lembretes de agendamento, resultados de exames e comunicados gerais sobre o ' +
      'atendimento do seu pet, por canais como WhatsApp Business (operado pela KURA em parceria ' +
      'com Twilio), e-mail ou notificação push.\n\n' +
      'Você pode revogar este consentimento a qualquer momento nesta tela.\n' +
      'Base legal: Legítimo interesse (Art. 7º, IX, LGPD).',
  },
  // BR-TUT-T08 (m9): os 3 tipos abaixo SÓ existem como registro. Nenhum código dos 3 backends os consome
  // (grep DADOS_ANONIMOS|SEGURADORA|MARKETING em backend-clinica-dotnet/src e kura-luna-ai/luna/src => 0, 2026-10-17,
  // dotnet 33dc567, luna e011335). A cópia diz o que a autorização registra e que ainda não há uso; não promete
  // anonimização, compartilhamento nem envio. TELEORIENTACAO é real (TeleconsultaService.cs:77-86 recusa a sala sem ela).
  DADOS_ANONIMOS: {
    titulo: 'Dados anonimizados para pesquisa',
    resumo: 'Registra que você aceita que dados anonimizados do seu pet sejam usados em pesquisa.',
    textoCompleto:
      'Ao autorizar, você registra que aceita que dados clínicos do seu pet, depois de anonimizados ' +
      '(sem nada que identifique você ou seu pet), possam ser usados em pesquisa veterinária e em ' +
      'estatísticas de saúde animal.\n\n' +
      'Hoje a KURA ainda não usa dados dessa forma: este registro só vale como autorização para o ' +
      'futuro, e você pode revogá-la quando quiser. Dado anonimizado deixa de ser dado pessoal.\n' +
      'Base legal: Consentimento (Art. 7º, I, LGPD) e anonimização (Art. 12, LGPD).',
  },
  COMPARTILHAR_SEGURADORA: {
    titulo: 'Compartilhar com seguradora',
    resumo: 'Registra que você aceita que dados do seu pet sejam compartilhados com a seguradora do seu plano.',
    textoCompleto:
      'Ao autorizar, você registra que aceita que a clínica compartilhe dados do seu pet (nome, ' +
      'espécie, raça, histórico de consultas e exames) com a seguradora de saúde animal do seu plano, ' +
      'só para análise, autorização e reembolso de procedimentos cobertos.\n\n' +
      'Hoje a KURA ainda não compartilha dados com nenhuma seguradora: este registro só vale como ' +
      'autorização para o futuro, e você pode revogá-la quando quiser.\n' +
      'Base legal: Execução de contrato (Art. 7º, V, LGPD).',
  },
  MARKETING: {
    titulo: 'Novidades e ofertas',
    resumo: 'Registra que você aceita receber novidades e ofertas da KURA e das clínicas parceiras.',
    textoCompleto:
      'Ao autorizar, você registra que aceita receber novidades, ofertas e pesquisas de satisfação da ' +
      'KURA e da clínica parceira. Este consentimento é independente dos lembretes sobre o atendimento ' +
      'do seu pet.\n\n' +
      'Hoje a KURA ainda não envia ofertas: este registro só vale como autorização para o futuro, e ' +
      'você pode revogá-la quando quiser, sem efeito nos demais serviços.\n' +
      'Base legal: Consentimento (Art. 7º, I, LGPD).',
  },
} as const;

export type TipoConsentimento = keyof typeof LGPD_CONSENTIMENTOS;

// BR-TUT-T08 (T2): LEMBRETES é parte do atendimento (aviso "Necessário para o serviço", sem Revogar); os outros 4 são opcionais.
export type TipoOpcional = Exclude<TipoConsentimento, 'LEMBRETES'>;
export const TIPOS_OPCIONAIS: TipoOpcional[] = ['TELEORIENTACAO', 'DADOS_ANONIMOS', 'COMPARTILHAR_SEGURADORA', 'MARKETING'];

// O que muda para o tutor ao revogar. Só TELEORIENTACAO tem efeito real; nos outros 3 a frase diz só o que fica registrado.
export const CONSEQUENCIA_REVOGAR: Record<TipoOpcional, string> = {
  TELEORIENTACAO:          'Você deixa de poder fazer teleorientação por vídeo com a clínica.',
  DADOS_ANONIMOS:          'Fica registrado que você não autoriza o uso de dados anonimizados do seu pet em pesquisa.',
  COMPARTILHAR_SEGURADORA: 'Fica registrado que você não autoriza o compartilhamento de dados do seu pet com seguradora.',
  MARKETING:               'Fica registrado que você não quer receber novidades e ofertas.',
};
