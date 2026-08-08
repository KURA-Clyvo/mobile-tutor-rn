// TASK-70: prova que registerDeviceToken() é chamado no fluxo de PRODUÇÃO —
// não isolado, mas a partir do hook que app/_layout.tsx::RootLayoutInner monta
// em todo boot do app (ver _layout.tsx, `usePushTokenSync()`). Antes desta
// task, NADA no código de produção chamava registerDeviceToken (achado do
// maestro, confirmado por grep) — este teste falha contra esse estado (o hook
// nem existia) e passa depois do fix.
//
// LGPD: os mocks abaixo nunca fazem assert sobre o VALOR do token — só sobre
// o fato de a chamada acontecer (ou não), como o próprio serviço exige.
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { usePushTokenSync } from '../hooks/useNotifications';
import { useAuthStore } from '../store/authStore';

const mockGetPermissionsAsync   = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync:   (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync:  (...args: unknown[]) => mockGetExpoPushTokenAsync(...args),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

const mockPatch = jest.fn((..._args: unknown[]) => Promise.resolve({ status: 204 }));
jest.mock('../services/api/client', () => ({
  apiClient: { patch: (...args: unknown[]) => mockPatch(...args) },
}));

const TUTOR = { id: 1, nmTutor: 'Rex Tutor', dsEmail: 'a@b.com', dsTelefone: '11999999999', dtCadastro: '' };

describe('usePushTokenSync (TASK-70)', () => {
  beforeEach(() => {
    mockGetPermissionsAsync.mockReset();
    mockGetExpoPushTokenAsync.mockReset();
    mockPatch.mockClear();
    useAuthStore.setState({ token: null, expiresAt: null, tutor: null });
  });

  it('MORDIDA: com tutor autenticado e permissão concedida, registra o token no servidor', async () => {
    useAuthStore.setState({
      token: 'jwt-valido',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      tutor: TUTOR,
    });
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc123]' });

    renderHook(() => usePushTokenSync());

    await waitFor(() => expect(mockPatch).toHaveBeenCalledTimes(1));
    expect(mockPatch).toHaveBeenCalledWith(
      '/api/v1/tutor/me/push-token',
      { dsPushToken: 'ExponentPushToken[abc123]', dsPlatforma: expect.any(String) },
    );
  });

  it('sem sessão autenticada, NÃO registra (endpoint deriva idTutor do JWT — devolveria 401)', async () => {
    useAuthStore.setState({ token: null, expiresAt: null, tutor: null });
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc123]' });

    renderHook(() => usePushTokenSync());

    await new Promise(r => setTimeout(r, 50));
    expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('MORDIDA (fix round 1): hook montado SEM sessão, tutor faz login na MESMA sessão do app — registra o token', async () => {
    // Reproduz o achado do revisor: RootLayoutInner (onde este hook é montado)
    // monta uma vez só por sessão do app, sem remontar no login. Antes do fix
    // (1d28aa4), o efeito dependia de `isAuthenticated` (a FUNÇÃO do store,
    // referência estável) em vez de um valor que muda — então esta transição
    // (não-autenticado -> autenticado, sem remontar o hook) nunca disparava o
    // registro. Este teste monta o hook já autenticado=false e só DEPOIS muda
    // o estado do store para uma sessão válida, como um login real faria.
    useAuthStore.setState({ token: null, expiresAt: null, tutor: null });
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc123]' });

    renderHook(() => usePushTokenSync());

    // Confirma que, no estado inicial (sem sessão), nada foi chamado ainda —
    // senão o teste não provaria a REAÇÃO à transição, só um estado fixo.
    await new Promise(r => setTimeout(r, 50));
    expect(mockPatch).not.toHaveBeenCalled();

    // Login na sessão em curso — mesmo efeito que login.tsx::setSession produz,
    // sem desmontar/remontar RootLayoutInner.
    act(() => {
      useAuthStore.setState({
        token: 'jwt-valido',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        tutor: TUTOR,
      });
    });

    await waitFor(() => expect(mockPatch).toHaveBeenCalledTimes(1));
    expect(mockPatch).toHaveBeenCalledWith(
      '/api/v1/tutor/me/push-token',
      { dsPushToken: 'ExponentPushToken[abc123]', dsPlatforma: expect.any(String) },
    );
  });

  it('não registra de novo a cada re-render nem a cada mudança irrelevante do store (só na transição de token)', async () => {
    useAuthStore.setState({
      token: 'jwt-valido',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      tutor: TUTOR,
    });
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc123]' });

    const { rerender } = renderHook(() => usePushTokenSync());
    await waitFor(() => expect(mockPatch).toHaveBeenCalledTimes(1));

    // Mudança de campo NÃO relacionado ao token (equivalente a qualquer outro
    // slice do store mudando) não deve reacionar o registro.
    act(() => { useAuthStore.getState().setThemeOverride('dark'); });
    rerender({});
    await new Promise(r => setTimeout(r, 50));
    expect(mockPatch).toHaveBeenCalledTimes(1);
  });

  it('autenticado mas sem permissão concedida, NÃO registra e não pede permissão (isso é ação do toggle)', async () => {
    useAuthStore.setState({
      token: 'jwt-valido',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      tutor: TUTOR,
    });
    mockGetPermissionsAsync.mockResolvedValue({ status: 'denied' });

    renderHook(() => usePushTokenSync());

    await waitFor(() => expect(mockGetPermissionsAsync).toHaveBeenCalledTimes(1));
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockPatch).not.toHaveBeenCalled();
  });
});
