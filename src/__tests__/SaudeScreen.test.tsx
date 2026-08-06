import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';

import SaudeScreen from '../app/(tabs)/saude/index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../hooks/usePets', () => ({
  usePets: () => ({
    data: [
      { id: 1, nome: 'Bóbi', especie: 'Cão', raca: 'Labrador', idadeAnos: 3, sexo: 'M', porte: 'G', statusGeral: 'URGENTE', alertasAtivos: 1, chips: [], nmClinica: 'KURA' },
      { id: 2, nome: 'Luna', especie: 'Gato', raca: 'Siamesa',  idadeAnos: 5, sexo: 'F', porte: 'P', statusGeral: 'OK',      alertasAtivos: 0, chips: [], nmClinica: 'KURA' },
    ],
    isLoading: false, refetch: jest.fn(),
  }),
}));
jest.mock('../services/vacinas.service', () => ({
  getVacinas: jest.fn(() => Promise.resolve([])),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueries: () => [
    { data: [], isLoading: false, refetch: jest.fn() },
    { data: [], isLoading: false, refetch: jest.fn() },
  ],
}));

const W = ({ children }: any) => {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}><ThemeProvider>{children}</ThemeProvider></QueryClientProvider>;
};

describe('SaudeScreen', () => {
  it('shows alert banner for URGENTE pet', async () => {
    const { getByText } = render(<SaudeScreen />, { wrapper: W });
    await waitFor(() => expect(getByText(/Bóbi/)).toBeTruthy());
  });
  it('renders title', () => {
    const { getByText } = render(<SaudeScreen />, { wrapper: W });
    expect(getByText(/Saúde dos seus/)).toBeTruthy();
  });
});
