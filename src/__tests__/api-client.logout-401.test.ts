// Segunda metade da colisão de chave coberta por `api-client.auth-header.test.ts`:
// o handler de 401 fazia `AsyncStorage.removeItem('KURA_TUTOR_AUTH_TOKEN')` — a chave
// do `persist` do Zustand inteiro. Apagar por ali não derruba a sessão em memória
// (só o que está em disco) e leva junto o que NÃO tem nada com autenticação:
// a preferência de tema do tutor.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api/client';
import { useAuthStore } from '../store/authStore';

describe('apiClient — resposta 401', () => {
  const useMocksOriginal = process.env.EXPO_PUBLIC_USE_MOCKS;
  let armazem: Map<string, string>;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
    armazem = new Map();
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (k: string, v: string) => { armazem.set(k, v); });
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k: string) => armazem.get(k) ?? null);
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (k: string) => { armazem.delete(k); });

    apiClient.defaults.adapter = async (config) => {
      const err: any = new Error('Request failed with status code 401');
      err.response = { status: 401, data: {}, headers: {}, config };
      err.config = config;
      throw err;
    };
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = useMocksOriginal;
    apiClient.defaults.adapter = undefined;
  });

  it('derruba a sessão em memória, não só o que está em disco', async () => {
    useAuthStore.getState().setSession('jwt-expirado', new Date(Date.now() + 3600_000).toISOString(), { id: 1 } as any);
    await new Promise(r => setTimeout(r, 0));

    await expect(apiClient.get('/api/v1/tutor/pets')).rejects.toBeDefined();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('preserva a preferência de tema do tutor', async () => {
    useAuthStore.getState().setThemeOverride('dark');
    useAuthStore.getState().setSession('jwt-expirado', new Date(Date.now() + 3600_000).toISOString(), { id: 1 } as any);
    await new Promise(r => setTimeout(r, 0));

    await expect(apiClient.get('/api/v1/tutor/pets')).rejects.toBeDefined();
    await new Promise(r => setTimeout(r, 0));

    expect(useAuthStore.getState().themeOverride).toBe('dark');
    expect(armazem.get('KURA_TUTOR_AUTH_TOKEN')).toContain('"themeOverride":"dark"');
  });
});
