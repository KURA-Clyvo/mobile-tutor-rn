import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

type Tone = 'sage' | 'ocean' | 'amber';

interface ConsultaSectionProps { title: string; tone: Tone; children: React.ReactNode }

export function ConsultaSection({ title, tone, children }: ConsultaSectionProps) {
  const { colors, fonts, fontSize } = useTheme();
  const lineColor = tone === 'sage' ? colors.primary : tone === 'ocean' ? colors.ocean : colors.amber;
  return (
    <View style={[styles.section, { borderLeftWidth: 3, borderLeftColor: lineColor, paddingLeft: 14, marginBottom: 20 }]}>
      <Text style={[styles.label, { fontFamily: fonts.mono, color: lineColor, fontSize: fontSize.xs, letterSpacing: 1.2, marginBottom: 8 }]}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ section: {}, label: {} });
