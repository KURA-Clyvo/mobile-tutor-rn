import React, { useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, Modal, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KIcon }   from '@components/primitives/KIcon';
import { KChip }   from '@components/primitives/KChip';
import { KButton } from '@components/primitives/KButton';
import { KCard }   from '@components/primitives/KCard';
import { useConsentimentos, useAssinar, useRevogar } from '../../../hooks/useConsentimentos';
import { LGPD_CONSENTIMENTOS, type TipoConsentimento } from '../../../constants/lgpd';
import type { ConsentimentoResponse } from '../../../types/api';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const TIPOS: TipoConsentimento[] = ['COMUNICACAO_WHATSAPP', 'DADOS_CLINICOS_IA', 'COMPARTILHAMENTO_LABORATORIO'];

export default function ConsentimentosScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: lista = [] }                          = useConsentimentos();
  const { mutateAsync: assinar,  isPending: assinando } = useAssinar();
  const { mutateAsync: revogar,  isPending: revogando } = useRevogar();

  const [modalTipo,    setModalTipo]    = useState<TipoConsentimento | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const getStatus = (tipo: TipoConsentimento): ConsentimentoResponse | undefined =>
    lista.find(c => c.dsTipoConsentimento === tipo);

  const handleSwitch = (tipo: TipoConsentimento, currentlyActive: boolean) => {
    if (currentlyActive) {
      const c = getStatus(tipo);
      if (!c) return;
      Alert.alert(
        'Revogar consentimento?',
        LGPD_CONSENTIMENTOS[tipo].resumo,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Revogar', style: 'destructive', onPress: () => revogar(c.id) },
        ]
      );
    } else {
      setModalTipo(tipo);
    }
  };

  const handleAceitar = async () => {
    if (!modalTipo) return;
    setModalLoading(true);
    try {
      await assinar({
        req: {
          dsTipoConsentimento: modalTipo,
          dsAceite: 'SIM', // STRING — never boolean
        },
        key: generateUUID(), // Idempotency-Key: unique per action
      });
      setModalTipo(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o consentimento. Tente novamente.');
    } finally {
      setModalLoading(false);
    }
  };

  const chipForStatus = (tipo: TipoConsentimento) => {
    const c = getStatus(tipo);
    if (!c)                     return { tone: 'amber' as const, label: 'Pendente'  };
    if (c.sgStatus === 'ATIVO') return { tone: 'sage'  as const, label: 'Ativo'     };
    return                           { tone: 'clay'  as const, label: 'Revogado' };
  };

  return (
    <>
      <ScrollView style={[styles.flex, { backgroundColor: colors.bg }]} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={8} accessibilityRole="button" accessibilityLabel="Voltar">
            <KIcon name="back" size={18} color={colors.text} />
          </Pressable>
        </View>

        <Text style={{ fontFamily: fonts.mono, color: colors.primary, fontSize: fontSize.xs, letterSpacing: 1.2, marginBottom: 4 }}>LGPD</Text>
        <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 32, lineHeight: 38, marginBottom: 8 }}>
          {'Seus '}
          <Text style={{ fontStyle: 'italic', color: colors.primary }}>consentimentos.</Text>
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, marginBottom: 24, lineHeight: 20 }}>
          Você controla como seus dados são usados. Pode revogar a qualquer momento.
        </Text>

        {TIPOS.map(tipo => {
          const meta    = LGPD_CONSENTIMENTOS[tipo];
          const chip    = chipForStatus(tipo);
          const isAtivo = getStatus(tipo)?.sgStatus === 'ATIVO';

          return (
            <KCard key={tipo} style={styles.consentCard}>
              <View style={styles.consentTop}>
                <View style={styles.consentInfo}>
                  <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{meta.titulo}</Text>
                  <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs, marginTop: 4, lineHeight: 18 }}>{meta.resumo}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <KChip tone={chip.tone}>{chip.label}</KChip>
                  <Switch
                    value={isAtivo}
                    onValueChange={() => handleSwitch(tipo, isAtivo)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                    disabled={assinando || revogando}
                    accessibilityLabel={`Consentimento ${meta.titulo}`}
                  />
                </View>
              </View>
              <Pressable
                onPress={() => setModalTipo(tipo)}
                hitSlop={8}
                style={{ minHeight: 44, justifyContent: 'center', marginTop: 6 }}
                accessibilityRole="button"
              >
                <Text style={{ fontFamily: fonts.mono, color: colors.primary, fontSize: fontSize.xs, letterSpacing: 0.8 }}>
                  VER TEXTO COMPLETO →
                </Text>
              </Pressable>
            </KCard>
          );
        })}
      </ScrollView>

      {/* Consent modal */}
      <Modal
        visible={!!modalTipo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !modalLoading && setModalTipo(null)}
      >
        {modalTipo && (
          <View style={[styles.flex, { backgroundColor: colors.bg }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md, flex: 1 }}>
                {LGPD_CONSENTIMENTOS[modalTipo].titulo}
              </Text>
              {!modalLoading && (
                <Pressable onPress={() => setModalTipo(null)} accessibilityRole="button" accessibilityLabel="Fechar">
                  <KIcon name="close" size={20} color={colors.textMute} />
                </Pressable>
              )}
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, lineHeight: 22 }}>
                {LGPD_CONSENTIMENTOS[modalTipo].textoCompleto}
              </Text>
            </ScrollView>
            <View style={[styles.modalFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <KButton variant="ghost" onPress={() => setModalTipo(null)} disabled={modalLoading}>
                Cancelar
              </KButton>
              <KButton variant="primary" loading={modalLoading} onPress={handleAceitar} style={{ flex: 1 }}>
                Aceitar
              </KButton>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  scroll:      { padding: 20, paddingBottom: 40 },
  headerRow:   { marginBottom: 20 },
  circle:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  consentCard: { marginBottom: 14 },
  consentTop:  { flexDirection: 'row', gap: 12 },
  consentInfo: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  modalScroll: { padding: 20 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
});
