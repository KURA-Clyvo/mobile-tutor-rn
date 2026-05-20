import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KChip }        from '@components/primitives/KChip';
import { KIcon }        from '@components/primitives/KIcon';
import { KPetPortrait, racaToPalette } from '@components/primitives/KPetPortrait';
import { ConsultasTab } from './consultas';
import { VacinasTab }   from './vacinas';
import { usePetDetail } from '../../../../hooks/usePetDetail';
import { formatDateBR } from '../../../../utils/date';

type Tab = 'visao' | 'consultas' | 'vacinas' | 'docs';

const STATUS_CHIP = {
  OK:      { tone: 'sage'  as const, label: 'Tudo certo' },
  ALERTA:  { tone: 'amber' as const, label: 'Atenção'    },
  URGENTE: { tone: 'clay'  as const, label: 'Urgente'    },
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'visao',     label: 'Visão geral' },
  { key: 'consultas', label: 'Consultas'   },
  { key: 'vacinas',   label: 'Vacinas'     },
  { key: 'docs',      label: 'Docs'        },
];

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId  = parseInt(id ?? '0', 10);
  const { colors, fonts, fontSize, radius } = useTheme();
  const router  = useRouter();
  const { data: pet } = usePetDetail(petId);
  const [tab, setTab] = useState<Tab>('visao');

  const statusCfg = STATUS_CHIP[pet?.dsStatusGeral ?? 'OK'];

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      {/* Header bar */}
      <View style={[styles.hdr, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Voltar">
          <KIcon name="back" size={18} color={colors.text} />
        </Pressable>
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{pet?.nmPet ?? '…'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primarySoft }]}>
          <KPetPortrait
            palette={racaToPalette(pet?.nmRaca ?? '')}
            size={92}
            tier="detected"
            especie={pet?.nmEspecie}
          />
          <View style={styles.heroInfo}>
            <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 26, lineHeight: 30 }}>
              {pet?.nmPet ?? '…'}
            </Text>
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm }}>
              {pet ? `${pet.nmRaca} · ${pet.sgSexo === 'M' ? 'Macho' : 'Fêmea'}` : ''}
            </Text>
            <View style={styles.chipsRow}>
              <KChip tone={statusCfg.tone}>{statusCfg.label}</KChip>
              {pet?.chips.slice(0, 2).map((c, i) => (
                <KChip key={i} tone={c.tone}>{c.label}</KChip>
              ))}
            </View>
            <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>
              {pet?.nmClinica}
            </Text>
          </View>
        </View>

        {/* Pill tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsScroll, { borderBottomColor: colors.border }]}
        >
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tabPill, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.tabLabel, {
                  fontFamily: active ? fonts.bodyMedium : fonts.body,
                  color: active ? colors.primary : colors.textMute,
                  fontSize: fontSize.sm,
                }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {tab === 'visao'     && <VisaoTab pet={pet} />}
          {tab === 'consultas' && <ConsultasTab petId={petId} />}
          {tab === 'vacinas'   && <VacinasTab petId={petId} />}
          {tab === 'docs'      && <DocsPlaceholder />}
        </View>
      </ScrollView>

      {/* FAB Agendar */}
      <Pressable
        onPress={() => router.push({ pathname: '/(tabs)/agenda/novo', params: { idPet: String(petId) } } as any)}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Agendar consulta"
      >
        <KIcon name="plus" size={18} color={colors.textOnPrimary} />
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.textOnPrimary, fontSize: fontSize.sm }}>Agendar</Text>
      </Pressable>
    </View>
  );
}

function VisaoTab({ pet }: { pet: ReturnType<typeof usePetDetail>['data'] }) {
  const { colors, fonts, fontSize } = useTheme();

  const vitais = [
    { l: 'PESO',  v: pet?.nrPesoKg         ? `${pet.nrPesoKg} kg`          : '—' },
    { l: 'TEMP',  v: pet?.nrTemperaturaC    ? `${pet.nrTemperaturaC}°C`     : '—' },
    { l: 'FC',    v: pet?.nrFreqCardiacaBpm ? `${pet.nrFreqCardiacaBpm} bpm` : '—' },
  ];

  return (
    <View style={{ gap: 20 }}>
      <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1 }}>
        01 · SINAIS VITAIS
      </Text>
      <View style={styles.vitaisRow}>
        {vitais.map(v => (
          <View key={v.l} style={[styles.vitalBox, { backgroundColor: colors.surface2, borderRadius: 10 }]}>
            <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>{v.l}</Text>
            <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 22 }}>{v.v}</Text>
          </View>
        ))}
      </View>

      {(pet?.dtProximoAgendamento || pet?.dtUltimaConsulta) && (
        <>
          <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1 }}>
            02 · AGENDAMENTOS
          </Text>
          <View style={[styles.apptCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12 }]}>
            {pet?.dtProximoAgendamento && (
              <View style={styles.apptRow}>
                <KIcon name="calendar" size={16} color={colors.primary} />
                <View>
                  <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>PRÓXIMO</Text>
                  <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.sm }}>
                    {formatDateBR(pet.dtProximoAgendamento)}
                  </Text>
                </View>
              </View>
            )}
            {pet?.dtUltimaConsulta && (
              <View style={styles.apptRow}>
                <KIcon name="check" size={16} color={colors.textMute} />
                <View>
                  <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>ÚLTIMA CONSULTA</Text>
                  <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm }}>
                    {formatDateBR(pet.dtUltimaConsulta)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </>
      )}

      {pet?.dsObservacoes && (
        <>
          <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1 }}>
            03 · OBSERVAÇÕES
          </Text>
          <View style={[styles.obsCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12 }]}>
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, lineHeight: 20 }}>
              {pet.dsObservacoes}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

function DocsPlaceholder() {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
      <KIcon name="download" size={28} color={colors.textMute} />
      <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.sm }}>Documentos em breve</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  hdr:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 120 },
  hero:        { flexDirection: 'row', alignItems: 'flex-start', padding: 20, gap: 16 },
  heroInfo:    { flex: 1, gap: 6 },
  chipsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tabsScroll:  { paddingHorizontal: 20, gap: 0, borderBottomWidth: 1 },
  tabPill:     { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel:    {},
  tabContent:  { padding: 20 },
  vitaisRow:   { flexDirection: 'row', gap: 10 },
  vitalBox:    { flex: 1, alignItems: 'center', padding: 14, gap: 4 },
  apptCard:    { borderWidth: 1, padding: 16, gap: 12 },
  apptRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  obsCard:     { borderWidth: 1, padding: 16 },
  fab:         { position: 'absolute', bottom: 96, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 9999, elevation: 4 },
});
