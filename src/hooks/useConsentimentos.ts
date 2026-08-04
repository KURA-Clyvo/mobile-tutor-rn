import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listConsentimentos, assinar, revogar } from '../services/consentimentos.service';
import type { AssinarConsentimentoRequest, RevogarConsentimentoRequest } from '../types/api';

export function useConsentimentos() {
  return useQuery({
    queryKey: ['consentimentos'],
    queryFn:  listConsentimentos,
    staleTime: 5 * 60_000,
  });
}

export function useAssinar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ req, key }: { req: AssinarConsentimentoRequest; key: string }) => assinar(req, key),
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consentimentos'] }),
  });
}

// TASK-31: revogação é insert-only (POST com dsAceite:'NAO'), nunca DELETE.
export function useRevogar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tipo, key }: { tipo: RevogarConsentimentoRequest['dsTipoConsentimento']; key: string }) =>
      revogar(tipo, key),
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consentimentos'] }),
  });
}
