import type { ApiError } from '../../types/api';
export function normalizeError(error: unknown): ApiError {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = (error as any).response;
    return { status: res?.status ?? 500, code: res?.data?.code ?? 'UNKNOWN_ERROR', message: res?.data?.message ?? 'Erro desconhecido', details: res?.data?.details };
  }
  if (error instanceof Error) return { status: 0, code: 'NETWORK_ERROR', message: error.message };
  return { status: 0, code: 'UNKNOWN_ERROR', message: 'Erro desconhecido' };
}
