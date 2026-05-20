import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KChip } from '@components/primitives/KChip';
import { KIcon } from '@components/primitives/KIcon';
import type { VacinaTutorResponse } from '../../types/api';
import { formatDateBR } from '../../utils/date';

interface VacinaItemProps {
  vacina:     VacinaTutorResponse;
  compact?:   boolean;
  onAgendar?: () => void;
}

export function VacinaItem({ vacina, compact, onAgendar }: VacinaItemProps) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const isAplicada = vacina.sgStatus === 'EM_DIA';
  const chipTone   = isAplicada ? 'sage' : vacina.sgStatus === 'VENCENDO' ? 'amber' : 'clay';
  const chipLabel  = isAplicada ? '✓ Aplicada' : vacina.sgStatus === 'VENCENDO' ? '⏱ Próximo' : '⚠ Vencida';

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <View style={[
        styles.iconBox,
        isAplicada
          ? { backgroundColor: colors.primarySoft }
          : { borderWidth: 1.5, borderColor: colors.borderStrong, borderStyle: 'dashed' as const },
      ]}>
        <KIcon name="vaccine" size={18} color={isAplicada ? colors.primary : colors.textMute} />
      </View>

      <View style={styles.info}>
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{vacina.nmVacina}</Text>
        {!compact && (
          <>
            <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }}>
              {vacina.nmClinica}{vacina.nmVeterinario ? ` · ${vacina.nmVeterinario}` : ''}
            </Text>
            <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>
              📅 {formatDateBR(vacina.dtAplicacao)}{vacina.nrLote ? `  🧪 ${vacina.nrLote}` : ''}
            </Text>
          </>
        )}
        {compact && (
          <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }}>
            {vacina.nmClinica}
          </Text>
        )}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <KChip tone={chipTone}>{chipLabel}</KChip>
        {!isAplicada && onAgendar && (
          <Pressable
            onPress={onAgendar}
            style={[styles.agendarBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            accessibilityRole="button"
          >
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.primary, letterSpacing: 0.8 }}>
              AGENDAR
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginBottom: 10, gap: 12 },
  iconBox:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info:      { flex: 1, gap: 2 },
  agendarBtn:{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999, borderWidth: 1 },
});
