import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme }      from '@theme/index';
import { KButton }       from '@components/primitives/KButton';
import { KTextField }    from '@components/primitives/KTextField';
import { KIcon }         from '@components/primitives/KIcon';
import { useAuthStore }  from '../store/authStore';
import { register }      from '../services/auth.service';
import { registerSchema, type RegisterFormData } from '../utils/validators';

export default function RegisterScreen() {
  const theme    = useTheme();
  const router   = useRouter();
  const setSession = useAuthStore(s => s.setSession);
  const [loading, setLoading] = useState(false);

  const { token: inviteToken, clinicaId } = useLocalSearchParams<{ token?: string; clinicaId?: string }>();
  const hasInvite = !!inviteToken;

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nmTutor: '', dsEmail: '', dsSenha: '', dsSenhaConfirm: '', dsTelefone: '' },
  });

  const maskPhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2)  return `(${digits}`;
    if (digits.length <= 7)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    return v;
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!hasInvite) {
      Alert.alert('Convite necessário', 'O cadastro requer um link de convite da clínica.');
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        inviteToken: inviteToken!,
        nmTutor:     data.nmTutor,
        dsSenha:     data.dsSenha,
        dsTelefone:  data.dsTelefone,
      });
      setSession(res.accessToken, res.expiresAt, {
        id:         res.idTutor,
        nmTutor:    data.nmTutor,
        dsEmail:    data.dsEmail,
        dsTelefone: data.dsTelefone,
        dtCadastro: new Date().toISOString(),
      });
      router.replace('/(tabs)/pets');
    } catch (err: any) {
      const status = err?.status;
      const msg =
        status === 401 ? 'Convite expirado ou já utilizado.' :
        status === 409 ? 'E-mail já cadastrado. Faça login.' :
        'Erro ao criar conta. Tente novamente.';
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
      <View style={[styles.headerRow, { borderBottomColor: c.border, backgroundColor: c.surface }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.circleBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <KIcon name="back" size={18} color={c.text} />
        </Pressable>

        <Text style={[styles.stepLabel, { fontFamily: theme.fonts.mono, color: c.textMute, fontSize: theme.fontSize.xs }]}>
          NOVO · 1 DE 2
        </Text>

        <Pressable onPress={() => router.replace('/login')} accessibilityRole="button">
          <Text style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color: c.primary, letterSpacing: 1 }}>
            CANCELAR
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {hasInvite && (
          <View style={[styles.inviteBanner, { backgroundColor: c.primarySoft, borderColor: c.primary }]}>
            <KIcon name="check" size={16} color={c.primary} />
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: c.primary, flex: 1 }}>
              Convidado pela clínica {clinicaId ? `#${clinicaId}` : ''}
            </Text>
          </View>
        )}

        <View style={styles.titleArea}>
          <Text
            style={[styles.kicker, { fontFamily: theme.fonts.bodyMedium, color: c.primary, fontSize: theme.fontSize.sm }]}
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            Criar conta
          </Text>
          <Text style={{ fontFamily: theme.fonts.display, color: c.text, fontSize: 36, lineHeight: 42 }}>
            {'Vamos '}
            <Text style={{ fontStyle: 'italic', color: c.primary }}>começar.</Text>
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, color: c.textSoft, fontSize: theme.fontSize.sm, marginTop: 4 }}>
            Quanto mais detalhes, mais preciso o cuidado com o seu pet.
          </Text>
        </View>

        <View style={styles.fields}>
          <Controller control={control} name="nmTutor"
            render={({ field: { onChange, value } }) => (
              <KTextField label="Seu nome" placeholder="Nome completo" value={value} onChangeText={onChange} error={errors.nmTutor?.message} containerStyle={styles.field} />
            )}
          />
          <Controller control={control} name="dsEmail"
            render={({ field: { onChange, value } }) => (
              <KTextField label="E-mail" placeholder="tutor@email.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} error={errors.dsEmail?.message} containerStyle={styles.field} />
            )}
          />
          <Controller control={control} name="dsTelefone"
            render={({ field: { onChange, value } }) => (
              <KTextField label="Telefone" placeholder="(11) 99999-0000" keyboardType="phone-pad" value={value} onChangeText={v => onChange(maskPhone(v))} error={errors.dsTelefone?.message} containerStyle={styles.field} />
            )}
          />
          <Controller control={control} name="dsSenha"
            render={({ field: { onChange, value } }) => (
              <KTextField label="Senha" placeholder="Mínimo 8 caracteres" secureTextEntry value={value} onChangeText={onChange} error={errors.dsSenha?.message} containerStyle={styles.field} />
            )}
          />
          <Controller control={control} name="dsSenhaConfirm"
            render={({ field: { onChange, value } }) => (
              <KTextField label="Confirmar senha" placeholder="Repita a senha" secureTextEntry value={value} onChangeText={onChange} error={errors.dsSenhaConfirm?.message} containerStyle={styles.field} />
            )}
          />
        </View>

        <KButton
          variant="primary"
          block
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          iconRight={<KIcon name="arrowR" size={16} color={c.textOnPrimary} style={{ marginLeft: 6 }} />}
          style={{ marginTop: 8 }}
        >
          Criar conta
        </KButton>

        <Text style={[styles.footerMono, { fontFamily: theme.fonts.mono, color: c.textMute, fontSize: theme.fontSize.xs }]}>
          ⌧ DADOS CIFRADOS · LGPD COMPLIANT
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  circleBtn:    { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepLabel:    { letterSpacing: 1.2 },
  scroll:       { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: 0 },
  inviteBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  titleArea:    { marginBottom: 28, gap: 6 },
  kicker:       { letterSpacing: 0.2 },
  fields:       { gap: 0 },
  field:        { marginBottom: 8 },
  footerMono:   { textAlign: 'center', letterSpacing: 1.2, marginTop: 20 },
});
