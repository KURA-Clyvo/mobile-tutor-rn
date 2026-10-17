import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { fonts, spacing } from '@theme/tokens';

// Kicker do DS: rótulo mono, CAIXA ALTA, precedido de filete de 1px, que NOMEIA a função do bloco ("IMUNIZAÇÃO"). Nunca numeração
// decorativa ("03 · ...") — BR-TUT-14 / BR-TUT-T11.
// ÂNCORA (regra 11): cópia adaptada de `mobile-clinica-rn/src/components/primitives/Kicker.tsx` (arquivo inteiro, 39 linhas, commit
// 8e721ee, conferido em 2026-10-17). Diferenças: sem a prop `cor` (o tutor só usa `textMuteInk`); tamanho 10 literal porque o
// tutor não tem `fontSize.micro`. Reproduz: git -C ../mobile-clinica-rn show 8e721ee:src/components/primitives/Kicker.tsx
// Regra do ciclo na clínica é "<= 1 por tela"; aqui a aba Resumo do pet tem 4 blocos nomeados — desvio declarado no relatório.
export interface KickerProps {
  children: string;
  testID?: string;
}

export function Kicker({ children, testID }: KickerProps) {
  const { colors } = useTheme();
  const c = colors.textMuteInk;
  return (
    <View style={styles.linha} testID={testID}>
      <View style={[styles.filete, { backgroundColor: c }]} />
      <Text style={[styles.texto, { color: c }]} accessibilityRole="header">
        {children.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexShrink: 1 },
  filete: { width: spacing[4], height: 1 },
  // letterSpacing 0.18em do DS sobre 10px = 1.8
  texto: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.8, flexShrink: 1 },
});
