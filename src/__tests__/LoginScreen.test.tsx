import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';

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
// T-4: a tela passou a usar `useLogin()`/`useRegistrar()` (useMutation), então a
// árvore precisa de um QueryClientProvider — na MESMA ordem da raiz (_layout.tsx:
// PersistQueryClientProvider > ThemeProvider > KDialogProvider). `retry: 0` no
// client evita que um teste de erro espere backoff.
const W = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } } })}>
    <ThemeProvider>
      <KDialogProvider>{children}</KDialogProvider>
    </ThemeProvider>
  </QueryClientProvider>
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
});
