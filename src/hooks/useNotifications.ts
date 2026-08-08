import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import {
  getNotificacoes, marcarLida, marcarTodasLidas,
  getPermissionStatus, getDeviceToken, registerDeviceToken,
} from '../services/notifications.service';

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

// TASK-70: sincroniza o push token com o servidor sempre que há sessão de
// tutor autenticada. Cobre o caso em que a permissão do dispositivo já estava
// concedida ANTES de o tutor interagir com o toggle da tela de perfil (ex.:
// Android < 13, que concede notificação por padrão, sem prompt — sem este
// hook, `registerDeviceToken` nunca seria chamado para esse tutor, porque o
// switch já nasceria `true` e não haveria transição false→true para disparar
// o registro). Não solicita permissão (isso é ação explícita do usuário via
// `requestPermission`, chamada só a partir do toggle) — só sincroniza se ela
// já estiver concedida. Chamado uma vez em `app/_layout.tsx::RootLayoutInner`.
export function usePushTokenSync() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    (async () => {
      const granted = await getPermissionStatus();
      if (!granted || cancelled) return;
      const token = await getDeviceToken();
      if (token && !cancelled) await registerDeviceToken(token);
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);
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
