import { apiClient } from './api/client';
import type { ConsentimentoResponse, ConsentimentoRequest, TipoConsentimentoApi } from '../types/api';

// TASK-73 (FIX_7): camada anti-corrupção, mesmo padrão de auth.service.ts (TASK-55/
// 61) — a tela (consentimentos.tsx) continua falando só em `tipo`/idempotency key,
// e é aqui que o corpo vira o shape Java real (ConsentimentoRequest: tipo/
// versaoTermo/aceito 'S'|'N'). Antes desta task o service mandava o corpo cru da
// tela (dsTipoConsentimento/dsAceite:'SIM'|'NAO'), que não existe no Java — daí o
// 400 permanente (B0.1).
//
// `VERSAO_TERMO_ATUAL` espelha o mesmo padrão de auth.service.ts (TermoVigente.* no
// backend-tutor-java, hoje 'v1.0' para todos os tipos) — reaproveitado, não
// reinventado, como o brief pediu. Mesmo risco documentado lá: se o Java der bump
// em TermoVigente antes do app atualizar, o POST falha com 422/
// RegraDeNegocioException (ValidadorConsentimento.validarVersaoTermo).
const VERSAO_TERMO_ATUAL = 'v1.0';

export const listConsentimentos = () =>
  apiClient.get<ConsentimentoResponse[]>('/api/v1/tutor/consentimentos').then(r => r.data);

export const assinar = (tipo: TipoConsentimentoApi, idempotencyKey: string) =>
  apiClient.post<ConsentimentoResponse>('/api/v1/tutor/consentimentos',
    { tipo, versaoTermo: VERSAO_TERMO_ATUAL, aceito: 'S' } satisfies ConsentimentoRequest,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  ).then(r => r.data);

// TASK-31 — decisão travada: consentimento é insert-only (LGPD). DELETE nunca é
// chamado; revogar = um novo POST com aceito:'N' (mesmo endpoint de assinar, que já
// suporta essa semântica no Java — ConsentimentoRequest.aceito). O 501 do DELETE no
// Java permanece como stub documentado, não usado pelo app.
export const revogar = (tipo: TipoConsentimentoApi, idempotencyKey: string) =>
  apiClient.post<ConsentimentoResponse>('/api/v1/tutor/consentimentos',
    { tipo, versaoTermo: VERSAO_TERMO_ATUAL, aceito: 'N' } satisfies ConsentimentoRequest,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  ).then(r => r.data);
