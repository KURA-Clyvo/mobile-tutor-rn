import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TutorMe } from '../types/api';

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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        token:         s.token,
        expiresAt:     s.expiresAt,
        tutor:         s.tutor,
        themeOverride: s.themeOverride,
      }),
    }
  )
);
