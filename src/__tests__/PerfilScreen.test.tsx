// TASK-70: o switch de "Notificações push" tinha `value={false}` LITERAL
// (mentia independente da permissão real) e `handleNotifToggle` só pedia
// permissão sem persistir nada — MORDIDA #2, complementar à do
// usePushTokenSync.test.ts (que cobre o boot). Este arquivo prova, executando
// a tela de verdade (sem jest.mock do componente), que:
//   1. o switch reflete a permissão real do dispositivo quando a tela abre;
//   2. tocar o switch registra o token quando a permissão é concedida.
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';

import PerfilScreen from '../app/(tabs)/perfil/index';
import { useAuthStore } from '../store/authStore';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: mockReplace }) }));

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

// TASK-F06: PerfilScreen deixou de chamar Alert.alert e passou a usar
// `useDialog()`. O wrapper monta o KDialogProvider REAL, na mesma ordem da raiz
// (_layout.tsx: Theme > KDialog) — as asserções passam a ler o diálogo
// efetivamente renderizado, não uma chamada espionada.
const W = ({ children }: any) => (
  <ThemeProvider>
    <KDialogProvider>{children}</KDialogProvider>
  </ThemeProvider>
);

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

    const { getByLabelText, getByTestId } = render(<PerfilScreen />, { wrapper: W });
    await waitFor(() => expect(mockGetPermissionStatus).toHaveBeenCalledTimes(1));

    fireEvent(getByLabelText('Ativar notificações'), 'valueChange', true);

    await waitFor(() => expect(mockRequestPermission).toHaveBeenCalled());
    expect(mockGetDeviceToken).not.toHaveBeenCalled();
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled();
    // Antes: toHaveBeenCalledWith('Permissão negada', expect.any(String)) — o
    // corpo era qualquer string. Agora o título exato é lido do diálogo
    // renderizado e o corpo é conferido pelo TEXTO real, não por tipo.
    await waitFor(() => expect(getByTestId('kdialog-titulo').props.children).toBe('Permissão negada'));
    expect(getByTestId('kdialog-mensagem').props.children)
      .toBe('Ative as notificações nas configurações do dispositivo.');
  });

  it('desligar o switch quando o SO ainda concede a permissão volta o switch pra true (não pode revogar)', async () => {
    mockGetPermissionStatus.mockResolvedValue(true);

    const { getByLabelText, getByTestId } = render(<PerfilScreen />, { wrapper: W });
    await waitFor(() => expect(getByLabelText('Ativar notificações').props.value).toBe(true));

    fireEvent(getByLabelText('Ativar notificações'), 'valueChange', false);

    await waitFor(() => expect(mockGetPermissionStatus).toHaveBeenCalledTimes(2));
    expect(getByLabelText('Ativar notificações').props.value).toBe(true);
    // Antes: expect(alertSpy).toHaveBeenCalled() — só provava "algum alerta
    // apareceu", sem dizer qual. Agora o título e o corpo exatos são asserados
    // sobre o diálogo renderizado.
    await waitFor(() => expect(getByTestId('kdialog-titulo').props.children)
      .toBe('Não é possível desativar por aqui'));
    expect(getByTestId('kdialog-mensagem').props.children)
      .toBe('Para desativar as notificações, acesse as configurações do dispositivo.');
  });
});

// TASK-F06: fluxo DESTRUTIVO — logout limpa cache do React Query, apaga a
// sessão e navega para /login. A migração de Alert.alert para KDialog não pode
// transformar a confirmação em ação direta. Não existia teste desta confirmação
// antes desta task.
describe('PerfilScreen — logout exige confirmação (TASK-F06)', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockGetPermissionStatus.mockResolvedValue(false);
    useAuthStore.setState({
      token: 'jwt-valido',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      tutor: TUTOR,
    });
  });

  it('abre o diálogo e NÃO desloga enquanto o tutor não confirmar', async () => {
    const utils = render(<PerfilScreen />, { wrapper: W });
    fireEvent.press(utils.getByText('Sair do app'));

    await waitFor(() => expect(utils.getByTestId('kdialog-titulo').props.children).toBe('Sair do app?'));
    expect(mockReplace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBe('jwt-valido');

    fireEvent.press(utils.getByTestId('kdialog-acao-__cancelar__'));
    await waitFor(() => expect(utils.queryByTestId('kdialog-card')).toBeNull());
    expect(mockReplace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBe('jwt-valido');
  });

  it('desloga (limpa sessão e navega) quando o botão destrutivo é tocado', async () => {
    const utils = render(<PerfilScreen />, { wrapper: W });
    fireEvent.press(utils.getByText('Sair do app'));

    const destrutivo = await waitFor(() => utils.getByTestId('kdialog-acao-__confirmar__'));
    expect(destrutivo.props.accessibilityHint).toBe('Ação destrutiva. Não pode ser desfeita.');
    fireEvent.press(destrutivo);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(useAuthStore.getState().token).toBeNull();
  });
});
