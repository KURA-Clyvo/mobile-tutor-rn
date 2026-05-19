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

function attachInterceptors(client: typeof apiClient) {
  client.interceptors.request.use(async (config) => {
    if (process.env.EXPO_PUBLIC_USE_MOCKS === 'true') {
      return Promise.reject({ __mock: true, config });
    }
    const token = await AsyncStorage.getItem('KURA_TUTOR_AUTH_TOKEN');
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
