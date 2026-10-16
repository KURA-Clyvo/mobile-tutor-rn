import React from 'react';
import { AxiosError } from 'axios';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { ToastProvider } from '../components/feedback/Toast';
import { normalizeError } from '../services/api/errors';

import LoginScreen from '../app/login';
import { login } from '../services/auth.service';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  Redirect:  (_props: any) => null,
}));
jest.mock('../services/auth.service', () => ({
  login:    jest.fn(),
  register: jest.fn(),
}));
jest.mock('../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({
    setSession:       jest.fn(),
    isAuthenticated:  () => false,
    themeOverride:    null,
    setThemeOverride: jest.fn(),
  }),
}));

// TASK-F06: a tela usa `useDialog()` (KDialog substituiu Alert.alert), que
// exige o KDialogProvider na árvore — mesma ordem da raiz (_layout.tsx:
// ThemeProvider > KDialogProvider).
const W = ({ children }: any) => (
  <ThemeProvider>
    <KDialogProvider><ToastProvider>{children}</ToastProvider></KDialogProvider>
  </ThemeProvider>
);

describe('LoginScreen', () => {
  it('renders email and password fields', () => {
    const { getByLabelText } = render(<LoginScreen />, { wrapper: W });
    expect(getByLabelText('E-mail')).toBeTruthy();
    expect(getByLabelText('Senha')).toBeTruthy();
  });

  it('shows Zod validation error for empty email', async () => {
    const { getByRole, findByText } = render(<LoginScreen />, { wrapper: W });
    fireEvent.press(getByRole('button', { name: /entrar/i }));
    expect(await findByText('E-mail inválido')).toBeTruthy();
  });

  it('calls login service with correct payload', async () => {
    (login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'tok',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      tutor: { id: 1, nmTutor: 'Gui', dsEmail: 'g@k.com', dsTelefone: '11999', dtCadastro: '' },
    });
    const { getByLabelText, getByRole } = render(<LoginScreen />, { wrapper: W });
    fireEvent.changeText(getByLabelText('E-mail'), 'gui@kura.com');
    fireEvent.changeText(getByLabelText('Senha'), 'senha123');
    fireEvent.press(getByRole('button', { name: /entrar/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith({ dsEmail: 'gui@kura.com', dsSenha: 'senha123' }));
  });

  it('renders Criar conta button', () => {
    const { getByText } = render(<LoginScreen />, { wrapper: W });
    expect(getByText('Criar conta')).toBeTruthy();
  });

  // BR-TUT-T02: o texto "Kura." foi substituído pelo símbolo KuraMark (lido como imagem "KURA").
  it('mostra o símbolo KURA e não o texto "Kura."', () => {
    const { getByRole, queryByText } = render(<LoginScreen />, { wrapper: W });
    expect(getByRole('image', { name: 'KURA' })).toBeTruthy();
    expect(queryByText('Kura.')).toBeNull();
  });

  // BR-TUT-T05: o erro de login não culpa a internet sem saber.
  describe('erro de login', () => {
    const entrar = async (rejeitar: unknown) => {
      (login as jest.Mock).mockRejectedValueOnce(rejeitar);
      const u = render(<LoginScreen />, { wrapper: W });
      fireEvent.changeText(u.getByLabelText('E-mail'), 'gui@kura.com');
      fireEvent.changeText(u.getByLabelText('Senha'), 'senha123');
      fireEvent.press(u.getByRole('button', { name: /entrar/i }));
      return u;
    };

    it('401 => credenciais incorretas', async () => {
      const u = await entrar({ status: 401, code: 'X', message: 'x' });
      expect(await u.findByText('E-mail ou senha incorretos', { timeout: 5000 })).toBeTruthy();
    });

    it('rede comprovada (axios sem resposta) => "Sem conexão"', async () => {
      const u = await entrar(normalizeError(new AxiosError('Network Error', 'ERR_NETWORK', undefined, {})));
      expect(await u.findByText(/Sem conexão/, { timeout: 5000 })).toBeTruthy();
    });

    it('500 do servidor e Error de código NÃO falam em internet', async () => {
      const u = await entrar({ status: 500, code: 'UNKNOWN_ERROR', message: 'x' });
      expect(await u.findByText(/Não foi possível entrar agora/, { timeout: 5000 })).toBeTruthy();
      expect(u.queryByText(/conexão|internet/i)).toBeNull();
    });

    it('normalizeError: Error comum não vira NETWORK_ERROR', () => {
      expect(normalizeError(new TypeError('boom')).code).toBe('UNKNOWN_ERROR');
      expect(normalizeError(new AxiosError('Network Error', 'ERR_NETWORK', undefined, {})).code).toBe('NETWORK_ERROR');
    });
  });
});
