import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listConsentimentos, assinar, revogar } from '../services/consentimentos.service';
import type { AssinarConsentimentoRequest } from '../types/api';

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

export function useRevogar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revogar,
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consentimentos'] }),
  });
}
