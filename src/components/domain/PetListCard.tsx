import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KPetPortrait, racaToPalette } from '@components/primitives/KPetPortrait';
import { KChip } from '@components/primitives/KChip';
import { KIcon } from '@components/primitives/KIcon';
import type { PetDomain } from '../../types/domain';

interface StatCell { label: string; value: string; alert?: boolean }

interface PetListCardProps {
  pet:     PetDomain;
  onPress: () => void;
}

export function PetListCard({ pet, onPress }: PetListCardProps) {
  const { colors, fonts, fontSize, radius } = useTheme();

  const palette = racaToPalette(pet.raca);
  const hasLunaChip = pet.chips.some(c => c.label.includes('✨'));
  const tier = hasLunaChip ? 'detected' : 'emoji';
  const lunaEmoji = hasLunaChip ? '✨' : undefined;

  const stats: StatCell[] = [
    { label: 'CONSULTAS', value: String(pet.nrConsultas ?? 0) },
    { label: 'ALERTAS',   value: String(pet.alertasAtivos), alert: pet.alertasAtivos > 0 },
    { label: 'STATUS',    value: pet.statusGeral },
  ];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl },
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${pet.nome}, ${pet.especie}, ${pet.statusGeral}`}
    >
      <View style={styles.topRow}>
        <KPetPortrait palette={palette} size={56} tier={tier} badge={lunaEmoji} especie={pet.especie} />
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.nome, { fontFamily: fonts.display, color: colors.text, fontSize: 26 }]}>
            {pet.nome}
          </Text>
          <Text style={[styles.meta, { fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }]}>
            {pet.raca} · {pet.idadeAnos}a · {pet.sexo === 'M' ? 'Macho' : 'Fêmea'}
          </Text>
          <View style={styles.chips}>
            {pet.chips.map((c, i) => (
              <KChip key={i} tone={c.tone}>{c.label}</KChip>
            ))}
          </View>
        </View>
        <KIcon name="chevR" size={16} color={colors.textMute} />
      </View>

      {/* Stats grid — 3 cols with separators, portado de kura-screens-1.jsx */}
      <View style={[styles.statsGrid, { borderTopColor: colors.border }]}>
        {stats.map((s, i) => (
          <View
            key={s.label}
            style={[
              styles.statCell,
              i < stats.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border },
            ]}
          >
            <Text style={[styles.statLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: 9 }]}>
              {s.label}
            </Text>
            <Text style={[styles.statValue, { fontFamily: fonts.display, color: s.alert ? colors.clay : colors.text, fontSize: 16 }]}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card:      { borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  topRow:    { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  info:      { flex: 1, gap: 5 },
  nome:      { fontWeight: '500', lineHeight: 28 },
  meta:      {},
  chips:     { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statsGrid: { flexDirection: 'row', borderTopWidth: 1 },
  statCell:  { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  statLabel: { letterSpacing: 0.8 },
  statValue: { fontWeight: '500' },
});
