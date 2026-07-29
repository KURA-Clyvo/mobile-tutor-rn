import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme }    from '@theme/index';
import { KButton }     from '@components/primitives/KButton';
import { KTextField }  from '@components/primitives/KTextField';
import { KIcon }       from '@components/primitives/KIcon';
import { useAuthStore }  from '../store/authStore';
import { login }         from '../services/auth.service';
import { loginSchema, type LoginFormData } from '../utils/validators';

export default function LoginScreen() {
  const theme   = useTheme();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const setSession = useAuthStore(s => s.setSession);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { dsEmail: '', dsSenha: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await login({ dsEmail: data.dsEmail, dsSenha: data.dsSenha });
      setSession(res.accessToken, res.expiresAt, res.tutor);
      router.replace('/(tabs)/pets');
    } catch (err: any) {
      const msg = err?.status === 401
        ? 'E-mail ou senha incorretos'
        : 'Erro de conexão. Verifique sua internet.';
      Alert.alert('Atenção', msg);
    } finally {
      setLoading(false);
    }
  };

  const c = theme.colors;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.orbTR, { backgroundColor: c.amber, opacity: 0.15 }]} />
      <View style={[styles.orbBL, { backgroundColor: c.primary, opacity: 0.12 }]} />

      <View style={[styles.inner, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.header}>
          <Text style={[styles.logo, { fontFamily: theme.fonts.display, color: c.primary }]}>Kura.</Text>
          <Text style={[styles.kicker, { fontFamily: theme.fonts.bodyMedium, color: c.primary, fontSize: theme.fontSize.sm }]}>
            Bem-vindo(a) de volta
          </Text>
          <Text style={[styles.h1, { fontFamily: theme.fonts.display, color: c.text, fontSize: 38, lineHeight: 44 }]}>
            {'Cada consulta,\ncada vacina,\n'}
            <Text style={{ fontStyle: 'italic', color: c.primary }}>registrada.</Text>
          </Text>
          <Text style={[styles.sub, { fontFamily: theme.fonts.body, color: c.textSoft, fontSize: theme.fontSize.sm }]}>
            Acesse o histórico do seu pet, agende consultas e receba lembretes da clínica.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="dsEmail"
            render={({ field: { onChange, value } }) => (
              <KTextField
                label="E-mail"
                placeholder="tutor@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                error={errors.dsEmail?.message}
                containerStyle={{ marginBottom: 8 }}
              />
            )}
          />
          <Controller
            control={control}
            name="dsSenha"
            render={({ field: { onChange, value } }) => (
              <KTextField
                label="Senha"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.dsSenha?.message}
                containerStyle={{ marginBottom: 4 }}
              />
            )}
          />

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Esqueci minha senha"
            hitSlop={8}
            style={{ alignSelf: 'flex-end', marginBottom: 20, minHeight: 44, justifyContent: 'center' }}
            onPress={() => Alert.alert(
              'Recuperar senha',
              'Entre em contato com a clínica para redefinir sua senha de acesso.',
            )}
          >
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: c.primary }}>
              Esqueci minha senha
            </Text>
          </Pressable>

          <KButton
            variant="primary"
            block
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            iconRight={<KIcon name="arrowR" size={16} color={c.textOnPrimary} style={{ marginLeft: 6 }} />}
          >
            Entrar
          </KButton>

          <View style={styles.divider}>
            <View style={[styles.divLine, { backgroundColor: c.border }]} />
            <Text style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color: c.textMute, paddingHorizontal: 12 }}>ou</Text>
            <View style={[styles.divLine, { backgroundColor: c.border }]} />
          </View>

          <KButton
            variant="secondary"
            block
            onPress={() => router.push('/register')}
          >
            Criar conta
          </KButton>
        </View>

        <View style={styles.footer}>
          <Text style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color: c.textMute, letterSpacing: 1.2 }}>
            LGPD · AES-256
          </Text>
          <Text style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color: c.textMute, letterSpacing: 1.2 }}>
            Clyvo Vet
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  inner:  { flex: 1, paddingHorizontal: 32, paddingTop: 64, paddingBottom: 32, justifyContent: 'space-between' },
  header: { gap: 12 },
  logo:   { fontSize: 36, lineHeight: 40 },
  kicker: { letterSpacing: 0.2 },
  h1:     { fontWeight: '500' },
  sub:    { maxWidth: 280, lineHeight: 20 },
  form:   { gap: 0 },
  divider:{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divLine:{ flex: 1, height: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  orbTR:  { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: -60, right: -60 },
  orbBL:  { position: 'absolute', width: 180, height: 180, borderRadius: 90,  bottom: 40, left: -60 },
});
