jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn(() => Promise.resolve(null)),
  setItem:    jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import { useAuthStore } from '../store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, expiresAt: null, tutor: null, themeOverride: null });
  });

  it('isAuthenticated is false when no token', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('isAuthenticated is false when token expired', () => {
    useAuthStore.getState().setSession(
      'tok',
      new Date(Date.now() - 1000).toISOString(),
      { id: 1, nmTutor: 'Gui', dsEmail: 'g@k.com', dsTelefone: '11999', dtCadastro: '' }
    );
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('isAuthenticated is true for valid session', () => {
    useAuthStore.getState().setSession(
      'tok',
      new Date(Date.now() + 3_600_000).toISOString(),
      { id: 1, nmTutor: 'Gui', dsEmail: 'g@k.com', dsTelefone: '11999', dtCadastro: '' }
    );
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('clearSession resets all fields to null', () => {
    useAuthStore.getState().setSession('tok', new Date(Date.now() + 3600_000).toISOString(), { id: 1, nmTutor: 'X', dsEmail: 'x@x.com', dsTelefone: '', dtCadastro: '' });
    useAuthStore.getState().clearSession();
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.tutor).toBeNull();
    expect(s.expiresAt).toBeNull();
  });

  it('setThemeOverride persists override', () => {
    useAuthStore.getState().setThemeOverride('dark');
    expect(useAuthStore.getState().themeOverride).toBe('dark');
  });
});
