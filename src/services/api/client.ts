import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { resolveMock } from './mock-adapter';
import { normalizeError } from './errors';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

export const lunaClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_LUNA_BASE_URL,
  timeout: 20_000, // Luna AI is slower
  headers: { 'Content-Type': 'application/json' },
});

// A chave KURA_TUTOR_AUTH_TOKEN é a do `persist` do zustand (store/authStore.ts): o
// valor é o JSON `{"state":{"token":...,"expiresAt":...},"version":0}`, não o token.
// Até aqui esse JSON inteiro ia como Bearer, e toda chamada autenticada levava 401 fora
// do modo mock (que nunca passa por aqui).
export function extrairToken(persistido: string | null): string | null {
  if (!persistido) return null;
  try {
    const dados = JSON.parse(persistido) as { state?: { token?: string | null } };
    return dados?.state?.token ?? null;
  } catch {
    return persistido; // valor cru (token puro), por compatibilidade
  }
}

function attachInterceptors(client: typeof apiClient) {
  client.interceptors.request.use(async (config) => {
    if (process.env.EXPO_PUBLIC_USE_MOCKS === 'true') {
      return Promise.reject({ __mock: true, config });
    }
    const token = extrairToken(await AsyncStorage.getItem('KURA_TUTOR_AUTH_TOKEN'));
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    r => r,
    async (error) => {
      if (error?.__mock) return resolveMock(error.config);
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('KURA_TUTOR_AUTH_TOKEN');
        DeviceEventEmitter.emit('auth:logout');
      }
      return Promise.reject(normalizeError(error));
    }
  );
}

attachInterceptors(apiClient);
attachInterceptors(lunaClient);
