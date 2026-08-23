import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KPetPortrait, racaToPalette } from '@components/primitives/KPetPortrait';
import { KConditionChip } from '@components/primitives/KConditionChip';
import { KIcon } from '@components/primitives/KIcon';
import { formatDateShortBR } from '../../utils/date';
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
  const condicaoPrincipal = pet.condicoes?.[0];

  const statusLabel = { OK: 'Tudo certo', ALERTA: 'Atenção', URGENTE: 'Urgente' }[pet.statusGeral];

  const stats: StatCell[] = [
    { label: 'PRÓXIMO', value: pet.dtProximoAgendamento ? formatDateShortBR(pet.dtProximoAgendamento) : '—' },
    { label: 'STATUS',  value: statusLabel, alert: pet.statusGeral !== 'OK' },
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
          {condicaoPrincipal && <KConditionChip condicao={condicaoPrincipal} />}
        </View>
        <KIcon name="chevR" size={16} color={colors.textMute} />
      </View>

      {/* Stats grid — 2 cols, ambas acionáveis */}
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
  statsGrid: { flexDirection: 'row', borderTopWidth: 1 },
  statCell:  { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  statLabel: { letterSpacing: 0.8 },
  statValue: { fontWeight: '500' },
});
