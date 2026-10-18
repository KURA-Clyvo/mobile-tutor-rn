import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@theme/index';
import { touchTarget } from '@theme/tokens';

// Chip SELECIONÁVEL de categoria (o KChip do app não tem onPress nem estado), opção de um radiogroup de seleção única.
// `radio` + `checked` (+ `aria-checked`, que o RN-web exige) é o par que o Chrome expõe na web; `button` + `selected` não. Alvo >= 44.
// Selecionado: fundo `primary`, texto `textOnPrimary`. Não selecionado: `surface` + borda `borderControl` + texto `textSoft`.
export function CategoriaChip({ rotulo, selecionado, onPress, testID }: { rotulo: string; selecionado: boolean; onPress: () => void; testID?: string }) {
  const { colors, fonts, fontSize, radius, spacing } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: selecionado }}
      aria-checked={selecionado}
      style={[
        styles.chip,
        {
          borderRadius: radius.full,
          paddingHorizontal: spacing[4],
          backgroundColor: selecionado ? colors.primary : colors.surface,
          borderColor: selecionado ? colors.primary : colors.borderControl,
        },
      ]}
    >
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: selecionado ? colors.textOnPrimary : colors.textSoft }}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: touchTarget.min, minWidth: touchTarget.min, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
