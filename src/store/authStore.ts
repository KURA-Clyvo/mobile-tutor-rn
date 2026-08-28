import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TutorMe } from '../types/api';
import { criarAuthStorage } from './authSecureStorage';

// Instancia unica: `criarAuthStorage()` memoriza a disponibilidade do SecureStore, e
// recriar a cada chamada refaria esse teste em todo acesso ao disco.
const authStorage = criarAuthStorage();

interface AuthState {
  token:         string | null;
  expiresAt:     string | null;
  tutor:         TutorMe | null;
  themeOverride: 'light' | 'dark' | null;
  setSession:      (token: string, expiresAt: string, tutor: TutorMe) => void;
  clearSession:    () => void;
  isAuthenticated: () => boolean;
  setThemeOverride:(override: 'light' | 'dark' | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token:         null,
      expiresAt:     null,
      tutor:         null,
      themeOverride: null,

      setSession: (token, expiresAt, tutor) =>
        set({ token, expiresAt, tutor }),

      clearSession: () =>
        set({ token: null, expiresAt: null, tutor: null }),

      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return new Date(expiresAt).getTime() > Date.now();
      },

      setThemeOverride: (override) =>
        set({ themeOverride: override }),
    }),
    {
      name:    'KURA_TUTOR_AUTH_TOKEN',
      // O JWT nao fica em claro: este storage o desvia para o SecureStore
      // (Keystore/Keychain) e deixa o resto do envelope no AsyncStorage. Ver
      // `authSecureStorage.ts` — inclusive a migracao de quem ja tem o app instalado.
      storage: createJSONStorage(() => authStorage),
      partialize: (s) => ({
        token:         s.token,
        expiresAt:     s.expiresAt,
        tutor:         s.tutor,
        themeOverride: s.themeOverride,
      }),
    }
  )
);
