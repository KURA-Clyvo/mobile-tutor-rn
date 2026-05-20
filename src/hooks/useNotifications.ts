import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificacoes, marcarLida, marcarTodasLidas } from '../services/notifications.service';

export function useNotifications() {
  return useQuery({
    queryKey: ['notificacoes'],
    queryFn:  getNotificacoes,
    staleTime: 15_000,
  });
}

export function useMarcarLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marcarLida,
    retry: 0,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notificacoes'] });
      const prev = qc.getQueryData<import('../types/api').NotificacaoTutorResponse[]>(['notificacoes']);
      qc.setQueryData<import('../types/api').NotificacaoTutorResponse[]>(['notificacoes'], old =>
        old?.map(n => n.id === id ? { ...n, flLida: true } : n) ?? []
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notificacoes'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });
}

export function useMarcarTodasLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marcarTodasLidas,
    retry: 0,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notificacoes'] });
      const prev = qc.getQueryData<import('../types/api').NotificacaoTutorResponse[]>(['notificacoes']);
      qc.setQueryData<import('../types/api').NotificacaoTutorResponse[]>(['notificacoes'], old =>
        old?.map(n => ({ ...n, flLida: true })) ?? []
      );
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notificacoes'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });
}
