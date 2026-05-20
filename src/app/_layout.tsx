import { useFonts, Cormorant_500Medium } from '@expo-google-fonts/cormorant';
import { Lexend_400Regular, Lexend_500Medium } from '@expo-google-fonts/lexend';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider } from '../theme/index';
import { queryClient, asyncStoragePersister } from '../services/queryClient';
import { useAuthStore } from '../store/authStore';
import { parseInviteLink } from '../utils/invite';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cormorant_500Medium, Lexend_400Regular, Lexend_500Medium, JetBrainsMono_400Regular });
  const router = useRouter();

  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync(); }, [fontsLoaded]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('auth:logout', () => {
      queryClient.clear();
      useAuthStore.getState().clearSession();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) {
        const parsed = parseInviteLink(url);
        if (parsed) {
          router.push({ pathname: '/register', params: { token: parsed.inviteToken, clinicaId: String(parsed.clinicaId) } } as any);
        }
      }
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      const parsed = parseInviteLink(url);
      if (parsed) {
        router.push({ pathname: '/register', params: { token: parsed.inviteToken, clinicaId: String(parsed.clinicaId) } } as any);
      }
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
