import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('../hooks/useConsentimentos', () => ({
  useConsentimentos: () => ({
    data: [
      { id: 1, dsTipoConsentimento: 'COMUNICACAO_WHATSAPP', sgStatus: 'ATIVO',    dtConsentimento: new Date().toISOString() },
      { id: 2, dsTipoConsentimento: 'DADOS_CLINICOS_IA',    sgStatus: 'REVOGADO', dtConsentimento: new Date().toISOString(), dtRevogacao: new Date().toISOString() },
    ],
  }),
  useAssinar:  () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRevogar:  () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

import ConsentimentosScreen from '../app/(tabs)/perfil/consentimentos';

const W = ({ children }: any) => {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}><ThemeProvider>{children}</ThemeProvider></QueryClientProvider>;
};

describe('ConsentimentosScreen', () => {
  it('renders all 3 consent types', async () => {
    const { getByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Comunicação via WhatsApp')).toBeTruthy());
    expect(getByText('Uso de IA nos dados clínicos')).toBeTruthy();
    expect(getByText('Compartilhamento com laboratórios')).toBeTruthy();
  });

  it('shows Ativo chip for COMUNICACAO_WHATSAPP', async () => {
    const { getAllByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(getAllByText('Ativo').length).toBeGreaterThan(0));
  });

  it('shows Pendente chip for missing consent', async () => {
    const { getByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Pendente')).toBeTruthy());
  });

  it('opens modal with full text on VER TEXTO button', async () => {
    const { getAllByText, getByText } = render(<ConsentimentosScreen />, { wrapper: W });
    const btns = getAllByText('VER TEXTO COMPLETO →');
    fireEvent.press(btns[0]!);
    await waitFor(() => expect(getByText('Aceitar')).toBeTruthy());
  });
});
