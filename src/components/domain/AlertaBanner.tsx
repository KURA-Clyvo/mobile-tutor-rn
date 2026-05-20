import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KIcon } from '@components/primitives/KIcon';

interface AlertaBannerProps {
  title:    string;
  subtitle: string;
  onPress?: () => void;
}

export function AlertaBanner({ title, subtitle, onPress }: AlertaBannerProps) {
  const { colors, fonts, fontSize, radius } = useTheme();
  return (
    <View style={[styles.wrap, {
      backgroundColor: colors.clayPale,
      borderColor: 'rgba(217,98,74,0.22)',
      borderRadius: radius.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.clay,
    }]}>
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(217,98,74,0.15)' }]}>
        <KIcon name="alert" size={16} color={colors.clay} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { fontFamily: fonts.bodyMedium, color: colors.clay, fontSize: fontSize.sm }]}>
          {title}
        </Text>
        <Text style={[styles.sub, { fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs }]}>
          {subtitle}
        </Text>
      </View>
      {onPress && (
        <Pressable onPress={onPress} accessibilityRole="button">
          <Text style={{ fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.clay, letterSpacing: 0.8 }}>
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
