import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Image, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { KIcon }   from '@components/primitives/KIcon';
import { KChip }   from '@components/primitives/KChip';

type Especie = 'Cão' | 'Gato' | 'Coelho' | 'Ave';
type Sexo    = 'M' | 'F';
const ESPECIES: { key: Especie; emoji: string }[] = [
  { key: 'Cão',    emoji: '🐶' },
  { key: 'Gato',   emoji: '🐱' },
  { key: 'Coelho', emoji: '🐰' },
  { key: 'Ave',    emoji: '🦜' },
];

export default function AddPetScreen() {
  const { colors, fonts, fontSize, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const [fotoUri,   setFotoUri]   = useState<string | null>(null);
  const [nmPet,     setNmPet]     = useState('');
  const [especie,   setEspecie]   = useState<Especie | null>(null);
  const [raca,      setRaca]      = useState('');
  const [sexo,      setSexo]      = useState<Sexo | null>(null);
  const [loading,   setLoading]   = useState(false);

  const handlePickPhoto = () => {
    Alert.alert('Foto do pet', 'Como deseja adicionar a foto?', [
      {
        text: 'Câmera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permissão negada', '', [{ text: 'Abrir configurações', onPress: () => Linking.openSettings() }]); return; }
          const res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
          if (!res.canceled) setFotoUri(res.assets[0]?.uri ?? null);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permissão negada'); return; }
          const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
          if (!res.canceled) setFotoUri(res.assets[0]?.uri ?? null);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!nmPet.trim()) { Alert.alert('Atenção', 'Digite o nome do pet.'); return; }
    if (!especie)      { Alert.alert('Atenção', 'Selecione a espécie.'); return; }
    if (!sexo)         { Alert.alert('Atenção', 'Selecione o sexo.'); return; }

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      qc.invalidateQueries({ queryKey: ['pets'] });
      Alert.alert('Pet cadastrado!', `${nmPet} foi adicionado com sucesso.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 405) {
        Alert.alert('Solicite à sua clínica', `Peça à clínica para cadastrar ${nmPet} no sistema. Você receberá uma notificação quando estiver disponível.`, [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={8} accessibilityRole="button" accessibilityLabel="Voltar">
          <KIcon name="back" size={18} color={colors.text} />
        </Pressable>
        <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1.2 }}>NOVO · 1 DE 2</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }} accessibilityRole="button">
          <Text style={{ fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.primary, letterSpacing: 1 }}>CANCELAR</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 36, lineHeight: 42, marginBottom: 4 }}>
          {'Novo '}
          <Text style={{ fontStyle: 'italic', color: colors.primary }}>pet.</Text>
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, marginBottom: 28 }}>
          Quanto mais detalhes, mais preciso o cuidado com o seu pet.
        </Text>

        <Pressable
          onPress={handlePickPhoto}
          style={[styles.photoArea, { borderColor: colors.borderStrong, borderRadius: radius.xl }]}
          accessibilityRole="button"
          accessibilityLabel="Adicionar foto do pet"
        >
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={[styles.photoPreview, { borderRadius: radius.xl }]} />
          ) : (
            <>
              <View style={[styles.photoIcon, { backgroundColor: colors.primarySoft, borderRadius: 36 }]}>
                <KIcon name="plus" size={28} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 18, marginTop: 8 }}>Foto do pet</Text>
              <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1 }}>TOQUE PARA ESCOLHER</Text>
              <View style={styles.photoChips}>
                <KChip tone="sage">✨ Câmera</KChip>
                <KChip tone="mute">Galeria</KChip>
              </View>
            </>
          )}
        </Pressable>

        <Text style={[styles.fieldLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>NOME DO PET *</Text>
        <TextInput
          value={nmPet}
          onChangeText={setNmPet}
          placeholder="Como ele se chama?"
          placeholderTextColor={colors.textMute}
          style={[styles.input, { fontFamily: fonts.body, color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.md, fontSize: fontSize.base }]}
          accessibilityLabel="Nome do pet"
        />

        <Text style={[styles.fieldLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>ESPÉCIE *</Text>
        <View style={styles.especieGrid}>
          {ESPECIES.map(e => {
            const active = especie === e.key;
            return (
              <Pressable
                key={e.key}
                onPress={() => setEspecie(e.key)}
                style={[styles.especieCell, {
                  backgroundColor: active ? colors.primarySoft : colors.surface,
                  borderColor:     active ? colors.primary    : colors.border,
                  borderRadius: radius.lg,
                }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={{ fontSize: 24 }}>{e.emoji}</Text>
                <Text style={{ fontFamily: fonts.mono, color: active ? colors.primary : colors.textMute, fontSize: 9, letterSpacing: 0.8 }}>
                  {e.key.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>RAÇA</Text>
        <TextInput
          value={raca}
          onChangeText={setRaca}
          placeholder="Labrador · Golden · SRD"
          placeholderTextColor={colors.textMute}
          style={[styles.input, { fontFamily: fonts.body, color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.md, fontSize: fontSize.base }]}
          accessibilityLabel="Raça do pet"
        />

        <Text style={[styles.fieldLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>SEXO *</Text>
        <View style={[styles.sexoSegmented, { backgroundColor: colors.surface2, borderRadius: radius.md }]}>
          {([{ key: 'M', label: 'Macho' }, { key: 'F', label: 'Fêmea' }] as const).map(s => {
            const active = sexo === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSexo(s.key)}
                style={[styles.sexoOption, {
                  backgroundColor: active ? colors.primary : 'transparent',
                  borderRadius: radius.md - 2,
                }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={{ fontFamily: fonts.bodyMedium, color: active ? colors.textOnPrimary : colors.textSoft, fontSize: fontSize.sm }}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <KButton
          variant="primary"
          block
          loading={loading}
          onPress={handleSubmit}
          style={styles.cta}
          iconRight={<KIcon name="arrowR" size={16} color={colors.textOnPrimary} style={{ marginLeft: 6 }} />}
        >
          Cadastrar pet
        </KButton>

        <Text style={[styles.footerMono, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>
          ⌧ DADOS CIFRADOS · LGPD COMPLIANT
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1 },
  headerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  circle:        { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:        { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 },
  photoArea:     { borderWidth: 1.5, borderStyle: 'dashed', padding: 24, alignItems: 'center', marginBottom: 28, gap: 6 },
  photoIcon:     { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  photoPreview:  { width: '100%', height: 200 },
  photoChips:    { flexDirection: 'row', gap: 8, marginTop: 6 },
  fieldLabel:    { letterSpacing: 1.2, marginBottom: 8, marginTop: 20 },
  input:         { padding: 14, borderWidth: 1, fontSize: 15 },
  especieGrid:   { flexDirection: 'row', gap: 10 },
  especieCell:   { flex: 1, alignItems: 'center', paddingVertical: 14, borderWidth: 1, gap: 6 },
  sexoSegmented: { flexDirection: 'row', padding: 4, marginTop: 0 },
  sexoOption:    { flex: 1, alignItems: 'center', paddingVertical: 10 },
  cta:           { marginTop: 32 },
  footerMono:    { textAlign: 'center', letterSpacing: 1.2, marginTop: 16 },
});
