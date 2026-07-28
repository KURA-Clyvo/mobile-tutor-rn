import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KIcon, type IconName } from './KIcon';

export interface NextActionDomain { label: string; description: string; urgent?: boolean; icon?: IconName; extraCount?: number }

interface KNextActionCardProps { action: NextActionDomain }

export function KNextActionCard({ action }: KNextActionCardProps) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const tone = action.urgent ? colors.clay : colors.primary;
  const bg = action.urgent ? colors.clayPale : colors.surface2;

  return (
    <View style={[styles.card, { backgroundColor: bg, borderRadius: radius.md }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <KIcon name={action.icon ?? 'calendar'} size={16} color={tone} />
      </View>
      <View style={styles.text}>
        <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 9, letterSpacing: 0.8 }}>
          {action.label}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.sm }}>
          {action.description}
        </Text>
      </View>
      {!!action.extraCount && (
        <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }}>
          +{action.extraCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  text:     { flex: 1, gap: 2 },
});
