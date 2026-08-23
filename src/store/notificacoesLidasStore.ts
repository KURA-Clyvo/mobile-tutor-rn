import { create } from 'zustand';
import { DeviceEventEmitter } from 'react-native';

/**
 * Quais notificações o tutor já abriu NESTA sessão.
 *
 * Por que um store, e não a cache do react-query: a decisão travada em
 * `services/notifications.service.ts` é que NOTIFICACAO é .NET owned, o Java nunca
 * escreve nela e portanto não existe PATCH marcar-lida — "lida" é estado local. Mas
 * a cache do react-query é, por definição, um espelho do servidor: qualquer refetch
 * (o `staleTime` de 15 s vencendo, a tela remontando, o `invalidateQueries` do handler
 * de push) sobrescreve o que estiver lá com a resposta do GET, que sempre diz
 * `flLida: false`. Estado que o servidor não conhece não pode morar na cache dele.
 *
 * Deliberadamente SEM `persist`: o comentário do service diz "só na sessão do app", e
 * persistir daria ao tutor a impressão de uma leitura que o servidor nunca registrou.
 */
interface NotificacoesLidasState {
  lidas: number[];
  marcar:      (id: number) => void;
  marcarVarias:(ids: number[]) => void;
  /** Chamado na troca de sessão: leitura de um tutor não pode vazar para o próximo. */
  limpar:      () => void;
}

export const useNotificacoesLidasStore = create<NotificacoesLidasState>()((set) => ({
  lidas: [],
  marcar: (id) =>
    set(s => (s.lidas.includes(id) ? s : { lidas: [...s.lidas, id] })),
  marcarVarias: (ids) =>
    set(s => {
      const novas = ids.filter(id => !s.lidas.includes(id));
      return novas.length === 0 ? s : { lidas: [...s.lidas, ...novas] };
    }),
  limpar: () => set({ lidas: [] }),
}));

// A limpeza é assinada AQUI, no módulo do store, e não no listener de `auth:logout` de
// `app/_layout.tsx` que já limpa a cache do react-query. Dois motivos:
//   1. antes desta mudança "lida" morava na cache, então limpar a cache limpava a leitura
//      junto — de graça. Agora que o estado tem casa própria, a invariante "leitura não
//      atravessa troca de sessão" passa a depender de alguém lembrar de limpá-la, e é
//      exatamente esse tipo de acoplamento invisível que apodrece;
//   2. o `_layout` só está montado quando a árvore de UI está de pé. O 401 que dispara
//      `auth:logout` sai do interceptor de `services/api/client.ts`, que não tem essa
//      garantia.
DeviceEventEmitter.addListener('auth:logout', () => {
  useNotificacoesLidasStore.getState().limpar();
});
