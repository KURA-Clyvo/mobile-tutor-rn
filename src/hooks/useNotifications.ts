import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useNotificacoesLidasStore } from '../store/notificacoesLidasStore';
import type { NotificacaoTutorResponse } from '../types/api';
import {
  getNotificacoes, marcarLida, marcarTodasLidas,
  getPermissionStatus, getDeviceToken, registerDeviceToken,
} from '../services/notifications.service';

export function useNotifications() {
  const lidas = useNotificacoesLidasStore(s => s.lidas);
  const query = useQuery({
    queryKey: ['notificacoes'],
    queryFn:  getNotificacoes,
    staleTime: 15_000,
  });

  // A cache guarda a verdade do servidor; a leitura local é sobreposta na hora de ler.
  // É o que faz "lida" sobreviver a um refetch de QUALQUER origem — antes o estado morava
  // dentro da própria cache, então todo GET novo o apagava (o servidor sempre responde
  // `flLida: false`, porque não existe endpoint que registre a leitura).
  const data = useMemo(
    () => query.data?.map(n => (!n.flLida && lidas.includes(n.id) ? { ...n, flLida: true } : n)),
    [query.data, lidas],
  );

  return { ...query, data };
}

// `mutationFn` continua sendo a função do service (hoje um no-op que só resolve) em vez
// de escrever direto no store: é a costura por onde entra o PATCH real no dia em que o
// backend expuser um — aí só o service muda, e o `onSuccess` já está no lugar certo.
// O `invalidateQueries` que existia no `onSettled` saiu de propósito: sem escrita no
// servidor ele não tinha o que buscar de novo, e o refetch que ele disparava era
// exatamente o que desfazia a leitura que a mutação acabara de registrar.
export function useMarcarLida() {
  const marcar = useNotificacoesLidasStore(s => s.marcar);
  return useMutation({
    mutationFn: marcarLida,
    retry: 0,
    onSuccess: (_res, id) => marcar(id),
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
  const marcarVarias = useNotificacoesLidasStore(s => s.marcarVarias);
  return useMutation({
    mutationFn: marcarTodasLidas,
    retry: 0,
    // Os ids saem da cache (a verdade do servidor), não da lista já mesclada: o que
    // interessa é o conjunto completo do que existe, e marcar de novo algo já lido é
    // no-op no store.
    onSuccess: () => {
      const doServidor = qc.getQueryData<NotificacaoTutorResponse[]>(['notificacoes']) ?? [];
      marcarVarias(doServidor.map(n => n.id));
    },
  });
}
