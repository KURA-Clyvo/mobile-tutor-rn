import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAgendamentos, solicitarAgendamento, cancelarAgendamento } from '../services/agendamentos.service';
import { marcarStatusVisto } from '../services/avisosAgendamento.service';
import { useAuthStore } from '../store/authStore';

// S4-MOB-03: `opcoes` serve ao observador global de avisos (useAvisosAgendamento), que liga o polling
// e só consulta com sessão. A tela de Agenda continua chamando sem opções.
export function useAgendamentos(opcoes: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn:  listAgendamentos,
    staleTime: 30_000,
    ...opcoes,
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
    onSuccess: async (_r, id) => {
      // S4-MOB-03: quem cancelou foi o tutor; grava antes do refetch para não virar "cancelada pela clínica".
      const idTutor = useAuthStore.getState().tutor?.id;
      if (idTutor) await marcarStatusVisto(idTutor, id, 'CANCELADO').catch(() => undefined);
      await qc.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });
}

export function useAgendamentoBadgeCount(): number {
  const { data = [] } = useAgendamentos();
  return data.filter(a => a.sgStatus === 'SOLICITADO').length;
}
