import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, radius, fontSize, fonts, type Theme } from './tokens';
import { useAuthStore } from '../store/authStore';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const themeOverride    = useAuthStore(s => s.themeOverride);
  const setThemeOverride = useAuthStore(s => s.setThemeOverride);

  const isDark = (themeOverride ?? system) === 'dark';
  const theme: Theme = { colors: isDark ? darkColors : lightColors, spacing, radius, fontSize, fonts, isDark };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme: () => setThemeOverride(isDark ? 'light' : 'dark'),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx.theme;
}

export function useToggleTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useToggleTheme must be inside ThemeProvider');
  return ctx.toggleTheme;
}
