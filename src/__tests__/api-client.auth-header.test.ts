// Cobertura do header `Authorization` — inexistente até aqui (nenhum teste do repo
// mencionava "Authorization" ou "Bearer" fora de fixtures de mock).
//
// Por que este teste usa um AsyncStorage EM MEMÓRIA em vez do mock global de
// `jest.setup.js` (cujo `getItem` devolve `null` fixo): o bug que ele trava é uma
// COLISÃO DE CHAVE entre quem escreve (o `persist` do Zustand em `store/authStore.ts`)
// e quem lê (o interceptor de request em `services/api/client.ts`). Com um `getItem`
// que ignora o que foi escrito, os dois lados nunca se encontram e a colisão fica
// invisível — que é exatamente por que o bug sobreviveu.
//
// E por que ele exercita o interceptor REAL (trocando só o `adapter` do axios, a
// camada de transporte) em vez de espionar `apiClient.get`: o header é montado DENTRO
// do interceptor. Mockar o client pula justamente o código sob teste.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api/client';
import { useAuthStore } from '../store/authStore';

const JWT = 'eyJhbGciOiJIUzI1NiJ9.payload.assinatura';

describe('apiClient — header Authorization', () => {
  const useMocksOriginal = process.env.EXPO_PUBLIC_USE_MOCKS;
  let armazem: Map<string, string>;
  let configEnviada: any;

  beforeEach(async () => {
    // Mocks DESLIGADOS: com `true`, o interceptor de request rejeita antes de ler o
    // token, e todo este caminho fica sem execução (a razão de o bug nunca ter aparecido).
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';

    armazem = new Map();
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (k: string, v: string) => { armazem.set(k, v); });
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k: string) => armazem.get(k) ?? null);
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (k: string) => { armazem.delete(k); });

    configEnviada = undefined;
    apiClient.defaults.adapter = async (config) => {
      configEnviada = config;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };

    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = useMocksOriginal;
    apiClient.defaults.adapter = undefined;
  });

  it('envia o JWT cru quando há sessão autenticada', async () => {
    useAuthStore.getState().setSession(JWT, new Date(Date.now() + 3600_000).toISOString(), { id: 1 } as any);
    await new Promise(r => setTimeout(r, 0)); // deixa o persist do Zustand gravar

    await apiClient.get('/api/v1/tutor/pets');

    expect(configEnviada.headers.Authorization).toBe(`Bearer ${JWT}`);
  });

  it('não envia Authorization quando não há sessão', async () => {
    await apiClient.get('/api/v1/tutor/pets');

    expect(configEnviada.headers.Authorization).toBeUndefined();
  });
});
