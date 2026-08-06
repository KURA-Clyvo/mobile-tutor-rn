import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import MeusPetsScreen from '../app/(tabs)/pets/index';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Redirect: (_props: any) => null,
}));
jest.mock('../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({
    tutor:            { id: 1, nmTutor: 'Guilherme Garcia', dsEmail: 'g@k.com', dsTelefone: '', dtCadastro: '' },
    isAuthenticated:  () => true,
    themeOverride:    null,
    setThemeOverride: jest.fn(),
  }),
}));
jest.mock('../hooks/usePets', () => ({
  usePets: () => ({
    data: [
      {
        id: 1, nome: 'Bóbi', especie: 'Cão', raca: 'Labrador',
        nascimento: new Date('2021-03-10'), sexo: 'M', porte: 'G',
        nmClinica: 'Clínica KURA', statusGeral: 'URGENTE',
        alertasAtivos: 1, nrConsultas: 8, idadeAnos: 4,
        chips: [{ tone: 'clay', label: '⚠ Retorno 2d' }],
      },
      {
        id: 2, nome: 'Luna', especie: 'Gato', raca: 'Siamesa',
        nascimento: new Date('2019-07-22'), sexo: 'F', porte: 'P',
        nmClinica: 'Clínica KURA', statusGeral: 'OK',
        alertasAtivos: 0, nrConsultas: 12, idadeAnos: 6,
        chips: [],
      },
    ],
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const W = ({ children }: any) => (
  <QueryClientProvider client={client}>
    <ThemeProvider>{children}</ThemeProvider>
  </QueryClientProvider>
);

describe('MeusPetsScreen', () => {
  it('renders pet names', async () => {
    const { getByText } = render(<MeusPetsScreen />, { wrapper: W });
    await waitFor(() => {
      expect(getByText('Bóbi')).toBeTruthy();
      expect(getByText('Luna')).toBeTruthy();
    });
  });

  it('shows alert banner for URGENTE pets', async () => {
    const { getByText } = render(<MeusPetsScreen />, { wrapper: W });
    await waitFor(() => {
      expect(getByText(/Bóbi · atenção/i)).toBeTruthy();
    });
  });
});
