// BR-TUT-T04 — o agregado lista+resumo da aba Vacinas: `data` só existe quando OS DOIS responderam.
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { usePetVacinas } from '../hooks/usePetVacinas';

const mockGetVacinas = jest.fn();
const mockGetStatus = jest.fn();
jest.mock('../services/vacinas.service', () => ({
  getVacinas: (...a: unknown[]) => mockGetVacinas(...a),
  getVacinaStatus: (...a: unknown[]) => mockGetStatus(...a),
}));

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}
const STATUS = { nrAplicadas: 1, nrTotal: 1, dsStatusGeral: 'EM_DIA' };

describe('usePetVacinas (agregado)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('os dois responderam => data com vacinas e status', async () => {
    mockGetVacinas.mockResolvedValue([{ id: 1 }]);
    mockGetStatus.mockResolvedValue(STATUS);
    const { result } = renderHook(() => usePetVacinas(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual({ vacinas: [{ id: 1 }], status: STATUS });
    expect(result.current.isError).toBe(false);
  });

  it('o resumo falhou (a lista veio) => SEM data e isError: nunca "sem registro de vacinas" nem faixa "em dia" inventada', async () => {
    mockGetVacinas.mockResolvedValue([]);
    mockGetStatus.mockRejectedValue(new Error('500'));
    const { result } = renderHook(() => usePetVacinas(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('a lista falhou (o resumo veio) => SEM data e isError', async () => {
    mockGetVacinas.mockRejectedValue(new Error('500'));
    mockGetStatus.mockResolvedValue(STATUS);
    const { result } = renderHook(() => usePetVacinas(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('refetch refaz os DOIS', async () => {
    mockGetVacinas.mockResolvedValue([]);
    mockGetStatus.mockResolvedValue(STATUS);
    const { result } = renderHook(() => usePetVacinas(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toBeDefined());
    await act(async () => { await result.current.refetch(); });
    expect(mockGetVacinas).toHaveBeenCalledTimes(2);
    expect(mockGetStatus).toHaveBeenCalledTimes(2);
  });

  // G2 BR-TUT-T04 (I3): o caso do Review Focus §1, com React Query de verdade (sem mock do hook).
  it.each(['resumo', 'lista'] as const)(
    'os dois em cache e o refetch do %s falha => data MANTIDO, isError, e a idade da faixa é a do dado mais antigo (não Math.max)',
    async (lado) => {
      mockGetVacinas.mockResolvedValue([{ id: 1 }]);
      mockGetStatus.mockResolvedValue(STATUS);
      const { result } = renderHook(() => usePetVacinas(1), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.data).toBeDefined());
      await new Promise((r) => setTimeout(r, 5));
      const antesDoRefetch = Date.now();
      (lado === 'resumo' ? mockGetStatus : mockGetVacinas).mockRejectedValue(new Error('503'));
      await act(async () => { await result.current.refetch(); });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toEqual({ vacinas: [{ id: 1 }], status: STATUS });
      expect(result.current.isLoading).toBe(false);
      // o lado que refez com sucesso avança; o que falhou fica no instante antigo: a faixa diz a idade do mais velho
      expect(result.current.dataUpdatedAt).toBeLessThan(antesDoRefetch);
    },
  );

  it('offline e nunca carregado => fetchStatus "paused" (o QueryState não pode ver "idle" e renderizar nada)', async () => {
    onlineManager.setOnline(false);
    try {
      mockGetVacinas.mockResolvedValue([]);
      mockGetStatus.mockResolvedValue(STATUS);
      const { result } = renderHook(() => usePetVacinas(1), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.fetchStatus).toBe('paused'));
      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(false);
    } finally {
      onlineManager.setOnline(true);
    }
  });

  it('id inválido => nada pedido (desabilitada): sem data, sem erro, sem carregando', () => {
    const { result } = renderHook(() => usePetVacinas(0), { wrapper: createWrapper() });
    expect(result.current).toMatchObject({ data: undefined, isError: false, isLoading: false, fetchStatus: 'idle' });
    expect(mockGetVacinas).not.toHaveBeenCalled();
  });
});
