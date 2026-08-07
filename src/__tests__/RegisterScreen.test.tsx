import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';

import RegisterScreen from '../app/register';
import { register } from '../services/auth.service';

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

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('RegisterScreen', () => {
  beforeEach(() => {
    (register as jest.Mock).mockClear();
  });

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

  it('calls register service on valid submit with aceites marcados', async () => {
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
    fireEvent.press(getByLabelText('Aceito receber lembretes de vacina e consulta (obrigatório)'));
    fireEvent.press(getByLabelText('Autorizo o uso de teleorientação por chamada de vídeo (opcional)'));
    fireEvent.press(getByText('Criar conta'));
    await waitFor(() => expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ aceiteLembretes: true, aceiteTeleorientacao: true })
    ));
  });

  it('bloqueia submit sem chamar a API quando o aceite obrigatório não está marcado', async () => {
    const { getByLabelText, getByText, findByText } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.changeText(getByLabelText('Seu nome'),        'Guilherme Sola');
    fireEvent.changeText(getByLabelText('E-mail'),          'gui@kura.com');
    fireEvent.changeText(getByLabelText('Telefone'),        '11999990001');
    fireEvent.changeText(getByLabelText('Senha'),           'senha1234');
    fireEvent.changeText(getByLabelText('Confirmar senha'), 'senha1234');
    // aceiteLembretes propositalmente não marcado
    fireEvent.press(getByText('Criar conta'));
    expect(await findByText('É necessário aceitar os lembretes de vacina e consulta para continuar')).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it('permite submit válido sem marcar o aceite opcional de teleorientação', async () => {
    (register as jest.Mock).mockResolvedValueOnce({
      idTutor: 43,
      accessToken: 'tok2',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    const { getByLabelText, getByText } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.changeText(getByLabelText('Seu nome'),        'Guilherme Sola');
    fireEvent.changeText(getByLabelText('E-mail'),          'gui@kura.com');
    fireEvent.changeText(getByLabelText('Telefone'),        '11999990001');
    fireEvent.changeText(getByLabelText('Senha'),           'senha1234');
    fireEvent.changeText(getByLabelText('Confirmar senha'), 'senha1234');
    fireEvent.press(getByLabelText('Aceito receber lembretes de vacina e consulta (obrigatório)'));
    fireEvent.press(getByText('Criar conta'));
    await waitFor(() => expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ aceiteLembretes: true, aceiteTeleorientacao: false })
    ));
  });

  it('renders LGPD footer', () => {
    const { getByText } = render(<RegisterScreen />, { wrapper: W });
    expect(getByText(/DADOS CIFRADOS/)).toBeTruthy();
  });
});
