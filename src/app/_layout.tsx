import { useFonts, Cormorant_500Medium } from '@expo-google-fonts/cormorant';
import { Lexend_400Regular, Lexend_500Medium } from '@expo-google-fonts/lexend';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider } from '../theme/index';
import { queryClient, asyncStoragePersister } from '../services/queryClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cormorant_500Medium, Lexend_400Regular, Lexend_500Medium, JetBrainsMono_400Regular });

  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync(); }, [fontsLoaded]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('auth:logout', () => {
      queryClient.clear();
      // Auth store clearSession called in authStore listener (Sprint 3)
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
