// TASK-70: o switch de "Notificações push" tinha `value={false}` LITERAL
// (mentia independente da permissão real) e `handleNotifToggle` só pedia
// permissão sem persistir nada — MORDIDA #2, complementar à do
// usePushTokenSync.test.ts (que cobre o boot). Este arquivo prova, executando
// a tela de verdade (sem jest.mock do componente), que:
//   1. o switch reflete a permissão real do dispositivo quando a tela abre;
//   2. tocar o switch registra o token quando a permissão é concedida.
import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';

import PerfilScreen from '../app/(tabs)/perfil/index';
import { useAuthStore } from '../store/authStore';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

const mockGetPermissionStatus = jest.fn();
const mockRequestPermission   = jest.fn();
const mockGetDeviceToken      = jest.fn();
const mockRegisterDeviceToken = jest.fn();

jest.mock('../services/notifications.service', () => ({
  getPermissionStatus:  (...args: unknown[]) => mockGetPermissionStatus(...args),
  requestPermission:    (...args: unknown[]) => mockRequestPermission(...args),
  getDeviceToken:       (...args: unknown[]) => mockGetDeviceToken(...args),
  registerDeviceToken:  (...args: unknown[]) => mockRegisterDeviceToken(...args),
}));

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

const TUTOR = { id: 1, nmTutor: 'Rex Tutor', dsEmail: 'a@b.com', dsTelefone: '11999999999', dtCadastro: '' };

describe('PerfilScreen — notificações push (TASK-70)', () => {
  beforeEach(() => {
    mockGetPermissionStatus.mockReset();
    mockRequestPermission.mockReset();
    mockGetDeviceToken.mockReset();
    mockRegisterDeviceToken.mockReset();
    useAuthStore.setState({
      token: 'jwt-valido',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      tutor: TUTOR,
    });
  });

  it('reflete permissão CONCEDIDA quando a tela abre (não value={false} fixo)', async () => {
    mockGetPermissionStatus.mockResolvedValue(true);
    const { getByLabelText } = render(<PerfilScreen />, { wrapper: W });

    await waitFor(() => expect(getByLabelText('Ativar notificações').props.value).toBe(true));
  });

  it('reflete permissão NEGADA quando a tela abre', async () => {
    mockGetPermissionStatus.mockResolvedValue(false);
    const { getByLabelText } = render(<PerfilScreen />, { wrapper: W });

    await waitFor(() => expect(mockGetPermissionStatus).toHaveBeenCalled());
    expect(getByLabelText('Ativar notificações').props.value).toBe(false);
  });

  it('MORDIDA: tocar o switch com permissão concedida registra o token no servidor', async () => {
    mockGetPermissionStatus.mockResolvedValue(false);
    mockRequestPermission.mockResolvedValue(true);
    mockGetDeviceToken.mockResolvedValue('ExponentPushToken[abc123]');
    mockRegisterDeviceToken.mockResolvedValue(true);

    const { getByLabelText } = render(<PerfilScreen />, { wrapper: W });
    await waitFor(() => expect(mockGetPermissionStatus).toHaveBeenCalledTimes(1));

    fireEvent(getByLabelText('Ativar notificações'), 'valueChange', true);

    await waitFor(() => expect(mockRegisterDeviceToken).toHaveBeenCalledWith('ExponentPushToken[abc123]'));
    expect(getByLabelText('Ativar notificações').props.value).toBe(true);
  });

  it('tocar o switch com permissão negada não registra token e alerta o tutor', async () => {
    mockGetPermissionStatus.mockResolvedValue(false);
    mockRequestPermission.mockResolvedValue(false);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByLabelText } = render(<PerfilScreen />, { wrapper: W });
    await waitFor(() => expect(mockGetPermissionStatus).toHaveBeenCalledTimes(1));

    fireEvent(getByLabelText('Ativar notificações'), 'valueChange', true);

    await waitFor(() => expect(mockRequestPermission).toHaveBeenCalled());
    expect(mockGetDeviceToken).not.toHaveBeenCalled();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Permissão negada', expect.any(String));
    alertSpy.mockRestore();
  });

  it('desligar o switch quando o SO ainda concede a permissão volta o switch pra true (não pode revogar)', async () => {
    mockGetPermissionStatus.mockResolvedValue(true);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByLabelText } = render(<PerfilScreen />, { wrapper: W });
    await waitFor(() => expect(getByLabelText('Ativar notificações').props.value).toBe(true));

    fireEvent(getByLabelText('Ativar notificações'), 'valueChange', false);

    await waitFor(() => expect(mockGetPermissionStatus).toHaveBeenCalledTimes(2));
    expect(getByLabelText('Ativar notificações').props.value).toBe(true);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
