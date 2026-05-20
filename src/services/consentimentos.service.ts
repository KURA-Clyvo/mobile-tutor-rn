import { apiClient } from './api/client';
import type { ConsentimentoResponse, AssinarConsentimentoRequest, AssinarConsentimentoResponse, RevogarConsentimentoResponse } from '../types/api';

export const listConsentimentos = () =>
  apiClient.get<ConsentimentoResponse[]>('/api/v1/tutor/consentimentos').then(r => r.data);

export const assinar = (req: AssinarConsentimentoRequest, idempotencyKey: string) =>
  apiClient.post<AssinarConsentimentoResponse>('/api/v1/tutor/consentimentos', req, {
    headers: { 'Idempotency-Key': idempotencyKey },
  }).then(r => r.data);

export const revogar = (id: number) =>
  apiClient.delete<RevogarConsentimentoResponse>(`/api/v1/tutor/consentimentos/${id}`).then(r => r.data);
