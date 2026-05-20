import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAgendamentos, solicitarAgendamento, cancelarAgendamento } from '../services/agendamentos.service';

export function useAgendamentos() {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn:  listAgendamentos,
    staleTime: 30_000,
  });
}

export function useSolicitarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: solicitarAgendamento,
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}

export function useCancelarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelarAgendamento,
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}

export function useAgendamentoBadgeCount(): number {
  const { data = [] } = useAgendamentos();
  return data.filter(a => a.sgStatus === 'SOLICITADO').length;
}
