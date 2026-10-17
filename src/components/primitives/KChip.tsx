import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

type Tone = 'sage' | 'amber' | 'clay' | 'ocean' | 'mute';

interface KChipProps { tone?: Tone; dot?: boolean; borderColor?: string; children: React.ReactNode; }

export function KChip({ tone = 'sage', dot, borderColor, children }: KChipProps) {
  const { colors, fonts, fontSize } = useTheme();

  const toneMap: Record<Tone, { bg: string; color: string; border: string }> = {
    sage:  { bg: colors.primarySoft,  color: colors.primary,  border: colors.chipBorderSage  },
    amber: { bg: colors.amberPale,    color: colors.amberInk,  border: colors.chipBorderAmber },
    clay:  { bg: colors.clayPale,     color: colors.clayInk,   border: colors.chipBorderClay  },
    ocean: { bg: colors.oceanPale,    color: colors.ocean,    border: colors.chipBorderOcean },
    mute:  { bg: colors.surface2,     color: colors.textSoft,    border: colors.border            },
  };

  const { bg, color, border } = toneMap[tone];

  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: borderColor ?? border }]}>
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text numberOfLines={1} style={[styles.label, { color, fontFamily: fonts.body, fontSize: fontSize.xs }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9999, borderWidth: 1, alignSelf: 'flex-start' },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontWeight: '500' },
});
