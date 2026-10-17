import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { KIcon }   from '@components/primitives/KIcon';
import { useVoltar } from '../../../hooks/useVoltar';
import { touchTarget } from '@theme/tokens';

// BR-TUT-T10: não existe endpoint de criação de pet para o tutor (PET é tabela .NET-owned; o BFF Java só expõe
// GET — TASK-69). A tela deixou de ser um formulário que descartava o que o tutor digitou: é informativa, sem
// campos e sem pedir câmera/galeria. Nada de telefone/botão de contato: o servidor não manda contato da clínica.
const PASSOS = [
  'Fale com a sua clínica.',
  'Informe nome, espécie, raça e sexo do pet.',
  'Quando a clínica cadastrar, ele aparece em Meus pets.',
];

export default function AddPetScreen() {
  const { colors, fonts, fontSize, radius } = useTheme();
  const insets = useSafeAreaInsets();
  // TASK-F02: alcançável sem histórico por link direto; useVoltar cai na lista de pets.
  const voltar = useVoltar('/(tabs)/pets');

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => voltar()} style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={8} accessibilityRole="button" accessibilityLabel="Voltar">
          <KIcon name="back" size={18} color={colors.text} />
        </Pressable>
        <Text style={{ fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs, letterSpacing: 1.2 }}>NOVO PET</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.icone, { backgroundColor: colors.primarySoft }]}>
          <KIcon name="pets" size={22} color={colors.primary} />
        </View>
        <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 34, lineHeight: 38 }}>
          {'O cadastro do pet é '}
          <Text style={{ fontFamily: fonts.displayItalic, color: colors.primary }}>feito na clínica.</Text>
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, lineHeight: 20, marginTop: 12 }}>
          O aplicativo ainda não cadastra pets. Quem registra é a clínica, e depois ele aparece aqui.
        </Text>

        <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}>
          <Text style={{ fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs, letterSpacing: 1.2 }}>COMO FAZER</Text>
          {PASSOS.map((p, i) => (
            <View key={p} style={styles.passo}>
              <View style={[styles.num, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontFamily: fonts.bodyMedium, color: colors.primary, fontSize: fontSize.sm }}>{i + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.body, color: colors.text, fontSize: fontSize.sm, lineHeight: 20 }}>{p}</Text>
            </View>
          ))}
        </View>

        <KButton variant="primary" block onPress={() => voltar()}>Entendi</KButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  circle:    { width: touchTarget.min, height: touchTarget.min, borderRadius: touchTarget.min / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:    { padding: 24, paddingTop: 32, paddingBottom: 40 },
  icone:     { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  box:       { marginVertical: 24, padding: 16, borderWidth: 1, gap: 16 },
  passo:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  num:       { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
