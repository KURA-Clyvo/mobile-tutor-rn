import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';
import { touchTarget } from '@theme/tokens';
import { pisoDeAlvo } from '@theme/pisoDeAlvo';

interface KCardProps { onPress?: () => void; style?: StyleProp<ViewStyle>; children: React.ReactNode; }

export function KCard({ onPress, style, children }: KCardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 18,
    minHeight: touchTarget.min,
    minWidth: touchTarget.min,
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [base, pressed && { opacity: 0.7 }, style, pisoDeAlvo(style)]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style, pisoDeAlvo(style)]}>{children}</View>;
}
