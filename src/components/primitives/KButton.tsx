import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface KButtonProps extends Omit<PressableProps, 'style'> {
  variant?:   Variant;
  size?:      Size;
  loading?:   boolean;
  iconLeft?:  React.ReactNode;
  iconRight?: React.ReactNode;
  block?:     boolean;
  style?:     StyleProp<ViewStyle>;
  children:   React.ReactNode;
}

export function KButton({
  variant = 'primary', size = 'md', loading = false,
  disabled = false, iconLeft, iconRight, block = false,
  style, children, onPress, ...rest
}: KButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles: Record<Variant, { container: object; label: { color: string } }> = {
    primary:   { container: { backgroundColor: theme.colors.primary },  label: { color: theme.colors.textOnPrimary } },
    secondary: { container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.borderStrong }, label: { color: theme.colors.text } },
    ghost:     { container: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, label: { color: theme.colors.text } },
    danger:    { container: { backgroundColor: theme.colors.danger },  label: { color: theme.colors.textOnPrimary } },
  };

  const sizeStyles: Record<Size, { paddingVertical: number; paddingHorizontal: number; minHeight: number; fontSize: number; gap: number }> = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 40, fontSize: theme.fontSize.sm,   gap: 6 },
    md: { paddingVertical: 14, paddingHorizontal: 22, minHeight: 48, fontSize: theme.fontSize.base, gap: 8 },
    lg: { paddingVertical: 18, paddingHorizontal: 28, minHeight: 56, fontSize: theme.fontSize.md,   gap: 8 },
  };

  const cv = variantStyles[variant];
  const sz = sizeStyles[size];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        cv.container,
        { borderRadius: theme.radius.full, minHeight: sz.minHeight, paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal, gap: sz.gap },
        block && { width: '100%' as const },
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.7 },
        style,
      ]}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color={cv.label.color} size="small" />
        : <>{iconLeft}<Text style={[styles.label, cv.label, { fontSize: sz.fontSize, fontFamily: theme.fonts.bodyMedium }]}>{children}</Text>{iconRight}</>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '500', textAlign: 'center' },
});
