// BR-TUT-T09 — linha com `Switch`: a LINHA inteira é o alvo de toque (>= 44 de altura, role "switch").
//
// Por quê: o `Switch` do RN-web mede 40×20 (BR-TUT-07 / sonda de DOM de 2026-10-17) e não aceita `hitSlop`; deixar só ele como alvo
// reprova 2.5.8. Aqui o `Pressable` da linha alterna o valor; o `Switch` fica só como desenho (fora da árvore de acessibilidade,
// sem receber toque nem foco). Regra do gate (`__tests__/a11y-alvos-gate.test.tsx`): `<Switch>` só pode existir NESTE arquivo.
// ÂNCORA (regra 11): cópia adaptada de `mobile-clinica-rn/src/components/primitives/KCSwitchRow.tsx` (arquivo inteiro, commit
// 45e0754, conferido em 2026-10-17). Diferenças: nome `KSwitchRow`, `touchTarget` de `@theme/tokens` do tutor, token `bgElev` do tutor.
// Reproduz: git -C ../mobile-clinica-rn show 45e0754:src/components/primitives/KCSwitchRow.tsx
import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';
import { touchTarget } from '@theme/tokens';

export interface KSwitchRowProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  /** Texto de leitor de tela da linha. */
  accessibilityLabel: string;
  /** `testID` do `Switch`; a linha recebe `${testID}-row`. */
  testID: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function KSwitchRow({ value, onValueChange, accessibilityLabel, testID, children, style }: KSwitchRowProps) {
  const { colors } = useTheme();
  // Web: tira o `<input>` do Switch do foco/árvore. No-op fora do web.
  const esconderSwitch = React.useCallback((no: unknown) => {
    if (Platform.OS === 'web' && no && typeof (no as HTMLElement).setAttribute === 'function') {
      (no as HTMLElement).setAttribute('inert', '');
    }
  }, []);
  // Web: role=switch não responde ao Espaço no RN-web (PressResponder só aceita Espaço em <button>/role=button).
  const aoTeclar = (e: { key?: string; preventDefault?: () => void }) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault?.();
      onValueChange(!value);
    }
  };
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      {...({ onKeyDown: aoTeclar } as object)}
      testID={`${testID}-row`}
      style={[styles.row, style]}
    >
      <View style={styles.conteudo}>{children}</View>
      <View
        ref={esconderSwitch}
        pointerEvents="none"
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.borderControl, true: colors.primary }}
          thumbColor={colors.bgElev}
          // RN-web usa teal fora do DS quando `activeThumbColor` falta (prop só do RN-web, fora dos tipos do RN).
          {...({ activeThumbColor: colors.bgElev } as object)}
          testID={testID}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget.min,
    minWidth: touchTarget.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  conteudo: { flex: 1 },
});
