import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { KIcon }   from '@components/primitives/KIcon';
import { KButton } from '@components/primitives/KButton';
import { KChip } from '@components/primitives/KChip';
import { useDialog } from '@components/primitives/KDialog';
import { confirmar } from '@components/feedback/confirmar';
import { useToast } from '@components/feedback/Toast';
import { QueryState } from '@components/feedback/QueryState';
import { Skeleton } from '@components/feedback/Skeleton';
import { useConsentimentos, useAssinar, useRevogar } from '../../../hooks/useConsentimentos';
import { useVoltar } from '../../../hooks/useVoltar';
import { LGPD_CONSENTIMENTOS, TIPOS_OPCIONAIS, CONSEQUENCIA_REVOGAR, type TipoOpcional } from '../../../constants/lgpd';
import type { ConsentimentoResponse, TipoConsentimentoApi } from '../../../types/api';
import { touchTarget } from '@theme/tokens';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// BR-TUT-T08 (T2): 4 opcionais em linhas (Revogar/Autorizar); LEMBRETES é o 5º tipo do enum Java e fica no aviso
// "Necessário para o serviço", sem botão. A consequência de cada revogação mora em constants/lgpd.ts (m9).

// "Autorizado hoje" / "Autorizado em 01/10/2026" — dtAceite vem sem fuso do Java (LocalDateTime): é lido como horário local.
const ddmmaaaa = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const ehHoje = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

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

  const [modalTipo,    setModalTipo]    = useState<TipoOpcional | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const getStatus = (tipo: TipoConsentimentoApi): ConsentimentoResponse | undefined =>
    lista.find(c => c.tipo === tipo);

  // BR-TUT-T05 (m3): trava síncrona para revogar (diálogo + chamada) e assinar; `isPending`/`disabled` só valem após o re-render.
  const emVoo = useRef(false);

  const handleToggle = async (tipo: TipoOpcional, currentlyActive: boolean) => {
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

  const revogarComConfirmacao = async (tipo: TipoOpcional) => {
    const c = getStatus(tipo);
    if (!c) return;
    // LGPD — a confirmação é obrigatória: `revogar(...)` só roda com `confirmado === true`; dispensar o
    // diálogo (voltar do Android, toque fora) resolve false.
    const confirmado = await confirmar({
      titulo:     'Revogar consentimento?',
      mensagem:   `${CONSEQUENCIA_REVOGAR[tipo]} Você pode autorizar de novo quando quiser.`,
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

  // BR-TUT-T08 (G2 I-1): a caixa "Necessário" mostra o estado do SERVIDOR. Sem registro ativo de LEMBRETES o .NET não envia
  // lembrete (LunaService.cs:414-416); o tutor religa aqui, sem botão de revogar (decisão T2).
  const lembretes = getStatus('LEMBRETES');
  const lembretesAtivo = !!lembretes?.ativo;
  const handleLigarLembretes = async () => {
    if (emVoo.current) return;
    emVoo.current = true;
    try {
      await assinar({ tipo: 'LEMBRETES', key: generateUUID() });
      toast.show({ tipo: 'sucesso', texto: 'Lembretes ligados' });
    } catch {
      toast.show({ tipo: 'erro', texto: 'Não foi possível ligar os lembretes. Tente novamente.' });
    } finally {
      emVoo.current = false;
    }
  };

  // Estado em texto (canvas v13): nunca só cor. Sem registro no servidor = "Não autorizado".
  const modalAtivo = !!modalTipo && !!getStatus(modalTipo)?.ativo;
  const statusDe = (tipo: TipoOpcional): { texto: string; ativo: boolean; revogado?: boolean } => {
    const c = getStatus(tipo);
    if (!c)      return { texto: 'Não autorizado', ativo: false };
    if (c.ativo) return { texto: ehHoje(c.dtAceite) ? 'Autorizado hoje' : `Autorizado em ${ddmmaaaa(c.dtAceite)}`, ativo: true };
    return c.dtRevogacao
      ? { texto: `Revogado em ${ddmmaaaa(c.dtRevogacao)}`, ativo: false, revogado: true }
      : { texto: 'Não autorizado', ativo: false };
  };

  return (
    <>
      <ScrollView style={[styles.flex, { backgroundColor: colors.bg }]} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => voltar()} style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={8} accessibilityRole="button" accessibilityLabel="Voltar">
            <KIcon name="back" size={18} color={colors.text} />
          </Pressable>
        </View>

        <Text style={{ fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs, letterSpacing: 1.8, marginBottom: 8 }}>PRIVACIDADE</Text>
        <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 32, lineHeight: 35, marginBottom: 18 }}>
          {'O que você autorizou. '}
          <Text style={{ fontFamily: fonts.displayItalic, color: colors.primary }}>Pode mudar quando quiser.</Text>
        </Text>

        {/* BR-TUT-T03: sem a lista vinda do servidor NÃO se sabe o que o tutor aceitou — carregando => skeleton; erro =>
            ErrorState; erro com lista salva => lista + faixa. "Não autorizado" só aparece com a lista na mão. Lista vazia é
            dado (nada registrado ainda), não "vazio" a esconder. */}
        <QueryState
          query={consentimentosQuery}
          isEmpty={() => false}
          empty={null}
          skeleton={<Skeleton variant="card" count={3} />}
          errorTitle="Não consegui carregar os seus consentimentos"
        >
          {() => (
            <>
              <View>
                {TIPOS_OPCIONAIS.map((tipo, i) => {
                  const meta   = LGPD_CONSENTIMENTOS[tipo];
                  const status = statusDe(tipo);
                  return (
                    <View
                      key={tipo}
                      style={[styles.row, { borderTopColor: colors.border }, i === TIPOS_OPCIONAIS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    >
                      <View style={styles.consentInfo}>
                        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{meta.titulo}</Text>
                        {/* BR-TUT-16: revogado é estado neutro (chip mute), não urgência — `clay` fica para urgência. */}
                        {status.revogado
                          ? <KChip tone="mute">{status.texto}</KChip>
                          : <Text style={{ fontFamily: fonts.body, color: status.ativo ? colors.primary : colors.textSoft, fontSize: fontSize.sm }}>{status.texto}</Text>}
                        <Pressable
                          onPress={() => setModalTipo(tipo)}
                          hitSlop={8}
                          style={styles.verTexto}
                          accessibilityRole="button"
                          accessibilityLabel={`Ver texto completo: ${meta.titulo}`}
                        >
                          <Text style={{ fontFamily: fonts.mono, color: colors.primary, fontSize: fontSize.xs, letterSpacing: 0.8 }}>VER TEXTO COMPLETO →</Text>
                        </Pressable>
                      </View>
                      <KButton
                        variant={status.ativo ? 'secondary' : 'primary'}
                        size="sm"
                        style={styles.acao}
                        disabled={assinando || revogando}
                        onPress={() => void handleToggle(tipo, status.ativo)}
                        accessibilityLabel={`${status.ativo ? 'Revogar' : 'Autorizar'} ${meta.titulo}`}
                      >
                        {status.ativo ? 'Revogar' : 'Autorizar'}
                      </KButton>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.necessario, { backgroundColor: colors.surface2 }]}>
                <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.sm }}>Necessário para o serviço</Text>
                <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, lineHeight: 20 }}>
                  Lembretes de vacina e de horário fazem parte do atendimento da clínica que cuida dos seus pets.
                </Text>
                <Text testID="lembretes-estado" style={{ fontFamily: fonts.bodyMedium, color: lembretesAtivo ? colors.primary : colors.textSoft, fontSize: fontSize.sm }}>
                  {lembretesAtivo ? `Ativo desde ${ddmmaaaa(lembretes!.dtAceite)}` : 'Lembretes desligados'}
                </Text>
                {!lembretesAtivo && (
                  <KButton variant="primary" size="sm" style={styles.acao} disabled={assinando || revogando} onPress={() => void handleLigarLembretes()}>
                    Ligar lembretes
                  </KButton>
                )}
              </View>
              <Text style={{ fontFamily: fonts.body, color: colors.textMuteInk, fontSize: fontSize.xs, lineHeight: 18 }}>
                Cada mudança fica registrada com data e hora. Revogar não cancela consultas presenciais já marcadas.
              </Text>
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
                <Pressable onPress={() => setModalTipo(null)} style={styles.fechar} accessibilityRole="button" accessibilityLabel="Fechar">
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
              {/* G2 M-5: consentimento já ativo => só ler e fechar (aceitar de novo gravaria um aceite duplicado). */}
              <KButton variant="ghost" onPress={() => setModalTipo(null)} disabled={modalLoading} style={modalAtivo ? { flex: 1 } : undefined}>
                {modalAtivo ? 'Fechar' : 'Cancelar'}
              </KButton>
              {!modalAtivo && (
                <KButton variant="primary" loading={modalLoading} onPress={handleAceitar} style={{ flex: 1 }}>
                  Aceitar
                </KButton>
              )}
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
  circle:      { width: touchTarget.min, height: touchTarget.min, borderRadius: touchTarget.min / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1 },
  consentInfo: { flex: 1, gap: 3 },
  fechar:      { minHeight: touchTarget.min, minWidth: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  verTexto:    { minHeight: touchTarget.min, minWidth: touchTarget.min, justifyContent: 'center' },
  acao:        { minHeight: touchTarget.min, minWidth: touchTarget.min, paddingHorizontal: 16 },
  necessario:  { gap: 6, padding: 16, borderRadius: 16, marginTop: 18, marginBottom: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  modalScroll: { padding: 20 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
});
