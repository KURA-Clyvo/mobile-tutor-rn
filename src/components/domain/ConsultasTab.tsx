import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Share } from 'react-native';
import { useTheme } from '@theme/index';
import { KChip }   from '@components/primitives/KChip';
import { KButton } from '@components/primitives/KButton';
import { KIcon }   from '@components/primitives/KIcon';
import { ConsultaSection } from './ConsultaSection';
import { usePetTimeline, usePetTimelineEvent } from '@hooks/usePetTimeline';
import { formatDateBR } from '../../utils/date';
import type { TimelineTutorEventResponse } from '../../types/api';

type Filter = 'all' | 'pres' | 'tele';

export function ConsultasTab({ petId }: { petId: number }) {
  const { colors, fonts, fontSize } = useTheme();
  const { data: eventos = [] } = usePetTimeline(petId);
  const [filter, setFilter]       = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = eventos.filter(e => {
    if (filter === 'pres') return e.sgTipoAtendimento === 'pres';
    if (filter === 'tele') return e.sgTipoAtendimento === 'tele';
    return true;
  });

  const presCount = eventos.filter(e => e.sgTipoAtendimento === 'pres').length;
  const teleCount = eventos.filter(e => e.sgTipoAtendimento === 'tele').length;

  if (selectedId) {
    return <ConsultaDetail petId={petId} idEvento={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',  label: `Todas ${eventos.length}` },
    { key: 'pres', label: `Presencial ${presCount}` },
    { key: 'tele', label: `Telemedicina ${teleCount}` },
  ];

  return (
    <View>
      <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1, marginBottom: 4 }}>
        {`${eventos.length} · VISITAS`}
      </Text>
      <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 28, lineHeight: 34, marginBottom: 16 }}>
        {'Histórico de '}
        <Text style={{ fontStyle: 'italic', color: colors.primary }}>consultas.</Text>
      </Text>

      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterPill, {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterLabel, { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: active ? colors.textOnPrimary : colors.textSoft }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filtered.map((ev, idx) => (
        <TimelineRow
          key={ev.idEventoClinico}
          ev={ev}
          isLast={idx === filtered.length - 1}
          onPress={() => setSelectedId(ev.idEventoClinico)}
        />
      ))}

      {filtered.length === 0 && (
        <View style={{ alignItems: 'center', paddingTop: 32, gap: 8 }}>
          <Text style={{ fontFamily: fonts.body, color: colors.textMute }}>Sem eventos neste filtro</Text>
        </View>
      )}
    </View>
  );
}

function TimelineRow({ ev, isLast, onPress }: { ev: TimelineTutorEventResponse; isLast: boolean; onPress: () => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const isTele  = ev.sgTipoAtendimento === 'tele';
  const dotBg     = isTele ? colors.oceanPale  : colors.primarySoft;
  const dotBorder = isTele ? colors.ocean      : colors.primary;

  return (
    <View style={styles.timelineRow}>
      {!isLast && <View style={[styles.connector, { backgroundColor: colors.border }]} />}
      <View style={[styles.dot, { backgroundColor: dotBg, borderColor: dotBorder }]} />
      <Pressable onPress={onPress} style={[styles.evCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <View style={styles.evMeta}>
          <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>
            {formatDateBR(ev.dtEvento)}
          </Text>
          <KChip tone={isTele ? 'ocean' : 'sage'}>{isTele ? 'Telemedicina' : 'Presencial'}</KChip>
        </View>
        {ev.nmVeterinario && (
          <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{ev.nmVeterinario}</Text>
        )}
        {ev.nrCRMV && (
          <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>CRMV {ev.nrCRMV}</Text>
        )}
        <Text numberOfLines={2} style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, marginTop: 4 }}>
          {ev.dsResumoPublico}
        </Text>
        <Text style={{ fontFamily: fonts.mono, color: colors.primary, fontSize: 10, letterSpacing: 0.8, marginTop: 6 }}>
          VER PRONTUÁRIO →
        </Text>
      </Pressable>
    </View>
  );
}

function ConsultaDetail({ petId, idEvento, onBack }: { petId: number; idEvento: number; onBack: () => void }) {
  const { colors, fonts, fontSize } = useTheme();
  const { data: ev } = usePetTimelineEvent(petId, idEvento);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.detailHdr}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Voltar">
          <KIcon name="back" size={18} color={colors.text} />
        </Pressable>
        <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1 }}>
          {`PRONTUÁRIO · #CONS-${idEvento}`}
        </Text>
        <Pressable onPress={() => Share.share({ message: `Prontuário #CONS-${idEvento}` })} accessibilityRole="button">
          <KIcon name="share" size={18} color={colors.textSoft} />
        </Pressable>
      </View>

      {ev ? (
        <View style={{ gap: 0, paddingTop: 16 }}>
          {ev.dsPlano && (
            <ConsultaSection title="Anamnese" tone="sage">
              <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, lineHeight: 20 }}>
                {ev.dsResumoPublico ?? '—'}
              </Text>
            </ConsultaSection>
          )}
          <ConsultaSection title="Exame físico" tone="ocean">
            <View style={styles.vitaisGrid}>
              {[
                { l: 'PESO', v: ev.nrPesoKg          ? `${ev.nrPesoKg} kg`          : '—' },
                { l: 'TEMP', v: ev.nrTemperaturaC     ? `${ev.nrTemperaturaC}°C`     : '—' },
                { l: 'FC',   v: ev.nrFreqCardiacaBpm  ? `${ev.nrFreqCardiacaBpm} bpm` : '—' },
              ].map(v => (
                <View key={v.l} style={[styles.vitalBox, { backgroundColor: colors.surface2 }]}>
                  <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>{v.l}</Text>
                  <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 22 }}>{v.v}</Text>
                </View>
              ))}
            </View>
          </ConsultaSection>
          {ev.dsDiagnostico && (
            <ConsultaSection title="Diagnóstico" tone="amber">
              <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{ev.dsDiagnostico}</Text>
              {ev.dsCID10Vet && <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>{ev.dsCID10Vet}</Text>}
            </ConsultaSection>
          )}
          {ev.prescricoes && ev.prescricoes.length > 0 && (
            <ConsultaSection title="Prescrição" tone="ocean">
              {ev.prescricoes.map((p, i) => (
                <View key={i} style={[styles.rxRow, { borderLeftColor: colors.ocean }]}>
                  <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.sm }}>{p.nmMedicamento}</Text>
                  <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs }}>{p.dsPosologia}</Text>
                  {p.nrDuracaoDias && <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>{p.nrDuracaoDias} dias</Text>}
                </View>
              ))}
            </ConsultaSection>
          )}
          {ev.dtRetornoAgendado && (
            <ConsultaSection title="Retorno agendado" tone="sage">
              <View style={[styles.retornoChip, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontFamily: fonts.bodyMedium, color: colors.primary, fontSize: fontSize.sm }}>{formatDateBR(ev.dtRetornoAgendado)}</Text>
              </View>
              {ev.dsRetornoInstrucao && <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, marginTop: 8 }}>{ev.dsRetornoInstrucao}</Text>}
            </ConsultaSection>
          )}
          <KButton variant="primary" block onPress={() => Share.share({ message: `Prontuário #CONS-${idEvento}` })}>
            Compartilhar prontuário (PDF)
          </KButton>
        </View>
      ) : (
        <Text style={{ fontFamily: fonts.body, color: colors.textMute, padding: 20 }}>Carregando...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterRow:   { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterPill:  { paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: 9999, borderWidth: 1 },
  filterLabel: {},
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  connector:   { position: 'absolute', left: 7, top: 32, bottom: -12, width: 1 },
  dot:         { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, marginTop: 6 },
  evCard:      { flex: 1, borderWidth: 1, padding: 14, marginBottom: 14 },
  evMeta:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  detailHdr:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 },
  vitaisGrid:  { flexDirection: 'row', gap: 10 },
  vitalBox:    { flex: 1, alignItems: 'center', padding: 14, borderRadius: 10, gap: 4 },
  rxRow:       { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 10, gap: 2 },
  retornoChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start' },
});
