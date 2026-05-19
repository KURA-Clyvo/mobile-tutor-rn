import type { ConsentimentoResponse } from '../types/api';
export async function list(): Promise<ConsentimentoResponse[]> {
  return [
    { id: 1, dsTipoConsentimento: 'COMUNICACAO_WHATSAPP', sgStatus: 'ATIVO', dtConsentimento: new Date(Date.now() - 30 * 86400_000).toISOString() },
    { id: 2, dsTipoConsentimento: 'DADOS_CLINICOS_IA', sgStatus: 'REVOGADO', dtConsentimento: new Date(Date.now() - 60 * 86400_000).toISOString(), dtRevogacao: new Date(Date.now() - 10 * 86400_000).toISOString() },
    // COMPARTILHAMENTO_LABORATORIO absent — pending consent (status "Pendente" in UI)
  ];
}
