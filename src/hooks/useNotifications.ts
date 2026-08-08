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
//
// TASK-70 fix round 1 (achado do revisor): a dependência do efeito NÃO pode
// ser `isAuthenticated` (a função) — é a mesma referência estável durante toda
// a vida do store Zustand, então o efeito nunca re-disparava num login feito
// na sessão em curso (RootLayoutInner monta uma vez só; só re-executava se o
// app fosse reaberto com sessão já persistida). O que precisa estar no array
// de dependências é um VALOR que muda com o login/logout — `token` (string |
// null) serve exatamente para isso, com igualdade por `Object.is` do próprio
// Zustand fazendo o efeito rodar só na transição, não a cada render. A função
// `isAuthenticated()` continua chamada dentro do efeito, pela checagem de
// expiração que ela já faz — só não pode ser a dependência.
export function usePushTokenSync() {
  const token          = useAuthStore(s => s.token);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    if (!token || !isAuthenticated()) return;
    let cancelled = false;
    (async () => {
      const granted = await getPermissionStatus();
      if (!granted || cancelled) return;
      const deviceToken = await getDeviceToken();
      if (deviceToken && !cancelled) await registerDeviceToken(deviceToken);
    })();
    return () => { cancelled = true; };
  }, [token, isAuthenticated]);
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
