import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

// ÂNCORA (regra 11): cópia de mobile-clinica-rn `src/components/feedback/Skeleton.tsx`, linhas 1-49, commit 773ae66,
// conferida em 2026-10-15:
//   git -C mobile-clinica-rn show 773ae66:src/components/feedback/Skeleton.tsx | sed -n '1,49p'
// DIVERGÊNCIAS do tutor: só o tema (`useTheme()` do tutor devolve `{ colors, radius, spacing }` direto). Mesmos
// tokens (`bgSunk`, `radius.lg/xl/sm`, `spacing[3]`), mesma altura por variante, mesmos testIDs.
// Skeleton único do app (BR-TUT-T03). Fundo `bgSunk`, SEM animação — não há o que desligar com Reduce Motion e o
// jest não fica com timer pendurado. `testID="skeleton"` em cada bloco; o contêiner anuncia "Carregando".
export type SkeletonVariant = 'list' | 'card' | 'line';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Quantos blocos desenhar (list: linhas; card: cartões; line: linhas de texto). */
  count?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ALTURA = { list: 64, card: 96, line: 14 } as const;
const PADRAO = { list: 4, card: 1, line: 1 } as const;

type Tema = ReturnType<typeof useTheme>;

const makeStyles = ({ colors, radius, spacing }: Tema) =>
  StyleSheet.create({
    bloco: { backgroundColor: colors.bgSunk },
    list: { height: ALTURA.list, borderRadius: radius.lg },
    card: { height: ALTURA.card, borderRadius: radius.xl },
    line: { height: ALTURA.line, borderRadius: radius.sm },
    pilha: { gap: spacing[3] },
  });

export function Skeleton({ variant = 'list', count, style, testID = 'skeleton' }: SkeletonProps) {
  const styles = makeStyles(useTheme());
  const n = count ?? PADRAO[variant];
  return (
    <View
      style={[styles.pilha, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
      importantForAccessibility="yes"
    >
      {Array.from({ length: n }, (_, i) => (
        <View key={i} testID={testID} style={[styles.bloco, styles[variant]]} />
      ))}
    </View>
  );
}
