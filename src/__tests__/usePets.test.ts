import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePets } from '../hooks/usePets';

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

jest.mock('../services/pets.service', () => ({
  listPets: jest.fn().mockResolvedValue([
    {
      id: 3, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'SRD', dtNascimento: '2023-01-15',
      sgSexo: 'M', sgPorte: 'M', nmClinica: 'Clínica KURA', dsStatusGeral: 'ALERTA',
      nrAlertasAtivos: 1, nrConsultas: 2, chips: [],
    },
    {
      id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10',
      sgSexo: 'M', sgPorte: 'G', nmClinica: 'Clínica KURA', dsStatusGeral: 'URGENTE',
      nrAlertasAtivos: 1, nrConsultas: 8, chips: [],
    },
    {
      id: 2, nmPet: 'Luna', nmEspecie: 'Gato', nmRaca: 'Siamesa', dtNascimento: '2019-07-22',
      sgSexo: 'F', sgPorte: 'P', nmClinica: 'Clínica KURA', dsStatusGeral: 'OK',
      nrAlertasAtivos: 0, nrConsultas: 12, chips: [],
    },
  ]),
}));

describe('usePets', () => {
  it('sorts pets URGENTE → ALERTA → OK', async () => {
    const { result } = renderHook(() => usePets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const names = result.current.data!.map(p => p.nome);
    expect(names).toEqual(['Bóbi', 'Thor', 'Luna']);
  });

  it('maps nmPet to nome', async () => {
    const { result } = renderHook(() => usePets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0]!.nome).toBe('Bóbi');
  });
});
