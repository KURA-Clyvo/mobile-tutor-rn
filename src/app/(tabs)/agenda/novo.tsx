import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KButton }    from '@components/primitives/KButton';
import { KPetPortrait, racaToPalette } from '@components/primitives/KPetPortrait';
import { KIcon }      from '@components/primitives/KIcon';
import { usePets }    from '../../../hooks/usePets';
import { useSolicitarAgendamento } from '../../../hooks/useAgendamentos';
import { addDays, formatDateBR } from '../../../utils/date';
import type { SolicitarAgendamentoRequest } from '../../../types/api';

type TipoConsulta = 'RETORNO' | 'ROTINA' | 'URGENCIA' | 'TELEORIENTACAO';

const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
const DIAS_SEMANA = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
const INDISPONIVEIS = new Set(['10:00','11:30','14:00','16:30']);

export default function NovoAgendamentoScreen() {
  const { colors, fonts, fontSize, radius } = useTheme();
  const router  = useRouter();
  const { idPet: idPetParam, tipo: tipoParam } = useLocalSearchParams<{ idPet?: string; tipo?: string }>();

  const { data: pets = [] } = usePets();
  const { mutateAsync: solicitar, isPending } = useSolicitarAgendamento();

  const [selectedPetId, setSelectedPetId] = useState<number>(idPetParam ? parseInt(idPetParam, 10) : (pets[0]?.id ?? 0));
  const [tipo,          setTipo]          = useState<TipoConsulta>((tipoParam as TipoConsulta) ?? 'ROTINA');
  const [selectedDay,   setSelectedDay]   = useState(0);
  const [selectedSlot,  setSelectedSlot]  = useState<string | null>(null);
  const [motivo,        setMotivo]        = useState('');

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days  = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const selectedPet = pets.find(p => p.id === selectedPetId);

  const dtPreferida = useMemo(() => {
    if (!selectedSlot) return null;
    const d = new Date(days[selectedDay]!);
    const [h, m] = selectedSlot.split(':').map(Number);
    d.setHours(h!, m!);
    return d.toISOString();
  }, [selectedDay, selectedSlot, days]);

  const handleSubmit = async () => {
    if (!selectedPet || !selectedSlot || !dtPreferida) {
      Alert.alert('Atenção', 'Selecione o pet, uma data e um horário.');
      return;
    }
    if (!motivo.trim()) {
      Alert.alert('Atenção', 'Descreva o motivo da consulta.');
      return;
    }
    const req: SolicitarAgendamentoRequest = {
      idPet:          selectedPet.id,
      sgTipoConsulta: tipo,
      dsMotivo:       motivo,
      dtPreferida,
    };
    try {
      await solicitar(req);
      Alert.alert('Solicitação enviada!', 'A clínica confirmará em até 24h.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível solicitar. Tente novamente.');
    }
  };

  const TIPOS: { key: TipoConsulta; label: string; sub: string }[] = [
    { key: 'ROTINA',         label: 'Presencial',   sub: 'Consulta na clínica' },
    { key: 'TELEORIENTACAO', label: 'Telemedicina', sub: 'Orientação online'   },
  ];

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="button">
          <KIcon name="close" size={18} color={colors.text} />
        </Pressable>
        <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1.2 }}>
          PASSO 2 DE 3
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 30, lineHeight: 36, marginBottom: 20 }}>
          {'Agendar para '}
          <Text style={{ fontStyle: 'italic', color: colors.primary }}>{selectedPet?.nome ?? '…'}.</Text>
        </Text>

        {/* Pet card */}
        {selectedPet && (
          <View style={[styles.petCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <KPetPortrait palette={racaToPalette(selectedPet.raca)} size={40} especie={selectedPet.especie} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{selectedPet.nome}</Text>
              <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }}>{selectedPet.raca} · {selectedPet.idadeAnos}a</Text>
            </View>
          </View>
        )}

        {/* Tipo */}
        <Text style={[styles.sectionLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>TIPO DE ATENDIMENTO</Text>
        <View style={styles.tipoGrid}>
          {TIPOS.map(t => {
            const active = tipo === t.key;
            const isTele = t.key === 'TELEORIENTACAO';
            return (
              <Pressable
                key={t.key}
                onPress={() => setTipo(t.key)}
                style={[styles.tipoCell, {
                  backgroundColor: active ? (isTele ? colors.oceanPale : colors.primarySoft) : colors.surface,
                  borderColor:     active ? (isTele ? colors.ocean     : colors.primary)     : colors.border,
                  borderRadius: radius.lg,
                }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <KIcon name={isTele ? 'saude' : 'pets'} size={22} color={active ? (isTele ? colors.ocean : colors.primary) : colors.textMute} />
                <Text style={{ fontFamily: fonts.bodyMedium, color: active ? (isTele ? colors.ocean : colors.primary) : colors.text, fontSize: fontSize.sm }}>{t.label}</Text>
                <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }}>{t.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Calendário horizontal 7 dias */}
        <Text style={[styles.sectionLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>DATA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calRow}>
          {days.map((day, i) => {
            const active  = selectedDay === i;
            const isToday = i === 0;
            return (
              <Pressable
                key={i}
                onPress={() => { setSelectedDay(i); setSelectedSlot(null); }}
                style={[styles.dayCell, {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor:     active ? colors.primary : isToday ? colors.primary : colors.border,
                  borderWidth:     isToday && !active ? 1.5 : 1,
                  borderRadius: radius.md,
                }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: active ? colors.textOnPrimary : colors.textMute, letterSpacing: 0.8 }}>
                  {DIAS_SEMANA[day.getDay()]}
                </Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 22, color: active ? colors.textOnPrimary : colors.text }}>
                  {day.getDate()}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: active ? colors.textOnPrimary : colors.textMute }}>
                  {day.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Slots grid 4 colunas */}
        <Text style={[styles.sectionLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>HORÁRIO</Text>
        <View style={styles.slotsGrid}>
          {SLOTS.map(slot => {
            const unavailable = INDISPONIVEIS.has(slot);
            const active      = selectedSlot === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => { if (!unavailable) setSelectedSlot(slot); }}
                disabled={unavailable}
                style={[styles.slotCell, {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor:     active ? colors.primary : colors.border,
                  borderRadius: radius.full,
                  opacity: unavailable ? 0.4 : 1,
                }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled: unavailable }}
              >
                <Text style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSize.xs,
                  color: active ? colors.textOnPrimary : colors.text,
                  textDecorationLine: unavailable ? 'line-through' : 'none',
                }}>
                  {slot}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Motivo */}
        <Text style={[styles.sectionLabel, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>MOTIVO</Text>
        <TextInput
          value={motivo}
          onChangeText={setMotivo}
          multiline
          textAlignVertical="top"
          placeholder="Descreva o motivo da consulta..."
          placeholderTextColor={colors.textMute}
          style={[styles.motivoInput, { fontFamily: fonts.body, color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.md, fontSize: fontSize.sm }]}
          accessibilityLabel="Motivo da consulta"
        />

        {/* Card de resumo */}
        {selectedPet && selectedSlot && (
          <View style={[styles.resumoCard, { backgroundColor: colors.primarySoft, borderRadius: 14, borderColor: colors.primary }]}>
            <Text style={{ fontFamily: fonts.mono, color: colors.primary, fontSize: fontSize.xs, letterSpacing: 1.2, marginBottom: 8 }}>RESUMO</Text>
            {[
              { label: 'PET',     value: selectedPet.nome },
              { label: 'DATA',    value: formatDateBR(days[selectedDay]!.toISOString()) },
              { label: 'HORÁRIO', value: selectedSlot },
              { label: 'TIPO',    value: tipo === 'TELEORIENTACAO' ? 'Telemedicina' : 'Presencial' },
              { label: 'CLÍNICA', value: selectedPet.nmClinica },
            ].map(r => (
              <View key={r.label} style={styles.resumoRow}>
                <Text style={{ fontFamily: fonts.mono, color: colors.primary, fontSize: 10, letterSpacing: 0.8, width: 72 }}>{r.label}</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.sm, flex: 1 }}>{r.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <KButton variant="primary" block loading={isPending} onPress={handleSubmit} style={{ marginTop: 12 }}>
          Confirmar agendamento
        </KButton>

        <Text style={[styles.nota, { fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }]}>
          A clínica confirmará o agendamento em até 24h.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  circle:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:      { padding: 20, paddingBottom: 40 },
  sectionLabel:{ letterSpacing: 1.2, marginTop: 20, marginBottom: 10 },
  petCard:     { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, gap: 12, marginBottom: 8 },
  tipoGrid:    { flexDirection: 'row', gap: 10 },
  tipoCell:    { flex: 1, alignItems: 'center', padding: 14, borderWidth: 1, gap: 6 },
  calRow:      { gap: 8, paddingVertical: 4 },
  dayCell:     { width: 56, height: 78, alignItems: 'center', justifyContent: 'center', gap: 2 },
  slotsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotCell:    { width: '22%', paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  motivoInput: { padding: 14, borderWidth: 1, minHeight: 90, marginBottom: 8 },
  resumoCard:  { padding: 16, borderWidth: 1, marginTop: 8 },
  resumoRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  nota:        { textAlign: 'center', marginTop: 12, lineHeight: 18 },
});
