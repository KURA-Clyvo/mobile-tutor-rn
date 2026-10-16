import React, { useState, useRef } from 'react';
import { View, Text, Switch, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { KIcon }   from '@components/primitives/KIcon';
import { KChip }   from '@components/primitives/KChip';
import { KButton } from '@components/primitives/KButton';
import { KCard }   from '@components/primitives/KCard';
import { useDialog } from '@components/primitives/KDialog';
import { confirmar } from '@components/feedback/confirmar';
import { useToast } from '@components/feedback/Toast';
import { QueryState } from '@components/feedback/QueryState';
import { Skeleton } from '@components/feedback/Skeleton';
import { useConsentimentos, useAssinar, useRevogar } from '../../../hooks/useConsentimentos';
import { useVoltar } from '../../../hooks/useVoltar';
import { LGPD_CONSENTIMENTOS, type TipoConsentimento } from '../../../constants/lgpd';
import type { ConsentimentoResponse } from '../../../types/api';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// TASK-73 (FIX_7): 5 tipos reais (enum Java TipoConsentimento), não mais os 3
// inventados que não existiam no backend (ver constants/lgpd.ts).
const TIPOS: TipoConsentimento[] = ['TELEORIENTACAO', 'LEMBRETES', 'DADOS_ANONIMOS', 'COMPARTILHAR_SEGURADORA', 'MARKETING'];

// BR-TUT-T05: o diálogo de revogar diz o que muda para o tutor (a consequência), não repete o texto do termo.
const CONSEQUENCIA_REVOGAR: Record<TipoConsentimento, string> = {
  TELEORIENTACAO:          'Você deixa de poder fazer teleorientação por vídeo com a clínica.',
  LEMBRETES:               'Você deixa de receber lembretes de vacina, consultas e comunicados da clínica.',
  DADOS_ANONIMOS:          'Seus dados deixam de ser usados de forma anonimizada.',
  COMPARTILHAR_SEGURADORA: 'Seus dados deixam de ser compartilhados com a seguradora.',
  MARKETING:               'Você deixa de receber ofertas e novidades.',
};

export default function ConsentimentosScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  // TASK-F02: tela alcançável via link direto do perfil/deep link; sem
  // histórico, o back() antigo não fazia nada (sem feedback pro usuário,
  // ver useVoltar.ts) — agora cai na aba pai.
  const voltar = useVoltar('/(tabs)/perfil');
  const { alerta } = useDialog();
  const toast = useToast();
  const consentimentosQuery = useConsentimentos();
  const lista = consentimentosQuery.data ?? [];
  const { mutateAsync: assinar,  isPending: assinando } = useAssinar();
  const { mutateAsync: revogar,  isPending: revogando } = useRevogar();

  const [modalTipo,    setModalTipo]    = useState<TipoConsentimento | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const getStatus = (tipo: TipoConsentimento): ConsentimentoResponse | undefined =>
    lista.find(c => c.tipo === tipo);

  // BR-TUT-T05 (m3): trava síncrona para revogar (diálogo + chamada) e assinar; `isPending`/`disabled` só valem após o re-render.
  const emVoo = useRef(false);

  const handleSwitch = async (tipo: TipoConsentimento, currentlyActive: boolean) => {
    if (emVoo.current) return;
    if (currentlyActive) {
      emVoo.current = true;
      try {
        await revogarComConfirmacao(tipo);
      } finally {
        emVoo.current = false;
      }
    } else {
      setModalTipo(tipo);
    }
  };

  const revogarComConfirmacao = async (tipo: TipoConsentimento) => {
    const c = getStatus(tipo);
    if (!c) return;
    // LGPD — a confirmação é obrigatória: `revogar(...)` só roda com `confirmado === true`; dispensar o
    // diálogo (voltar do Android, toque fora) resolve false.
    const confirmado = await confirmar({
      titulo:     'Revogar consentimento?',
      mensagem:   `${CONSEQUENCIA_REVOGAR[tipo]} Você pode aceitar de novo quando quiser.`,
      verbo:      'Revogar consentimento',
      destrutivo: true,
    });
    if (!confirmado) return;
    // BR-TUT-T05 (F5-M3): o toast só afirma sucesso DEPOIS da resposta do servidor; falha vira toast de erro.
    try {
      await revogar({ tipo, key: generateUUID() });
      toast.show({ tipo: 'sucesso', texto: 'Consentimento revogado' });
    } catch {
      toast.show({ tipo: 'erro', texto: 'Não foi possível revogar o consentimento. Tente novamente.' });
    }
  };

  const handleAceitar = async () => {
    if (!modalTipo || emVoo.current) return;
    emVoo.current = true;
    setModalLoading(true);
    try {
      await assinar({
        tipo: modalTipo,
        key: generateUUID(), // Idempotency-Key: unique per action
      });
      setModalTipo(null);
      toast.show({ tipo: 'sucesso', texto: 'Consentimento registrado' });
    } catch {
      // `void` de propósito (TASK-F06): o `finally` desliga o spinner do modal e não espera o diálogo. Fica
      // diálogo e não toast porque o modal da tela está aberto e cobriria o toast (BR-TUT-T05).
      void alerta('Erro', 'Não foi possível registrar o consentimento. Tente novamente.');
    } finally {
      emVoo.current = false;
      setModalLoading(false);
    }
  };

  const chipForStatus = (tipo: TipoConsentimento) => {
    const c = getStatus(tipo);
    if (!c)        return { tone: 'amber' as const, label: 'Pendente'  };
    if (c.ativo)   return { tone: 'sage'  as const, label: 'Ativo'     };
    return              { tone: 'clay'  as const, label: 'Revogado' };
  };

  return (
    <>
      <ScrollView style={[styles.flex, { backgroundColor: colors.bg }]} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => voltar()} style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={8} accessibilityRole="button" accessibilityLabel="Voltar">
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

        {/* BR-TUT-T03: sem a lista vinda do servidor NÃO se sabe o que o tutor aceitou — carregando => skeleton; erro =>
            ErrorState; erro com lista salva => lista + faixa. "Pendente" só aparece com a lista na mão. Lista vazia é dado
            (nada registrado ainda), não "vazio" a esconder. */}
        <QueryState
          query={consentimentosQuery}
          isEmpty={() => false}
          empty={null}
          skeleton={<Skeleton variant="card" count={3} />}
          errorTitle="Não consegui carregar os seus consentimentos"
        >
          {() => (
            <>
              {TIPOS.map(tipo => {
                const meta    = LGPD_CONSENTIMENTOS[tipo];
                const chip    = chipForStatus(tipo);
                const isAtivo = getStatus(tipo)?.ativo === true;

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
                          onValueChange={() => void handleSwitch(tipo, isAtivo)}
                          trackColor={{ false: colors.borderControl, true: colors.primary }}
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
            </>
          )}
        </QueryState>
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
                  <KIcon name="close" size={20} color={colors.textMuteInk} />
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
