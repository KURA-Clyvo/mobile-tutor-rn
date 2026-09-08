import { useFonts, Cormorant_500Medium } from '@expo-google-fonts/cormorant';
import { Lexend_400Regular, Lexend_500Medium } from '@expo-google-fonts/lexend';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import * as Linking from 'expo-linking';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider, useTheme } from '@theme/index';
import { KDialogProvider } from '@components/primitives/KDialog';
import { queryClient, asyncStoragePersister } from '@services/queryClient';
import { useAuthStore } from '../store/authStore';
import { parseInviteLink } from '../utils/invite';
import { setupHandlers } from '../services/notifications.service';
import { usePushTokenSync } from '../hooks/useNotifications';

// `.catch` obrigatorio: sem ele isto e uma promise flutuante — se o splash nao puder
// ser segurado (o caso normal e o modulo ja ter escondido antes desta linha rodar), o
// erro vira unhandled rejection em vez de um aviso. Nao ha o que fazer alem de anotar:
// o app segue funcionando, so sem o splash controlado.
SplashScreen.preventAutoHideAsync().catch(() => {
  console.warn('[Splash] preventAutoHideAsync falhou — splash pode piscar no boot.');
});

function SplashContent() {
  const { colors, fonts, isDark } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 700 }), -1, true);
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.splash, { backgroundColor: colors.bg }]}>
      {/* TASK-F07: expo-status-bar era dependência instalada e nunca importada;
          estilo segue o tema (claro/escuro) em vez de fixo, porque o app tem os
          dois — barra fixa erraria contraste num deles. */}
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
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
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logado = isAuthenticated();

  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = parseInviteLink(url);
      if (parsed) router.push({ pathname: '/register', params: { token: parsed.inviteToken, clinicaId: String(parsed.clinicaId) } });
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
    const cleanup = setupHandlers(queryClient, router);
    return cleanup;
  }, [router]);

  // TASK-70: registra o push token no servidor quando há sessão de tutor
  // autenticada e a permissão do dispositivo já está concedida.
  usePushTokenSync();

  return (
    <>
      {/* TASK-F07: expo-status-bar era dependência instalada e nunca importada
          (grep confirmou). Estilo derivado do tema — o app tem claro e escuro,
          então uma barra fixa erraria o contraste num dos dois. `translucent`
          acompanha o edge-to-edge que o SDK 54 já impõe por padrão no Android
          (medido: sem ele as 4 telas de aba já ficavam sob a status bar). */}
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
      {/* T-1: as telas internas nao tinham guarda nenhuma — `(tabs)/_layout.tsx`
          era so <Tabs> com 4 <Tabs.Screen>, e o unico redirecionamento vivia em
          `index.tsx`, que e a rota de ENTRADA. Um deep link direto para
          /(tabs)/pets entrava sem sessao.

          `Stack.Protected` (expo-router 6, `views/Protected.d.ts`) tira as telas
          da arvore de rotas quando o guard e falso — elas deixam de existir para
          o roteador, em vez de existirem e redirecionarem. Efeito colateral que
          vale mais que a guarda em si: o router tambem DESCARTA as entradas de
          historico dessas telas, entao "voltar depois do logout" para de
          funcionar de graca.

          `register` fica no grupo publico DE PROPOSITO: ele e alcancado por deep
          link de convite, com o tutor ainda sem sessao (ver o `parseInviteLink`
          logo acima). No grupo protegido, o onboarding inteiro quebraria.

          ⚠️ Isto e controle de acesso na NAVEGACAO, nao seguranca — quem protege
          o dado e o JWT exigido pelo backend. */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={logado}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notificacoes" />
        </Stack.Protected>

        <Stack.Protected guard={!logado}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
      </Stack>
    </>
  );
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
          {/* TASK-F06: KDialogProvider vive DENTRO do ThemeProvider porque o
              KDialog lê `useTheme()`; e envolve o RootLayoutInner para que
              qualquer tela do Stack alcance `useDialog()`. Sem este ponto de
              montagem, toda tela migrada lançaria "useDialog precisa estar
              dentro de <KDialogProvider>". */}
          <KDialogProvider>
            <RootLayoutInner />
          </KDialogProvider>
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
