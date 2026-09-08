import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAgendamentos, solicitarAgendamento, cancelarAgendamento, remarcarAgendamento } from '../services/agendamentos.service';

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

// T-7a: remarcar. `invalidateQueries(['agendamentos'])` é o que faz a lista E a grade
// de horários (`useHorariosOcupados`, que lê a mesma chave) se atualizarem sozinhas —
// sem reiniciar o app, que é o que a penalidade VI cita literalmente.
export function useRemarcarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: remarcarAgendamento,
    retry: 0,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}

/**
 * Erro do remarcar em texto para o tutor. O 409 é o caso que NÃO pode cair no
 * genérico: ele significa que o agendamento mudou entre a leitura e o envio, e a ação
 * do tutor é recarregar — "erro ao remarcar" o deixaria tentando de novo para sempre.
 */
export function mensagemDeErroDeRemarcar(err: unknown): string {
  const status = (err as { status?: number })?.status;
  if (status === 409) return 'Este horário mudou. Recarregue e tente de novo.';
  if (status === 422) return 'Este agendamento já foi concluído ou cancelado e não pode ser remarcado.';
  if (status === 403) return 'Este agendamento não é seu.';
  return 'Não foi possível remarcar. Tente novamente.';
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
