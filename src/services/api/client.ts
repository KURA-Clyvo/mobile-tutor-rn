import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import { resolveMock } from './mock-adapter';
import { normalizeError } from './errors';
import { useAuthStore } from '../../store/authStore';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

function attachInterceptors(client: typeof apiClient) {
  client.interceptors.request.use(async (config) => {
    if (process.env.EXPO_PUBLIC_USE_MOCKS === 'true') {
      return Promise.reject({ __mock: true, config });
    }
    // O token sai do store — NUNCA de uma leitura crua do AsyncStorage. A versão
    // anterior fazia `AsyncStorage.getItem('KURA_TUTOR_AUTH_TOKEN')`, a MESMA chave que
    // o `persist` do Zustand usa como `name` em `store/authStore.ts`. O que está gravado
    // ali não é o JWT: é o envelope do store inteiro (`{"state":{"token":...},"version":0}`),
    // então todo request autenticado saía com `Bearer {"state":...}` — e, como o envelope
    // existe mesmo deslogado, o header saía até sem sessão. `EXPO_PUBLIC_USE_MOCKS=true`
    // (o default do `.env`) rejeita ACIMA desta linha, então nada no projeto jamais
    // executou este caminho — por isso a colisão sobreviveu sem sintoma visível.
    //
    // Ler do store também elimina o `await` que existia aqui só por causa do AsyncStorage.
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    r => r,
    async (error) => {
      if (error?.__mock) return resolveMock(error.config);
      if (error?.response?.status === 401) {
        // `clearSession()` em vez do antigo `AsyncStorage.removeItem('KURA_TUTOR_AUTH_TOKEN')`,
        // que era a mesma colisão de chave do interceptor de request acima: aquela chave é o
        // envelope do `persist` INTEIRO, então o removeItem (a) não derrubava a sessão em
        // memória — só o disco, deixando o app "logado" até o próximo boot — e (b) levava
        // junto `themeOverride`, que não tem nada com autenticação. `clearSession()` zera
        // exatamente os 3 campos de sessão e deixa o `persist` regravar o resto.
        useAuthStore.getState().clearSession();
        // O evento continua: é o que faz `app/_layout.tsx` limpar a cache do react-query
        // (dados de OUTRO tutor não podem sobreviver a uma troca de sessão).
        DeviceEventEmitter.emit('auth:logout');
      }
      return Promise.reject(normalizeError(error));
    }
  );
}

attachInterceptors(apiClient);

// `lunaClient` (segundo axios instance, apontando para EXPO_PUBLIC_LUNA_BASE_URL) foi
// removido aqui: era criado, ganhava interceptors e NUNCA era chamado por ninguém — o
// serviço Luna não tem integração neste app (ver "Limitações v1" no README). Se ela
// entrar, o instance volta em 6 linhas; até lá era superfície de config viva sem uso.
// `discover-network-consumers.ts` continua listando 'lunaClient' entre os nomes
// canônicos de rede de propósito: é guarda, e se o cliente voltar já nasce detectado.
