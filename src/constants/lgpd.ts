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
      'por chamada de vídeo (teleconsulta) com seu pet, quando o veterinário responsável julgar ' +
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
  DADOS_ANONIMOS: {
    titulo: 'Uso de dados anonimizados',
    resumo: 'Autorizo o uso de dados anonimizados do meu pet para pesquisa e melhoria dos serviços.',
    textoCompleto:
      'Ao aceitar, você autoriza que a KURA utilize dados clínicos do seu pet, após processo de ' +
      'anonimização (remoção de qualquer informação que identifique você ou seu pet), para ' +
      'pesquisa veterinária, geração de estatísticas de saúde animal e melhoria contínua dos ' +
      'serviços e algoritmos da plataforma, incluindo o subsistema de inteligência artificial ' +
      'Luna.\n\n' +
      'Dado anonimizado deixa de ser dado pessoal e não permite, em nenhuma hipótese, identificar ' +
      'você ou seu pet novamente.\n' +
      'Base legal: Consentimento (Art. 7º, I, LGPD) e anonimização (Art. 12, LGPD).',
  },
  COMPARTILHAR_SEGURADORA: {
    titulo: 'Compartilhamento com seguradora',
    resumo: 'Autorizo o compartilhamento de dados do meu pet com a seguradora vinculada ao meu plano.',
    textoCompleto:
      'Ao aceitar, você autoriza que a clínica veterinária compartilhe os dados necessários (nome ' +
      'do pet, espécie, raça, histórico de consultas e exames) com a seguradora de saúde animal ' +
      'vinculada ao seu plano, exclusivamente para fins de análise, autorização e reembolso de ' +
      'procedimentos cobertos.\n\n' +
      'Os dados são transmitidos via canal seguro (TLS 1.3) e limitados ao necessário para a ' +
      'execução do contrato de seguro.\n' +
      'Base legal: Execução de contrato (Art. 7º, V, LGPD).',
  },
  MARKETING: {
    titulo: 'Comunicações de marketing',
    resumo: 'Autorizo o envio de ofertas, promoções e novidades da KURA e clínicas parceiras.',
    textoCompleto:
      'Ao aceitar, você autoriza a KURA e a clínica veterinária parceira a enviar ofertas, ' +
      'promoções, pesquisas de satisfação e novidades sobre produtos e serviços, por canais como ' +
      'e-mail, WhatsApp ou notificação push. Este consentimento é independente do envio de ' +
      'lembretes e comunicados operacionais sobre o atendimento do seu pet.\n\n' +
      'Você pode revogar este consentimento a qualquer momento nesta tela, sem impacto nos demais ' +
      'serviços.\n' +
      'Base legal: Consentimento (Art. 7º, I, LGPD).',
  },
} as const;

export type TipoConsentimento = keyof typeof LGPD_CONSENTIMENTOS;
