import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, radius, fontSize, fonts, type Theme } from './tokens';
import { useAuthStore } from '../store/authStore';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const themeOverride    = useAuthStore(s => s.themeOverride);
  const setThemeOverride = useAuthStore(s => s.setThemeOverride);

  const isDark = (themeOverride ?? system) === 'dark';

  // `theme` e o `value` do Provider eram objetos literais NOVOS a cada render. Como este
  // provider fica na raiz do app, qualquer render dele invalidava o contexto e forcava
  // re-render de TODO consumidor de `useTheme()` — que e praticamente cada componente do
  // projeto — mesmo quando nem a cor nem o modo tinham mudado. Só `isDark` altera o tema.
  const theme = useMemo<Theme>(
    () => ({ colors: isDark ? darkColors : lightColors, spacing, radius, fontSize, fonts, isDark }),
    [isDark],
  );
  const value = useMemo(
    () => ({ theme, toggleTheme: () => setThemeOverride(isDark ? 'light' : 'dark') }),
    [theme, isDark, setThemeOverride],
  );

  return (
    <ThemeContext.Provider value={value}>
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
