import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useToggleTheme } from '@theme/index';
import { KIcon }   from '@components/primitives/KIcon';
import { KButton } from '@components/primitives/KButton';
import { KCard }   from '@components/primitives/KCard';
import { useDialog } from '@components/primitives/KDialog';
import { useAuthStore } from '../../../store/authStore';
import { queryClient  } from '../../../services/queryClient';
import {
  getPermissionStatus,
  requestPermission,
  getDeviceToken,
  registerDeviceToken,
} from '../../../services/notifications.service';

export default function PerfilScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const insets       = useSafeAreaInsets();
  const toggleTheme  = useToggleTheme();
  const isDark       = useTheme().isDark;
  const router       = useRouter();
  const tutor        = useAuthStore(s => s.tutor);
  const clearSession = useAuthStore(s => s.clearSession);
  const { alerta, confirmar } = useDialog();
  const [aboutVisible, setAboutVisible] = useState(false);
  // TASK-70: fonte da verdade é a permissão real do SO, consultada sem popup
  // (getPermissionStatus) quando a tela abre — não um `false` fixo nem uma
  // preferência local independente do que o dispositivo de fato concedeu.
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    getPermissionStatus().then(granted => { if (mounted) setNotifEnabled(granted); });
    return () => { mounted = false; };
  }, []);

  const initials = (() => {
    if (!tutor?.nmTutor) return '?';
    const parts = tutor.nmTutor.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0]![0]!.toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  })();

  // TASK-F06: era um Alert nativo. A confirmação continua obrigatória — o
  // logout (limpar cache + sessão + navegar) só roda com `confirmado === true`.
  const handleLogout = async () => {
    const confirmado = await confirmar({
      titulo:     'Sair do app?',
      mensagem:   'Você será redirecionado para a tela de login.',
      cancelar:   'Cancelar',
      confirmar:  'Sair',
      destrutivo: true,
    });
    if (!confirmado) return;
    queryClient.clear();
    clearSession();
    router.replace('/login');
  };

  const handleNotifToggle = async (next: boolean) => {
    if (!next) {
      // O app não pode revogar a permissão do SO — só o dispositivo pode.
      // Reconsulta o estado real em vez de aceitar `false` do toque: se a
      // permissão continuar concedida, o switch volta a refletir a verdade.
      const stillGranted = await getPermissionStatus();
      setNotifEnabled(stillGranted);
      if (stillGranted) {
        await alerta(
          'Não é possível desativar por aqui',
          'Para desativar as notificações, acesse as configurações do dispositivo.',
        );
      }
      return;
    }

    const granted = await requestPermission();
    setNotifEnabled(granted);
    if (!granted) {
      await alerta('Permissão negada', 'Ative as notificações nas configurações do dispositivo.');
      return;
    }

    // Defesa equivalente à do endpoint: sem tutor autenticado não há JWT, e o
    // servidor devolveria 401 (idTutor é derivado do token). Não tenta.
    if (!tutor) return;

    const token = await getDeviceToken();
    if (token) await registerDeviceToken(token);
  };

  return (
    <>
      <ScrollView style={[styles.flex, { backgroundColor: colors.bg }]} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarArea}>
          <View style={[styles.avatarWrap, { borderRadius: 40 }]}>
            <LinearGradient
              colors={[colors.amberPale, colors.clayPale]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 40 }]}
            />
            <Text style={{ fontFamily: fonts.display, color: colors.primary, fontSize: 34, zIndex: 1 }}>
              {initials}
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 26 }}>
            {tutor?.nmTutor ?? '—'}
          </Text>
          <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1 }}>
            {tutor?.dsEmail ?? '—'}
          </Text>
        </View>

        {/* Perfil */}
        <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>PERFIL</Text>
        <KCard style={styles.card}>
          {[
            { label: 'Nome',     value: tutor?.nmTutor    ?? '—', icon: 'perfil' as const },
            { label: 'E-mail',   value: tutor?.dsEmail    ?? '—', icon: 'search' as const },
            { label: 'Telefone', value: tutor?.dsTelefone ?? '—', icon: 'bell'   as const },
          ].map(row => (
            <View key={row.label} style={[styles.row, { borderBottomColor: colors.border }]}>
              <KIcon name={row.icon} size={16} color={colors.textMute} />
              <View style={styles.rowInfo}>
                <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10, letterSpacing: 1 }}>{row.label.toUpperCase()}</Text>
                <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: fontSize.sm, marginTop: 2 }}>{row.value}</Text>
              </View>
              <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>Em breve</Text>
            </View>
          ))}
        </KCard>

        {/* Configurações */}
        <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>CONFIGURAÇÕES</Text>
        <KCard style={styles.card}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <KIcon name="saude" size={16} color={colors.textMute} />
            <View style={styles.rowInfo}>
              <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: fontSize.sm }}>Modo escuro</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel="Alternar modo escuro"
            />
          </View>
          <View style={styles.row}>
            <KIcon name="bell" size={16} color={colors.textMute} />
            <View style={styles.rowInfo}>
              <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: fontSize.sm }}>Notificações push</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={handleNotifToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel="Ativar notificações"
            />
          </View>
        </KCard>

        {/* Links */}
        <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>MAIS</Text>
        <KCard style={styles.card}>
          <Pressable
            onPress={() => router.push('/(tabs)/perfil/consentimentos' as any)}
            style={[styles.row, { borderBottomColor: colors.border }]}
            accessibilityRole="button"
          >
            <KIcon name="check" size={16} color={colors.textMute} />
            <View style={styles.rowInfo}>
              <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: fontSize.sm }}>Gerenciar Consentimentos LGPD</Text>
            </View>
            <KIcon name="chevR" size={14} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => setAboutVisible(true)}
            style={styles.row}
            accessibilityRole="button"
          >
            <KIcon name="alert" size={16} color={colors.textMute} />
            <View style={styles.rowInfo}>
              <Text style={{ fontFamily: fonts.body, color: colors.text, fontSize: fontSize.sm }}>Sobre o app</Text>
            </View>
            <KIcon name="chevR" size={14} color={colors.textMute} />
          </Pressable>
        </KCard>

        {/* Logout */}
        <KButton
          variant="danger"
          block
          onPress={() => void handleLogout()}
          style={styles.logoutBtn}
          iconLeft={<KIcon name="close" size={16} color={colors.textOnPrimary} style={{ marginRight: 6 }} />}
        >
          Sair do app
        </KButton>

        <Text style={[styles.footer, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>
          KURA VET · MOBILE TUTOR · FIAP 2026
        </Text>
      </ScrollView>

      {/* About modal */}
      <Modal visible={aboutVisible} transparent animationType="slide" onRequestClose={() => setAboutVisible(false)}>
        <Pressable style={styles.modalBg} onPress={() => setAboutVisible(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 24, marginBottom: 12 }}>Kura.</Text>
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, marginBottom: 8 }}>Versão 1.0.0 — Tutor App</Text>
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm }}>KURA Vet · Clyvo · FIAP Challenge 2026</Text>
            <KButton variant="ghost" block onPress={() => setAboutVisible(false)} style={{ marginTop: 20 }}>Fechar</KButton>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  scroll:      { padding: 20, paddingBottom: 40 },
  avatarArea:  { alignItems: 'center', paddingVertical: 28, gap: 8 },
  avatarWrap:  { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sectionTitle:{ letterSpacing: 1.2, marginTop: 24, marginBottom: 8 },
  card:        { padding: 0, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowInfo:     { flex: 1 },
  logoutBtn:   { marginTop: 32 },
  footer:      { textAlign: 'center', letterSpacing: 1.5, marginTop: 24 },
  modalBg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard:   { margin: 16, borderRadius: 20, padding: 24, borderWidth: 1 },
});
