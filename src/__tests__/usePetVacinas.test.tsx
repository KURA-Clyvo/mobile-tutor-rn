// BR-TUT-T06 (m5): a aba Vacinas lê SÓ a lista. O resumo `/vacinas/status` não é mais buscado: a falha dele não derruba a aba.
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

// o React Query só re-renderiza por campo LIDO no render: lê-os aqui, como a tela (QueryState) faz
const useLido = (id: number) => {
  const q = usePetVacinas(id);
  return { data: q.data, isError: q.isError, isLoading: q.isLoading, fetchStatus: q.fetchStatus, refetch: q.refetch };
};

describe('usePetVacinas', () => {
  beforeEach(() => jest.clearAllMocks());

  it('a lista respondeu => data é a lista, e o resumo NUNCA é pedido', async () => {
    mockGetVacinas.mockResolvedValue([{ id: 1 }]);
    const { result } = renderHook(() => useLido(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.isError).toBe(false);
    expect(mockGetStatus).not.toHaveBeenCalled();
  });

  it('a lista falhou => SEM data e isError', async () => {
    mockGetVacinas.mockRejectedValue(new Error('500'));
    const { result } = renderHook(() => useLido(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('em cache e o refetch falha => data MANTIDO e isError (a tela decide: dado salvo + faixa)', async () => {
    mockGetVacinas.mockResolvedValue([{ id: 1 }]);
    const { result } = renderHook(() => useLido(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toBeDefined());
    mockGetVacinas.mockRejectedValue(new Error('503'));
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.isLoading).toBe(false);
  });

  it('offline e nunca carregado => fetchStatus "paused" (o QueryState não pode ver "idle" e renderizar nada)', async () => {
    onlineManager.setOnline(false);
    try {
      mockGetVacinas.mockResolvedValue([]);
      const { result } = renderHook(() => useLido(1), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.fetchStatus).toBe('paused'));
      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(false);
    } finally {
      onlineManager.setOnline(true);
    }
  });

  it('id inválido => nada pedido (desabilitada): sem data, sem erro, sem carregando', () => {
    const { result } = renderHook(() => useLido(0), { wrapper: createWrapper() });
    expect(result.current).toMatchObject({ data: undefined, isError: false, isLoading: false, fetchStatus: 'idle' });
    expect(mockGetVacinas).not.toHaveBeenCalled();
  });
});
