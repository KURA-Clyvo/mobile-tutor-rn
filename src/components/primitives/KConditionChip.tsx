import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KIcon } from './KIcon';

type Tone = 'amber' | 'clay';

export interface CondicaoDomain { label: string; tone: Tone; desde?: string; observacao?: string }

interface KConditionChipProps { condicao: CondicaoDomain }

export function KConditionChip({ condicao }: KConditionChipProps) {
  const { colors, fonts, fontSize } = useTheme();

  const toneMap: Record<Tone, { bg: string; color: string; border: string }> = {
    amber: { bg: colors.amberPale, color: colors.amber, border: 'rgba(200,129,13,0.22)' },
    clay:  { bg: colors.clayPale,  color: colors.clay,  border: 'rgba(217,98,74,0.22)'  },
  };
  const { bg, color, border } = toneMap[condicao.tone];

  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: border }]}>
      <KIcon name="alert" size={12} color={color} />
      <Text numberOfLines={1} style={[styles.label, { color, fontFamily: fonts.body, fontSize: fontSize.xs }]}>
        {condicao.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9999, borderWidth: 1, alignSelf: 'flex-start' },
  label: { fontWeight: '500' },
});
