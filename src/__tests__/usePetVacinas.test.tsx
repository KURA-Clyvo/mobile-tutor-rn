// BR-TUT-T04 — o agregado lista+resumo da aba Vacinas: `data` só existe quando OS DOIS responderam.
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

  it('id inválido => nada pedido (desabilitada): sem data, sem erro, sem carregando', () => {
    const { result } = renderHook(() => usePetVacinas(0), { wrapper: createWrapper() });
    expect(result.current).toMatchObject({ data: undefined, isError: false, isLoading: false, fetchStatus: 'idle' });
    expect(mockGetVacinas).not.toHaveBeenCalled();
  });
});
