// S4-LOJA-05 (G2 m-h) — o service e o hook da Loja: URL, método e parâmetros realmente enviados.
// Sem este teste, trocar `size: 50` por `size: 20` no hook (ou a rota no service) passava com a suíte verde.
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { listarCatalogo } from '../services/loja.service';
import { useCatalogo } from '../hooks/useCatalogo';

const mockGet = jest.fn();
jest.mock('../services/api/client', () => ({ apiClient: { get: (...a: unknown[]) => mockGet(...a) } }));

const ENVELOPE = { aviso: 'x', content: [], page: 0, size: 50, hasNext: false };

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockResolvedValue({ data: ENVELOPE });
});

describe('loja.service::listarCatalogo', () => {
  it('faz GET em /api/v1/loja/catalogo e repassa os parâmetros como `params`', async () => {
    const res = await listarCatalogo({ categoria: 'HIGIENE', page: 1, size: 50 });
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/api/v1/loja/catalogo', { params: { categoria: 'HIGIENE', page: 1, size: 50 } });
    expect(res).toBe(ENVELOPE);
  });

  it('sem parâmetros: `params` indefinido (a API usa os defaults)', async () => {
    await listarCatalogo();
    expect(mockGet).toHaveBeenCalledWith('/api/v1/loja/catalogo', { params: undefined });
  });
});

describe('useCatalogo', () => {
  it('pede o catálogo inteiro de uma vez: size 50 (o teto da API), sem categoria nem page', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: any) => React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCatalogo(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith('/api/v1/loja/catalogo', { params: { size: 50 } });
    expect(result.current.data).toBe(ENVELOPE);
  });
});
