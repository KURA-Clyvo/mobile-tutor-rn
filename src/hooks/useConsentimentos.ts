import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listConsentimentos, assinar, revogar } from '../services/consentimentos.service';
import type { TipoConsentimentoApi } from '../types/api';

export function useConsentimentos() {
  return useQuery({
    queryKey: ['consentimentos'],
    queryFn:  listConsentimentos,
    staleTime: 5 * 60_000,
  });
}

// TASK-73 (FIX_7): `req` (AssinarConsentimentoRequest) virou `tipo` — a montagem do
// shape Java (versaoTermo/aceito:'S') agora é responsabilidade do service, não da
// tela (ver consentimentos.service.ts).
export function useAssinar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tipo, key }: { tipo: TipoConsentimentoApi; key: string }) => assinar(tipo, key),
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consentimentos'] }),
  });
}

// TASK-31: revogação é insert-only (POST com aceito:'N'), nunca DELETE.
export function useRevogar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tipo, key }: { tipo: TipoConsentimentoApi; key: string }) => revogar(tipo, key),
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consentimentos'] }),
  });
}
