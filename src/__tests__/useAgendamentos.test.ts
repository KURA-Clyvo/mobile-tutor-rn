import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../services/agendamentos.service', () => ({
  listAgendamentos: jest.fn(() => Promise.resolve([
    { id: 1, dtInicio: new Date(Date.now() + 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'RETORNO', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'KURA', dsMotivo: 'Retorno' },
    { id: 2, dtInicio: new Date(Date.now() - 86400_000).toISOString(), nrDuracaoMinutos: 60, sgStatus: 'CONCLUIDO',  sgTipoConsulta: 'ROTINA',  pet: { id: 2, nmPet: 'Luna', nmEspecie: 'Gato', nmRaca: 'Siamesa' }, nmClinica: 'KURA', dsMotivo: 'Rotina' },
  ])),
  solicitarAgendamento: jest.fn(),
  cancelarAgendamento:  jest.fn(),
}));

const wrapper = ({ children }: any) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

import { useAgendamentos, useAgendamentoBadgeCount } from '../hooks/useAgendamentos';

describe('useAgendamentos', () => {
  it('returns list', async () => {
    const { result } = renderHook(() => useAgendamentos(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });
  it('badge count counts only SOLICITADO', async () => {
    const { result } = renderHook(() => useAgendamentoBadgeCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(1));
  });
});
