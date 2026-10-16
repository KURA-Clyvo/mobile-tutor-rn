import { isAxiosError } from 'axios';
import type { ApiError } from '../../types/api';

// TASK-61 (fix round 2 — achado da re-revisão): o backend-tutor-java (`ApiError`
// record, shared/exception/ApiError.java) serializa os campos de erro em português —
// `codigo`/`mensagem`/`detalhes`, sem tradução pra inglês nem @JsonProperty. Este
// normalizador lia `code`/`message`/`details` (nomes em inglês, que não existem no
// corpo real), então TODO erro vindo do Java sempre caía nos defaults
// ('UNKNOWN_ERROR'/'Erro desconhecido'), não só os desta task. Bug pré-existente
// (não introduzido pela TASK-61) — a captura de consentimento LGPD só expôs o
// sintoma porque `isVersaoTermoDesatualizadaError` depende de inspecionar
// `message` de verdade. Fallback pros nomes em inglês mantido por segurança, caso
// algum outro backend consumido pelo app (ou algo que já dependa do formato antigo)
// use essa convenção.
export function normalizeError(error: unknown): ApiError {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res  = (error as any).response;
    const data = res?.data ?? {};
    return {
      status:  res?.status ?? 500,
      code:    data.codigo   ?? data.code    ?? 'UNKNOWN_ERROR',
      message: data.mensagem ?? data.message ?? 'Erro desconhecido',
      details: data.detalhes ?? data.details,
    };
  }
  // BR-TUT-T05: 'NETWORK_ERROR' só quando o axios diz que NÃO houve resposta (sem rede, DNS, timeout): a
  // requisição saiu (`request` presente), não veio `response` e não foi cancelada. Cancelamento, erro de
  // configuração do axios (nem saiu) e qualquer outro Error (bug de código, JSON inválido) NÃO são rede — antes
  // tudo virava NETWORK_ERROR e o login culpava a internet sem saber.
  if (isAxiosError(error) && !!error.request && !error.response && error.code !== 'ERR_CANCELED') return { status: 0, code: 'NETWORK_ERROR', message: error.message };
  if (error instanceof Error) return { status: 0, code: 'UNKNOWN_ERROR', message: error.message };
  return { status: 0, code: 'UNKNOWN_ERROR', message: 'Erro desconhecido' };
}
