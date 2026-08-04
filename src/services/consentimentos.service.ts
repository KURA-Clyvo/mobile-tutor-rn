import { apiClient } from './api/client';
import type {
  ConsentimentoResponse, AssinarConsentimentoRequest, AssinarConsentimentoResponse,
  RevogarConsentimentoRequest, RevogarConsentimentoResponse,
} from '../types/api';

export const listConsentimentos = () =>
  apiClient.get<ConsentimentoResponse[]>('/api/v1/tutor/consentimentos').then(r => r.data);

export const assinar = (req: AssinarConsentimentoRequest, idempotencyKey: string) =>
  apiClient.post<AssinarConsentimentoResponse>('/api/v1/tutor/consentimentos', req, {
    headers: { 'Idempotency-Key': idempotencyKey },
  }).then(r => r.data);

// TASK-31 — decisão travada: consentimento é insert-only (LGPD). DELETE nunca é
// chamado; revogar = um novo POST com dsAceite: 'NAO' (mesmo endpoint de assinar,
// que já suporta essa semântica no Java — ConsentimentoRequest.aceito). O 501 do
// DELETE no Java permanece como stub documentado, não usado pelo app.
export const revogar = (tipo: RevogarConsentimentoRequest['dsTipoConsentimento'], idempotencyKey: string) =>
  apiClient.post<RevogarConsentimentoResponse>('/api/v1/tutor/consentimentos',
    { dsTipoConsentimento: tipo, dsAceite: 'NAO' } satisfies RevogarConsentimentoRequest,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  ).then(r => r.data);
