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
      { idConsentimento: 1, tipo: 'TELEORIENTACAO', versaoTermo: 'v1.0', aceito: true, ativo: true, dtAceite: '2026-01-01T00:00:00Z', dtRevogacao: null },
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

const LABEL_REVOGAR = 'Revogar Teleorientação por vídeo';

async function pedirRevogacao(utils: ReturnType<typeof render>) {
  fireEvent.press(utils.getByLabelText(LABEL_REVOGAR));
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
    expect(u.getByText(/deixa de poder fazer teleorientação/i)).toBeTruthy();
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

  async function abrirAceite(u: ReturnType<typeof render>) {
    fireEvent.press(u.getAllByLabelText(/^Autorizar /)[0]!);
    return u.findByText('Aceitar');
  }

  it('registrar: nenhum toast enquanto o servidor não respondeu; depois "Consentimento registrado"', async () => {
    let resolver!: () => void;
    mockAssinar = jest.fn(() => new Promise<void>((r) => { resolver = r; }));
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    fireEvent.press(await abrirAceite(u));
    await waitFor(() => expect(mockAssinar).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(u.queryByTestId('toast')).toBeNull();
    expect(u.queryByText('Consentimento registrado')).toBeNull();
    await act(async () => { resolver(); });
    expect(u.getByText('Consentimento registrado')).toBeTruthy();
  });

  it('registrar: falha mostra o erro (diálogo) e NUNCA o toast de sucesso', async () => {
    let falhar!: (e: Error) => void;
    mockAssinar = jest.fn(() => new Promise<void>((_, rej) => { falhar = rej; }));
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    fireEvent.press(await abrirAceite(u));
    await waitFor(() => expect(mockAssinar).toHaveBeenCalledTimes(1));
    expect(u.queryByText('Consentimento registrado')).toBeNull();
    await act(async () => { falhar(new Error('500')); });
    expect(await u.findByText(/Não foi possível registrar o consentimento/)).toBeTruthy();
    expect(u.queryByText('Consentimento registrado')).toBeNull();
    expect(u.queryByTestId('toast')).toBeNull();
  });

  it('duplo toque em "Aceitar" chama o serviço 1x', async () => {
    let resolver!: () => void;
    mockAssinar = jest.fn(() => new Promise<void>((r) => { resolver = r; }));
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    const aceitar = await abrirAceite(u);
    // dois toques no MESMO tick, antes de qualquer re-render: só a trava síncrona segura (o `loading` do botão não chegou).
    act(() => { fireEvent.press(aceitar); fireEvent.press(aceitar); });
    await act(async () => {});
    expect(mockAssinar).toHaveBeenCalledTimes(1);
    await act(async () => { resolver(); });
  });

  it('duplo toque no botão de revogar com o 1o pedido em voo: 1 diálogo, 1 chamada ao serviço', async () => {
    let resolver!: () => void;
    mockRevogar = jest.fn(() => new Promise<void>((r) => { resolver = r; }));
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText(LABEL_REVOGAR));
    fireEvent.press(u.getByLabelText(LABEL_REVOGAR));
    await u.findByText('Revogar consentimento?');
    fireEvent.press(u.getByTestId('kdialog-acao-__confirmar__'));
    await waitFor(() => expect(mockRevogar).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(u.queryByText('Revogar consentimento?')).toBeNull(); // nenhum 2o diálogo na fila
    expect(mockRevogar).toHaveBeenCalledTimes(1);
    await act(async () => { resolver(); });
  });
});
