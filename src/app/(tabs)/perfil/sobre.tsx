import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { touchTarget } from '@theme/tokens';
import { KuraMark } from '@components/brand/KuraMark';
import { KIcon } from '@components/primitives/KIcon';
import { KCard } from '@components/primitives/KCard';
import { useVoltar } from '../../../hooks/useVoltar';
import { lerVersaoApp, lerAmbienteApp } from '../../../constants/versaoApp';

// S4-MOB-02: tela "Sobre o App" (rubrica Sprint 4, Publicação). Era um modal com "Versão 1.0.0" fixo;
// agora mostra o commit que o build injetou (app.config.js), para conferir publicado = código.
export default function SobreScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const voltar = useVoltar('/(tabs)/perfil');
  const { versao, commit, commitCurto, alteracoesLocais } = lerVersaoApp();
  const { apiUrl, modoDemo } = lerAmbienteApp();

  const rotulo = { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs, letterSpacing: 1.2 };
  const valor = { fontFamily: fonts.body, color: colors.text, fontSize: fontSize.md };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => voltar()} style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={8} accessibilityRole="button" accessibilityLabel="Voltar">
          <KIcon name="back" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={{ marginBottom: 12 }}><KuraMark size={44} variante="sobreNeutro" /></View>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.display, color: colors.text, fontSize: 32, lineHeight: 35, marginBottom: 20 }}>Sobre o App</Text>

      <KCard style={styles.card}>
        <Text style={rotulo}>APLICATIVO</Text>
        <Text style={valor}>KURA Tutor · versão {versao}</Text>

        <Text style={[rotulo, styles.espaco]}>COMMIT DESTA VERSÃO</Text>
        <Text testID="sobre-commit" selectable style={[valor, { fontFamily: fonts.mono }]}>{commitCurto ?? 'não identificado'}</Text>
        {commit ? <Text selectable style={{ fontFamily: fonts.mono, color: colors.textSoft, fontSize: fontSize.xs }}>{commit}</Text> : null}
        {alteracoesLocais ? (
          <Text style={{ fontFamily: fonts.body, color: colors.danger, fontSize: fontSize.sm, marginTop: 6 }}>
            Build com alterações não commitadas: não corresponde exatamente a este commit.
          </Text>
        ) : null}

        <Text style={[rotulo, styles.espaco]}>SERVIDOR</Text>
        <Text selectable style={{ fontFamily: fonts.mono, color: colors.text, fontSize: fontSize.xs }}>{apiUrl}</Text>
        <Text style={{ fontFamily: fonts.body, color: modoDemo ? colors.danger : colors.textSoft, fontSize: fontSize.sm, marginTop: 4 }}>
          {modoDemo ? 'Modo demonstração: dados simulados' : 'Dados reais da clínica'}
        </Text>
      </KCard>

      <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, marginTop: 24, textAlign: 'center' }}>
        KURA Vet · Clyvo · FIAP Challenge 2026
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:    { padding: 20, paddingBottom: 40 },
  headerRow: { marginBottom: 20 },
  circle:    { width: touchTarget.min, height: touchTarget.min, borderRadius: touchTarget.min / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  card:      { padding: 20 },
  espaco:    { marginTop: 16 },
});
