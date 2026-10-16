import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { ToastProvider } from '../components/feedback/Toast';
import ConsentimentosScreen from '../app/(tabs)/perfil/consentimentos';

// BR-TUT-T05 (F5-M3 + Platform.OS='web'): revogar consentimento é disparado só depois da confirmação, e o
// toast/estado só afirma sucesso DEPOIS que o servidor respondeu; a falha aparece (toast de erro).
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));

let mockRevogar: jest.Mock;
let mockAssinar: jest.Mock;
jest.mock('../hooks/useConsentimentos', () => ({
  useConsentimentos: () => ({
    data: [
      { idConsentimento: 1, tipo: 'LEMBRETES', versaoTermo: 'v1.0', aceito: true, ativo: true, dtAceite: '2026-01-01T00:00:00Z', dtRevogacao: null },
    ],
    isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle',
  }),
  useAssinar: () => ({ mutateAsync: (...a: unknown[]) => mockAssinar(...a), isPending: false }),
  useRevogar: () => ({ mutateAsync: (...a: unknown[]) => mockRevogar(...a), isPending: false }),
}));

const W = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>
    <ThemeProvider><KDialogProvider><ToastProvider>{children}</ToastProvider></KDialogProvider></ThemeProvider>
  </QueryClientProvider>
);

const LABEL_LEMBRETES = /Consentimento Lembretes/;

async function pedirRevogacao(utils: ReturnType<typeof render>) {
  fireEvent(utils.getByLabelText(LABEL_LEMBRETES), 'valueChange', false);
  await utils.findByText('Revogar consentimento?');
}

describe('Revogar consentimento (web)', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web');
    mockRevogar = jest.fn(() => Promise.resolve());
    mockAssinar = jest.fn(() => Promise.resolve());
  });
  afterEach(() => jest.restoreAllMocks());

  it('o diálogo diz a consequência, o botão leva o verbo e cancelar NÃO chama o servidor', async () => {
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    await pedirRevogacao(u);
    expect(u.getByText(/deixa de receber/i)).toBeTruthy();
    expect(u.getByText('Revogar consentimento')).toBeTruthy();
    fireEvent.press(u.getByTestId('kdialog-acao-__cancelar__'));
    await act(async () => {});
    expect(mockRevogar).not.toHaveBeenCalled();
    expect(u.queryByTestId('toast')).toBeNull();
  });

  it('só anuncia sucesso depois que o servidor respondeu', async () => {
    let resolver!: () => void;
    mockRevogar = jest.fn(() => new Promise<void>((r) => { resolver = r; }));
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    await pedirRevogacao(u);
    fireEvent.press(u.getByTestId('kdialog-acao-__confirmar__'));
    await waitFor(() => expect(mockRevogar).toHaveBeenCalledTimes(1));
    expect(u.queryByText('Consentimento revogado')).toBeNull(); // ainda sem resposta
    await act(async () => { resolver(); });
    expect(await u.findByText('Consentimento revogado')).toBeTruthy();
  });

  it('falha do servidor aparece como toast de erro e NUNCA como sucesso', async () => {
    mockRevogar = jest.fn(() => Promise.reject(new Error('500')));
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    await pedirRevogacao(u);
    fireEvent.press(u.getByTestId('kdialog-acao-__confirmar__'));
    expect(await u.findByText(/Não foi possível revogar/)).toBeTruthy();
    expect(u.queryByText('Consentimento revogado')).toBeNull();
  });

  it('registrar um consentimento mostra o toast com o verbo', async () => {
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    fireEvent.press(u.getAllByText('VER TEXTO COMPLETO →')[0]!);
    fireEvent.press(await u.findByText('Aceitar'));
    expect(await u.findByText('Consentimento registrado')).toBeTruthy();
  });
});
