import { useFonts, Cormorant_500Medium, Cormorant_500Medium_Italic } from '@expo-google-fonts/cormorant';
import { Lexend_400Regular, Lexend_500Medium } from '@expo-google-fonts/lexend';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider, useTheme } from '@theme/index';
import { KDialogProvider } from '@components/primitives/KDialog';
import { ToastProvider } from '@components/feedback/Toast';
import { Abertura } from '@components/brand/Abertura';
import { queryClient, asyncStoragePersister, dehydrateOptions } from '@services/queryClient';
import { useAuthStore } from '../store/authStore';
import { parseInviteLink } from '../utils/invite';
import { setupHandlers } from '../services/notifications.service';
import { usePushTokenSync } from '../hooks/useNotifications';

SplashScreen.preventAutoHideAsync();

// BR-TUT-T02: no arranque (fontes + sessão ainda não prontas) só a Abertura. A barra de status segue o tema
// (TASK-F07: o app tem claro e escuro, uma barra fixa erraria o contraste num dos dois).
function AberturaDoArranque() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
      <Abertura />
    </>
  );
}

function RootLayoutInner() {
  const router = useRouter();
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = parseInviteLink(url);
      if (parsed) router.push({ pathname: '/register', params: { token: parsed.inviteToken, clinicaId: String(parsed.clinicaId) } } as any);
    };
    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('auth:logout', () => {
      queryClient.clear();
      useAuthStore.getState().clearSession();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const cleanup = setupHandlers(queryClient, router as any);
    return cleanup;
  }, [router]);

  // TASK-70: registra o push token no servidor quando há sessão de tutor
  // autenticada e a permissão do dispositivo já está concedida.
  usePushTokenSync();

  void isAuthenticated;

  return (
    <>
      {/* TASK-F07: expo-status-bar era dependência instalada e nunca importada
          (grep confirmou). Estilo derivado do tema — o app tem claro e escuro,
          então uma barra fixa erraria o contraste num dos dois. `translucent`
          acompanha o edge-to-edge que o SDK 54 já impõe por padrão no Android
          (medido: sem ele as 4 telas de aba já ficavam sob a status bar). */}
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Cormorant_500Medium, Cormorant_500Medium_Italic, Lexend_400Regular, Lexend_500Medium, JetBrainsMono_400Regular });
  const [storeHydrated, setStoreHydrated] = useState(false);
  // Falha ao carregar fonte não pode prender o arranque: com erro, segue com a fonte do sistema.
  const appReady = (fontsLoaded || !!fontError) && storeHydrated;

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setStoreHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setStoreHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          {/* A abertura (símbolo + 3 patas, <= 600 ms, sem texto) cobre fontes e sessão; sai assim que
              `appReady`, sem esperar a animação. O 1º quadro é idêntico ao splash nativo. */}
          <AberturaDoArranque />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister, dehydrateOptions }}>
        <ThemeProvider>
          {/* TASK-F06: KDialogProvider vive DENTRO do ThemeProvider porque o
              KDialog lê `useTheme()`; e envolve o RootLayoutInner para que
              qualquer tela do Stack alcance `useDialog()`. Sem este ponto de
              montagem, toda tela migrada lançaria "useDialog precisa estar
              dentro de <KDialogProvider>". */}
          <KDialogProvider>
            <ToastProvider>
              <RootLayoutInner />
            </ToastProvider>
          </KDialogProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
