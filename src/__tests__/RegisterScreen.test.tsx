import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';

jest.mock('expo-router', () => ({
  useRouter:            () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ token: 'mock-invite-token-123', clinicaId: '1' }),
}));
jest.mock('../services/auth.service', () => ({
  login:    jest.fn(),
  register: jest.fn(),
}));
jest.mock('../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({
    setSession:       jest.fn(),
    themeOverride:    null,
    setThemeOverride: jest.fn(),
  }),
}));

import RegisterScreen from '../app/register';
import { register } from '../services/auth.service';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('RegisterScreen', () => {
  it('renders invite banner when token present', () => {
    const { getByText } = render(<RegisterScreen />, { wrapper: W });
    expect(getByText(/Convidado pela clínica/)).toBeTruthy();
  });

  it('shows validation error when passwords do not match', async () => {
    const { getByLabelText, getByText, findByText } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.changeText(getByLabelText('Seu nome'),        'Guilherme Sola');
    fireEvent.changeText(getByLabelText('E-mail'),          'gui@kura.com');
    fireEvent.changeText(getByLabelText('Telefone'),        '11999990001');
    fireEvent.changeText(getByLabelText('Senha'),           'senha123');
    fireEvent.changeText(getByLabelText('Confirmar senha'), 'senha456');
    fireEvent.press(getByText('Criar conta'));
    expect(await findByText('As senhas não coincidem')).toBeTruthy();
  });

  it('calls register service on valid submit', async () => {
    (register as jest.Mock).mockResolvedValueOnce({
      idTutor: 42,
      accessToken: 'tok',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    const { getByLabelText, getByText } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.changeText(getByLabelText('Seu nome'),        'Guilherme Sola');
    fireEvent.changeText(getByLabelText('E-mail'),          'gui@kura.com');
    fireEvent.changeText(getByLabelText('Telefone'),        '11999990001');
    fireEvent.changeText(getByLabelText('Senha'),           'senha1234');
    fireEvent.changeText(getByLabelText('Confirmar senha'), 'senha1234');
    fireEvent.press(getByText('Criar conta'));
    await waitFor(() => expect(register).toHaveBeenCalled());
  });

  it('renders LGPD footer', () => {
    const { getByText } = render(<RegisterScreen />, { wrapper: W });
    expect(getByText(/DADOS CIFRADOS/)).toBeTruthy();
  });
});
