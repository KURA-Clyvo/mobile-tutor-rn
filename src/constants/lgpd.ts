export const LGPD_CONSENTIMENTOS = {
  COMUNICACAO_WHATSAPP: {
    titulo: 'Comunicação via WhatsApp',
    resumo: 'Autorizo o envio de lembretes, confirmações e comunicados via WhatsApp.',
    textoCompleto:
      'Ao aceitar, você autoriza a clínica veterinária parceira a enviar mensagens via ' +
      'WhatsApp Business (operado pela KURA em parceria com Twilio) com lembretes de vacinas, ' +
      'confirmações de agendamento, resultados de exames e comunicados gerais.\n\n' +
      'Você pode revogar este consentimento a qualquer momento nesta tela.\n' +
      'Base legal: Legítimo interesse (Art. 7º, IX, LGPD).',
  },
  DADOS_CLINICOS_IA: {
    titulo: 'Uso de IA nos dados clínicos',
    resumo: 'Autorizo o uso do subsistema Luna (IA) para análise do histórico do meu pet.',
    textoCompleto:
      'Ao aceitar, você autoriza que o subsistema de inteligência artificial da KURA (Luna) ' +
      'processe o histórico clínico do seu pet para gerar sugestões de investigação, ' +
      'lembretes personalizados e análise de risco preventivo.\n\n' +
      'Toda saída de IA é classificada como "sugestão" — o veterinário tem a palavra final.\n' +
      'Base legal: Consentimento (Art. 7º, I, LGPD).',
  },
  COMPARTILHAMENTO_LABORATORIO: {
    titulo: 'Compartilhamento com laboratórios',
    resumo: 'Autorizo o envio de dados do meu pet a laboratórios veterinários parceiros.',
    textoCompleto:
      'Ao aceitar, você autoriza que a clínica veterinária envie os dados necessários ' +
      '(nome do pet, espécie, raça, histórico de exames) a laboratórios parceiros para execução ' +
      'de exames solicitados pelo veterinário responsável.\n\n' +
      'Os dados são transmitidos via canal seguro (TLS 1.3) e retidos pelo laboratório ' +
      'somente pelo período mínimo necessário.\n' +
      'Base legal: Execução de contrato (Art. 7º, V, LGPD).',
  },
} as const;

export type TipoConsentimento = keyof typeof LGPD_CONSENTIMENTOS;
