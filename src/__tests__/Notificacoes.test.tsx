import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';

import NotificacoesScreen from '../app/notificacoes';

// TASK-F02 (rodada de fix 1): useVoltar() (usado por NotificacoesScreen
// desde a migração) chama router.canGoBack() — sem isso no mock, um teste
// futuro que pressione "Voltar" quebra com "canGoBack is not a function".
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }) }));
jest.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    data: [
      { id: 1, dsTipo: 'VACINA_VENCENDO',        dsTitulo: 'Vacina do Bóbi', dsMensagem: 'Vence em 20 dias', dtEnvio: new Date().toISOString(), flLida: false, idPet: 1, nmPet: 'Bóbi' },
      { id: 2, dsTipo: 'AGENDAMENTO_CONFIRMADO',  dsTitulo: 'Check-up Luna',  dsMensagem: 'Clínica confirmou seu agendamento.', dtEnvio: new Date().toISOString(), flLida: true,  idPet: 2, nmPet: 'Luna', idAgendamento: 2 },
    ],
    isLoading: false,
  }),
  useMarcarLida:       () => ({ mutate: jest.fn() }),
  useMarcarTodasLidas: () => ({ mutate: jest.fn(), isPending: false }),
}));

const W = ({ children }: any) => {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}><ThemeProvider>{children}</ThemeProvider></QueryClientProvider>;
};

describe('NotificacoesScreen', () => {
  it('renders both notifications', async () => {
    const { getByText } = render(<NotificacoesScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Vacina do Bóbi')).toBeTruthy());
    expect(getByText('Check-up Luna')).toBeTruthy();
  });
  it('shows correct chips', async () => {
    const { getByText } = render(<NotificacoesScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Vacina')).toBeTruthy());
    expect(getByText('Confirmado')).toBeTruthy();
  });
  it('shows unread count in header', async () => {
    const { getByText } = render(<NotificacoesScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Notificações (1)')).toBeTruthy());
  });
});
