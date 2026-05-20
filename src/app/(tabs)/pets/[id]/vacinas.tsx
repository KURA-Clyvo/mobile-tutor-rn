import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KChip }   from '@components/primitives/KChip';
import { KIcon }   from '@components/primitives/KIcon';
import { KCard }   from '@components/primitives/KCard';
import { usePetVacinas } from '../../../../hooks/usePetVacinas';
import { formatDateBR } from '../../../../utils/date';
import type { VacinaTutorResponse } from '../../../../types/api';

export function VacinasTab({ petId }: { petId: number }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const router = useRouter();
  const { list: { data: vacinas = [] }, status: { data: statusData } } = usePetVacinas(petId);

  const aplicadas = [...vacinas.filter(v => v.sgStatus === 'EM_DIA')]
    .sort((a, b) => new Date(b.dtAplicacao).getTime() - new Date(a.dtAplicacao).getTime());
  const proximas = [...vacinas.filter(v => v.sgStatus !== 'EM_DIA')]
    .sort((a, b) => new Date(a.dtProximaDose ?? '0').getTime() - new Date(b.dtProximaDose ?? '0').getTime());

  const bannerCfg = {
    EM_DIA:  { bg: colors.primarySoft, border: colors.primary, icon: 'check'  as const, iconColor: colors.primary, title: 'Vacinação em dia' },
    ALERTA:  { bg: colors.amberPale,   border: colors.amber,   icon: 'alert'  as const, iconColor: colors.amber,   title: 'Vacinas próximas do vencimento' },
    VENCIDA: { bg: colors.clayPale,    border: colors.clay,    icon: 'alert'  as const, iconColor: colors.clay,    title: 'Vacinas vencidas — agende já' },
  };
  const bCfg = bannerCfg[statusData?.dsStatusGeral ?? 'EM_DIA'];

  return (
    <View>
      <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1, marginBottom: 4 }}>
        04 · IMUNIZAÇÃO
      </Text>
      <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 28, lineHeight: 34, marginBottom: 16 }}>
        {'Carteira de '}
        <Text style={{ fontStyle: 'italic', color: colors.primary }}>vacinação.</Text>
      </Text>

      {statusData && (
        <View style={[styles.banner, { backgroundColor: bCfg.bg, borderColor: bCfg.border }]}>
          <View style={[styles.bannerIcon, { backgroundColor: bCfg.iconColor + '22' }]}>
            <KIcon name={bCfg.icon} size={20} color={bCfg.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, color: bCfg.iconColor, fontSize: fontSize.sm }}>{bCfg.title}</Text>
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs }}>
              {statusData.nmUltimaVacina ? `Última: ${statusData.nmUltimaVacina}` : ''}
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.display, color: bCfg.iconColor, fontSize: 28 }}>
            {`${statusData.nrAplicadas}/${statusData.nrTotal}`}
          </Text>
        </View>
      )}

      {aplicadas.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>APLICADAS</Text>
          {aplicadas.map(v => <VacinaRow key={v.id} vacina={v} />)}
        </>
      )}

      {proximas.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>PRÓXIMAS / VENCIDAS</Text>
          {proximas.map(v => (
            <VacinaRow
              key={v.id}
              vacina={v}
              onAgendar={() => router.push({ pathname: '/(tabs)/agenda/novo', params: { idPet: String(petId), tipo: 'RETORNO' } } as any)}
            />
          ))}
        </>
      )}

      {vacinas.length === 0 && (
        <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
          <KIcon name="vaccine" size={28} color={colors.textMute} />
          <Text style={{ fontFamily: fonts.body, color: colors.textMute }}>Sem registro de vacinas ainda.</Text>
        </View>
      )}
    </View>
  );
}

function VacinaRow({ vacina, onAgendar }: { vacina: VacinaTutorResponse; onAgendar?: () => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const isAplicada = vacina.sgStatus === 'EM_DIA';
  const chipTone   = vacina.sgStatus === 'EM_DIA' ? 'sage' : vacina.sgStatus === 'VENCENDO' ? 'amber' : 'clay';
  const chipLabel  = vacina.sgStatus === 'EM_DIA' ? '✓ Aplicada' : vacina.sgStatus === 'VENCENDO' ? '⏱ Próximo' : '⚠ Vencida';

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <View style={[
        styles.iconBox,
        isAplicada
          ? { backgroundColor: colors.primarySoft }
          : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.borderStrong, borderStyle: 'dashed' },
      ]}>
        <KIcon name="vaccine" size={18} color={isAplicada ? colors.primary : colors.textMute} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{vacina.nmVacina}</Text>
        <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }}>
          {vacina.nmClinica}{vacina.nmVeterinario ? ` · ${vacina.nmVeterinario}` : ''}
        </Text>
        <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>
          📅 {formatDateBR(vacina.dtAplicacao)}{vacina.nrLote ? `  🧪 ${vacina.nrLote}` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <KChip tone={chipTone}>{chipLabel}</KChip>
        {!isAplicada && onAgendar && (
          <Pressable onPress={onAgendar} style={[styles.agendarBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]} accessibilityRole="button">
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.primary, letterSpacing: 0.8 }}>AGENDAR</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { letterSpacing: 1.2, marginTop: 20, marginBottom: 10 },
  banner:       { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 20, gap: 12 },
  bannerIcon:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  row:          { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginBottom: 10, gap: 12 },
  iconBox:      { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowInfo:      { flex: 1, gap: 2 },
  agendarBtn:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999, borderWidth: 1 },
});
