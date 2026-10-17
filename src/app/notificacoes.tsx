import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KIcon } from '@components/primitives/KIcon';
import { KChip } from '@components/primitives/KChip';
import { QueryState } from '@components/feedback/QueryState';
import { Skeleton } from '@components/feedback/Skeleton';
import { useNotifications, useMarcarLida, useMarcarTodasLidas } from '../hooks/useNotifications';
import { useVoltar } from '../hooks/useVoltar';
import type { NotificacaoTutorResponse } from '../types/api';
import { touchTarget } from '@theme/tokens';
import { formatQuandoBR } from '../utils/date';

// BR-TUT-T10: só LEMBRETE_VACINA tem produtor medido; o resto é "Aviso" neutro (sem link, sem navegação).
const TIPO_CHIP: Record<NotificacaoTutorResponse['dsTipo'], { tone: 'amber' | 'mute'; label: string; icon: 'vaccine' | 'bell' }> = {
  LEMBRETE_VACINA: { tone: 'amber', label: 'Vacina', icon: 'vaccine' },
  AVISO:           { tone: 'mute',  label: 'Aviso',  icon: 'bell'    },
};

export default function NotificacoesScreen() {
  const { colors, fonts, fontSize, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // TASK-F02: alcançável por toque em notificação push
  // (notifications.service.ts:93-95), sem histórico de navegação.
  const voltar = useVoltar('/(tabs)/pets');
  const notifQuery                                = useNotifications();
  const { mutate: marcarLida }                    = useMarcarLida();
  const { mutate: marcarTodas, isPending: markingAll } = useMarcarTodasLidas();

  const naoLidas = (notifQuery.data ?? []).filter(n => !n.flLida).length;

  const handleTap = (n: NotificacaoTutorResponse) => {
    if (!n.flLida) marcarLida(n.id);
    if (n.dsTipo !== 'LEMBRETE_VACINA') return;
    router.push((n.idPet ? `/(tabs)/pets/${n.idPet}` : '/(tabs)/saude') as any);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => voltar()}
          style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <KIcon name="back" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }]}>
          Notificações {naoLidas > 0 ? `(${naoLidas})` : ''}
        </Text>
        <Pressable
          onPress={() => marcarTodas()}
          disabled={markingAll || naoLidas === 0}
          hitSlop={8}
          style={{ minHeight: touchTarget.min, minWidth: touchTarget.min, justifyContent: 'center', flexShrink: 1 }}
          accessibilityRole="button"
          accessibilityLabel="Marcar todas como lidas"
        >
          <Text style={{ fontFamily: fonts.mono, fontSize: fontSize.xs, letterSpacing: 0.8, color: naoLidas > 0 ? colors.primary : colors.textMuteInk }}>
            LER TODAS
          </Text>
        </Pressable>
      </View>

      <QueryState
        query={notifQuery}
        skeleton={<View style={styles.list}><Skeleton variant="list" count={4} /></View>}
        errorTitle="Não consegui carregar as notificações"
        faixaStyle={styles.faixa}
        empty={
          <View style={styles.empty}>
            <KIcon name="bell" size={32} color={colors.textMuteInk} />
            <Text style={{ fontFamily: fonts.body, color: colors.textMuteInk, fontSize: fontSize.sm }}>
              Nenhuma notificação ainda.
            </Text>
          </View>
        }
      >
        {notifs => (
          <FlatList
            data={[...notifs].sort((a, b) => new Date(b.dtEnvio).getTime() - new Date(a.dtEnvio).getTime())}
            keyExtractor={n => String(n.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item: n }) => {
              const chip = TIPO_CHIP[n.dsTipo];
              const vacina = n.dsTipo === 'LEMBRETE_VACINA';
              // Não lido: o cartão é surface2 e, no escuro, surface2 == border — o contorno do chip "Aviso" e o anel do sino
              // sumiam. borderControl (2.99:1 no escuro) não passa 3:1; textMuteInk passa nos 2 temas.
              const contorno = !n.flLida ? colors.textMuteInk : colors.border;
              return (
                <Pressable
                  onPress={() => handleTap(n)}
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: n.flLida ? colors.surface : colors.surface2, borderColor: colors.border, borderRadius: radius.lg },
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${n.flLida ? 'Lida' : 'Não lida'}: ${n.dsTitulo}. ${n.dsMensagem}. ${formatQuandoBR(n.dtEnvio)}${vacina ? '. Ver saúde' : ''}`}
                >
                  {!n.flLida && <View style={[styles.unreadDot, { backgroundColor: colors.clay }]} />}
                  <View style={[styles.ico, vacina ? { backgroundColor: colors.amberPale } : { borderWidth: 1, borderColor: contorno }]}>
                    <KIcon name={chip.icon} size={18} color={vacina ? colors.amberInk : colors.textSoft} />
                  </View>
                  <View style={styles.itemContent}>
                    <View style={styles.itemTop}>
                      <KChip tone={chip.tone} borderColor={vacina ? undefined : contorno}>{chip.label}</KChip>
                      <Text style={{ fontFamily: fonts.mono, color: n.flLida ? colors.textMuteInk : colors.textSoft, fontSize: 10 }}>
                        {formatQuandoBR(n.dtEnvio)}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.sm, marginTop: 6 }}>
                      {n.dsTitulo}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs, lineHeight: 18, marginTop: 2 }}>
                      {n.dsMensagem}
                    </Text>
                    {vacina && (
                      <Text style={{ fontFamily: fonts.mono, color: colors.primary, fontSize: 10, letterSpacing: 0.8, marginTop: 6 }}>
                        VER SAÚDE →
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </QueryState>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  circle:      { width: touchTarget.min, height: touchTarget.min, borderRadius: touchTarget.min / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, minWidth: 0, paddingHorizontal: 12 }, // minWidth 0: no maior tamanho de fonte o título quebra linha em vez de empurrar "Ler todas" para fora da tela
  list:        { padding: 16, paddingBottom: 40 },
  faixa:       { marginHorizontal: 16, marginTop: 12 },
  item:        { minHeight: touchTarget.min, minWidth: touchTarget.min, flexDirection: 'row', padding: 14, borderWidth: 1, marginBottom: 10, gap: 10 },
  unreadDot:   { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  ico:         { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1 },
  itemTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty:       { alignItems: 'center', paddingTop: 60, gap: 12 },
});
