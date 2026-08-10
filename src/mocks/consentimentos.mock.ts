import type { ConsentimentoResponse } from '../types/api';

// TASK-73 (FIX_7): shape cru do Java (ConsentimentoResponse.java) — o que
// `listConsentimentos()` CONSOME via `apiClient.get(...).then(r => r.data)`, não um
// shape app-facing inventado. Regra de ouro v5 (KURA_BACKLOG_FIX_5): o mock é o
// segundo consumidor da mesma função; o shape antigo (id/dsTipoConsentimento/
// sgStatus/dtConsentimento) nunca bateu com o Java real nem com o novo tipo
// ConsentimentoResponse — corrigir só o service teria deixado o modo mock quebrado
// de novo (screen lendo `c.tipo`/`c.ativo`, que não existiam no mock antigo).
export async function list(): Promise<ConsentimentoResponse[]> {
  return [
    {
      idConsentimento: 1, tipo: 'LEMBRETES', versaoTermo: 'v1.0',
      aceito: true, ativo: true,
      dtAceite: new Date(Date.now() - 30 * 86400_000).toISOString(),
      dtRevogacao: null,
    },
    {
      idConsentimento: 2, tipo: 'DADOS_ANONIMOS', versaoTermo: 'v1.0',
      aceito: false, ativo: false,
      dtAceite: new Date(Date.now() - 60 * 86400_000).toISOString(),
      dtRevogacao: new Date(Date.now() - 10 * 86400_000).toISOString(),
    },
    // TELEORIENTACAO, COMPARTILHAR_SEGURADORA, MARKETING ausentes de propósito —
    // consentimento pendente (status "Pendente" na UI).
  ];
}
