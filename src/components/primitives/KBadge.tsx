import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

interface KBadgeProps { count?: number; dot?: boolean; }

export function KBadge({ count, dot }: KBadgeProps) {
  const { colors, fonts } = useTheme();
  if (dot) return <View style={[styles.dot, { backgroundColor: colors.clay, borderColor: colors.surface }]} />;
  if (!count || count === 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.clay, borderColor: colors.surface }]}>
      <Text style={[styles.label, { fontFamily: fonts.mono, color: colors.textOnPrimary }]}>
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { minWidth: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  dot:   { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  label: { fontSize: 9, fontWeight: '700', lineHeight: 14 },
});
