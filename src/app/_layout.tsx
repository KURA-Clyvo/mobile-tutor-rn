import { useFonts, Cormorant_500Medium } from '@expo-google-fonts/cormorant';
import { Lexend_400Regular, Lexend_500Medium } from '@expo-google-fonts/lexend';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import * as Linking from 'expo-linking';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider, useTheme } from '@theme/index';
import { queryClient, asyncStoragePersister } from '@services/queryClient';
import { useAuthStore } from '../store/authStore';
import { parseInviteLink } from '../utils/invite';
import { setupHandlers } from '../services/notifications.service';
import { usePushTokenSync } from '../hooks/useNotifications';

SplashScreen.preventAutoHideAsync();

function SplashContent() {
  const { colors, fonts } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 700 }), -1, true);
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.splash, { backgroundColor: colors.bg }]}>
      <View style={[styles.orbTR, { backgroundColor: colors.amber, opacity: 0.18 }]} />
      <View style={[styles.orbBL, { backgroundColor: colors.primary, opacity: 0.18 }]} />
      <View style={styles.logoArea}>
        <Text style={{ fontFamily: fonts.display, color: colors.primary, fontSize: 76, lineHeight: 80 }}>
          {'Kura'}
          <Text style={{ color: colors.amber }}>.</Text>
        </Text>
        <Text style={{ fontFamily: fonts.display, fontStyle: 'italic', color: colors.textSoft, fontSize: 22, lineHeight: 28 }}>
          O cuidado registrado.
        </Text>
      </View>
      <View style={styles.footer}>
        <Animated.View style={[styles.pulseDot, { backgroundColor: colors.primary }, dotStyle]} />
        <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10, letterSpacing: 1.5, marginTop: 12 }}>
          CLYVO VET · V1.0
        </Text>
      </View>
    </View>
  );
}

function RootLayoutInner() {
  const router = useRouter();
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

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cormorant_500Medium, Lexend_400Regular, Lexend_500Medium, JetBrainsMono_400Regular });
  const [storeHydrated, setStoreHydrated] = useState(false);
  const appReady = fontsLoaded && storeHydrated;

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
          <SplashContent />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
        <ThemeProvider>
          <RootLayoutInner />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash:   { flex: 1, justifyContent: 'space-between', paddingHorizontal: 40, paddingTop: 120, paddingBottom: 60 },
  logoArea: { gap: 12 },
  footer:   { alignItems: 'center' },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  orbTR:    { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -80, right: -80 },
  orbBL:    { position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: 40, left: -80 },
});
