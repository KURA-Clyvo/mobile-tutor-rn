import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KIcon } from '@components/primitives/KIcon';

interface AlertaBannerProps {
  title:    string;
  subtitle: string;
  onPress?: () => void;
  /** clay = urgência, amber = atenção (BR-TUT-16). */
  tone?:    'clay' | 'amber';
}

export function AlertaBanner({ title, subtitle, onPress, tone = 'clay' }: AlertaBannerProps) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const t = tone === 'amber'
    ? { bg: colors.amberPale, border: colors.chipBorderAmber, ink: colors.amberInk, tint: colors.chipBorderAmber }
    : { bg: colors.clayPale,  border: colors.chipBorderClay,  ink: colors.clayInk,  tint: colors.clayTint };
  return (
    <View style={[styles.wrap, {
      backgroundColor: t.bg,
      borderColor: t.border,
      borderRadius: radius.lg,
    }]}>
      <View style={[styles.iconWrap, { backgroundColor: t.tint }]}>
        <KIcon name="alert" size={16} color={t.ink} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { fontFamily: fonts.bodyMedium, color: t.ink, fontSize: fontSize.sm }]}>
          {title}
        </Text>
        <Text style={[styles.sub, { fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs }]}>
          {subtitle}
        </Text>
      </View>
      {onPress && (
        <Pressable
          onPress={onPress}
          hitSlop={8}
          style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Ver detalhes"
        >
          <Text style={{ fontFamily: fonts.mono, fontSize: fontSize.xs, color: t.ink, letterSpacing: 0.8 }}>
            VER →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderWidth: 1, marginBottom: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  content:  { flex: 1, gap: 2 },
  title:    {},
  sub:      {},
});
