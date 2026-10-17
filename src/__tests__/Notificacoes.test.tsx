import React from 'react';
import { StyleSheet } from 'react-native';
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
      { id: 1, dsTipo: 'LEMBRETE_VACINA',         dsTitulo: 'Vacina do Bóbi', dsMensagem: 'Vence em 20 dias', dtEnvio: new Date().toISOString(), flLida: false, idPet: 1 },
      { id: 2, dsTipo: 'AVISO',                   dsTitulo: 'Check-up Luna',  dsMensagem: 'Clínica confirmou seu agendamento.', dtEnvio: new Date().toISOString(), flLida: true },
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
    expect(getByText('Aviso')).toBeTruthy();
  });
  it('shows unread count in header', async () => {
    const { getByText } = render(<NotificacoesScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Notificações (1)')).toBeTruthy());
  });
  // G2 M-1 (fix de 66f98e6): no maior tamanho de fonte o cabeçalho não pode estourar a tela. O Jest não mede largura em
  // px, então o teste trava o ESTILO que impede o estouro (título encolhe com minWidth 0; "Ler todas" encolhe). LIMITE
  // DECLARADO: provar o não-estouro de verdade é a sonda de DOM a 2x (`br-tut-t09-texto2x.mjs`), fora do CI.
  it('cabeçalho a 2x: título pode encolher (minWidth 0, flex 1) e "Ler todas" pode encolher (flexShrink 1)', () => {
    const { getByText, getByRole } = render(<NotificacoesScreen />, { wrapper: W });
    const titulo = StyleSheet.flatten(getByText(/^Notificações/).props.style);
    expect(titulo.minWidth).toBe(0);
    expect(titulo.flex).toBe(1);
    expect(StyleSheet.flatten(getByRole('button', { name: 'Marcar todas como lidas' }).props.style).flexShrink).toBe(1);
  });
});
