import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KChip } from '@components/primitives/KChip';
import { KIcon } from '@components/primitives/KIcon';
import type { VacinaTutorResponse } from '../../types/api';
import { classificarVacina, quandoVacina, type EstadoVacina } from '../../utils/vacinas';

interface VacinaItemProps {
  vacina:     VacinaTutorResponse;
  /** De qual pet é (Saúde, que mistura pets). Na aba do pet a tela já diz de quem é. */
  petNome?:   string;
  onAgendar?: () => void;
  now?:       Date;
}

// clay = urgência (vencida), amber = atenção (vencendo), sage = em dia (BR-TUT-16).
const CHIP: Record<EstadoVacina, { tone: 'clay' | 'amber' | 'sage'; label: string }> = {
  VENCIDA:  { tone: 'clay',  label: 'Vencida'  },
  VENCENDO: { tone: 'amber', label: 'Vencendo' },
  EM_DIA:   { tone: 'sage',  label: 'Em dia'   },
};

export function VacinaItem({ vacina, petNome, onAgendar, now }: VacinaItemProps) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const estado = classificarVacina(vacina, now);
  const emDia = estado === 'EM_DIA';
  const quando = quandoVacina(vacina, now);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <View style={[
        styles.iconBox,
        emDia
          ? { backgroundColor: colors.primarySoft }
          : { borderWidth: 1.5, borderColor: colors.borderStrong, borderStyle: 'dashed' as const },
      ]}>
        <KIcon name="vaccine" size={18} color={emDia ? colors.primary : colors.textMuteInk} />
      </View>

      <View style={styles.info}>
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>
          {petNome ? `${vacina.nmVacina} · ${petNome}` : vacina.nmVacina}
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs }}>{quando}</Text>
        <Text style={{ fontFamily: fonts.body, color: colors.textMuteInk, fontSize: fontSize.xs }}>{vacina.nmClinica}</Text>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <KChip tone={CHIP[estado].tone}>{CHIP[estado].label}</KChip>
        {!emDia && onAgendar && (
          <Pressable
            onPress={onAgendar}
            style={[styles.agendarBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`Agendar ${vacina.nmVacina}`}
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
