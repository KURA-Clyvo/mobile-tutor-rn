// `notifications.service.ts` documenta a decisão travada: NOTIFICACAO é .NET owned, o
// Java nunca escreve nela, então não existe PATCH marcar-lida — "lida" é estado local,
// só na sessão do app. Mas `useNotifications.ts` implementava isso como update otimista
// da cache do react-query seguido de `onSettled: invalidateQueries(['notificacoes'])`:
// o invalidate refaz o GET, o servidor devolve `flLida: false` (ele nunca soube da
// leitura) e o update otimista é descartado. Comentário e código diziam coisas opostas.
//
// O servidor falso abaixo é deliberadamente AMNÉSICO — devolve `flLida: false` em toda
// chamada. É exatamente o que o backend real faz, e é a única forma de o teste distinguir
// "lida sobreviveu" de "a resposta por acaso trouxe lida".
import React from 'react';
import { DeviceEventEmitter } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications, useMarcarLida, useMarcarTodasLidas } from '../hooks/useNotifications';
import { useNotificacoesLidasStore } from '../store/notificacoesLidasStore';
import type { NotificacaoTutorResponse } from '../types/api';

const mockServidorAmnesico = jest.fn();
jest.mock('../services/notifications.service', () => ({
  getNotificacoes:     () => mockServidorAmnesico(),
  marcarLida:          async (id: number) => ({ id, flLida: true }),
  marcarTodasLidas:    async () => ({ count: 0 }),
  getPermissionStatus: async () => false,
  getDeviceToken:      async () => null,
  registerDeviceToken: async () => true,
}));

const doServidor = (): NotificacaoTutorResponse[] => ([
  { id: 1, dsTipo: 'RETORNO_PENDENTE', dsTitulo: 'Retorno do Bóbi',  dsMensagem: 'em 2 dias',  dtEnvio: '2026-08-20T10:00:00Z', flLida: false },
  { id: 2, dsTipo: 'VACINA_VENCENDO',  dsTitulo: 'Vacina vencendo',  dsMensagem: 'em 20 dias', dtEnvio: '2026-08-20T09:00:00Z', flLida: false },
  { id: 3, dsTipo: 'AGENDAMENTO_CONFIRMADO', dsTitulo: 'Confirmado', dsMensagem: 'check-up',   dtEnvio: '2026-08-19T09:00:00Z', flLida: true  },
]);

const clientesAbertos: QueryClient[] = [];

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  clientesAbertos.push(qc);
  const hook = renderHook(() => ({
    lista:  useNotifications(),
    uma:    useMarcarLida(),
    todas:  useMarcarTodasLidas(),
  }), { wrapper });
  return { ...hook, qc };
}

const lida = (r: any, id: number) => r.current.lista.data?.find((n: NotificacaoTutorResponse) => n.id === id)?.flLida;

beforeEach(() => {
  mockServidorAmnesico.mockReset();
  mockServidorAmnesico.mockImplementation(async () => doServidor());
  // O store é um singleton de módulo: sem zerar, a leitura de um teste vaza para o
  // seguinte e o teste "não lida continua false" passaria (ou falharia) por engano.
  useNotificacoesLidasStore.getState().limpar();
});

afterEach(() => {
  // Sem isto o Jest fica pendurado depois do último teste: cada QueryClient mantém
  // timers de garbage collection vivos, e o runner só encerra quando eles somem.
  clientesAbertos.splice(0).forEach(qc => { qc.clear(); qc.unmount(); });
});

describe('notificações lidas — sobrevivem ao servidor amnésico', () => {
  it('marcar UMA como lida sobrevive a um GET novo', async () => {
    const { result, qc } = montar();
    await waitFor(() => expect(result.current.lista.data).toHaveLength(3));

    await act(async () => { result.current.uma.mutate(1); });
    await waitFor(() => expect(result.current.uma.isSuccess).toBe(true));
    await act(async () => { await qc.refetchQueries({ queryKey: ['notificacoes'] }); });

    expect(lida(result, 1)).toBe(true);
    expect(lida(result, 2)).toBe(false);
  });

  it('marcar TODAS sobrevive a um GET novo', async () => {
    const { result, qc } = montar();
    await waitFor(() => expect(result.current.lista.data).toHaveLength(3));

    await act(async () => { result.current.todas.mutate(); });
    await waitFor(() => expect(result.current.todas.isSuccess).toBe(true));
    await act(async () => { await qc.refetchQueries({ queryKey: ['notificacoes'] }); });

    expect(lida(result, 1)).toBe(true);
    expect(lida(result, 2)).toBe(true);
  });

  it('a mutação não dispara GET nenhum — não há escrita no servidor para revalidar', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.lista.data).toHaveLength(3));
    const gets = mockServidorAmnesico.mock.calls.length;

    await act(async () => { result.current.uma.mutate(1); });
    await waitFor(() => expect(result.current.uma.isSuccess).toBe(true));

    expect(mockServidorAmnesico.mock.calls.length).toBe(gets);
  });

  it('leitura de um tutor não vaza para a sessão do próximo', async () => {
    // A leitura saiu da cache do react-query, que `app/_layout.tsx` já limpava no
    // `auth:logout`. Num store próprio ela sobreviveria à troca de sessão e o tutor
    // seguinte abriria o app com as notificações DELE já marcadas como lidas.
    const { result } = montar();
    await waitFor(() => expect(result.current.lista.data).toHaveLength(3));
    await act(async () => { result.current.uma.mutate(1); });
    await waitFor(() => expect(lida(result, 1)).toBe(true));

    act(() => { DeviceEventEmitter.emit('auth:logout'); });

    expect(useNotificacoesLidasStore.getState().lidas).toEqual([]);
  });
});
