import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { KIcon }   from '@components/primitives/KIcon';
import { useDialog } from '@components/primitives/KDialog';
import { QueryState } from '@components/feedback/QueryState';
import { Skeleton } from '@components/feedback/Skeleton';
import { AgendamentoItem } from '../../../components/domain/AgendamentoItem';
import { useAgendamentos, useCancelarAgendamento } from '../../../hooks/useAgendamentos';
import { isFuture } from '../../../utils/date';
import type { AgendamentoTutorResponse } from '../../../types/api';

export default function AgendaScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const agendaQuery = useAgendamentos();
  const { mutate: cancelar, isPending: canceling } = useCancelarAgendamento();
  const { confirmar } = useDialog();

  // TASK-F06: era um Alert nativo. A confirmação continua obrigatória —
  // `cancelar(id)` só roda quando o botão destrutivo é tocado.
  const handleCancel = async (id: number) => {
    const confirmado = await confirmar({
      titulo:     'Cancelar agendamento?',
      mensagem:   'Você pode solicitar outro agendamento depois.',
      cancelar:   'Voltar',
      confirmar:  'Cancelar agendamento',
      destrutivo: true,
    });
    if (confirmado) cancelar(id);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 32, lineHeight: 38 }}>
            {'Minha '}
            <Text style={{ fontStyle: 'italic', color: colors.primary }}>agenda.</Text>
          </Text>
        </View>
        <KButton
          variant="primary"
          size="sm"
          onPress={() => router.push('/(tabs)/agenda/novo' as any)}
          iconLeft={<KIcon name="plus" size={14} color={colors.textOnPrimary} style={{ marginRight: 4 }} />}
        >
          Solicitar
        </KButton>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={Boolean(agendaQuery.isRefetching) || canceling} onRefresh={() => void agendaQuery.refetch()} tintColor={colors.primary} />}
      >
        <QueryState
          query={agendaQuery}
          skeleton={<Skeleton variant="card" count={2} />}
          errorTitle="Não consegui carregar a sua agenda"
          empty={<EmptySection label="Você ainda não tem agendamentos. Toque em Solicitar para pedir um horário." />}
        >
          {agendamentos => <AgendaListas agendamentos={agendamentos} onCancel={id => void handleCancel(id)} />}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function AgendaListas({ agendamentos, onCancel }: { agendamentos: AgendamentoTutorResponse[]; onCancel: (id: number) => void }) {
  const { colors, fonts, fontSize } = useTheme();
  const { proximos, historico } = useMemo(() => ({
    proximos:  [...agendamentos.filter(a => isFuture(a.dtInicio))].sort((a, b) => new Date(a.dtInicio).getTime() - new Date(b.dtInicio).getTime()),
    historico: [...agendamentos.filter(a => !isFuture(a.dtInicio))].sort((a, b) => new Date(b.dtInicio).getTime() - new Date(a.dtInicio).getTime()),
  }), [agendamentos]);

  return (
    <>
      <Text style={[styles.groupTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>
        {`PRÓXIMOS · ${proximos.length}`}
      </Text>
      {proximos.length === 0
        ? <EmptySection label="Sem próximos agendamentos" />
        : proximos.map(a => (
            <AgendamentoItem key={a.id} item={a} onLongPress={() => onCancel(a.id)} />
          ))
      }

      <Text style={[styles.groupTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs, marginTop: 24 }]}>
        {`HISTÓRICO · ${historico.length}`}
      </Text>
      {historico.length === 0
        ? <EmptySection label="Sem histórico ainda" />
        : historico.map(a => (
            <AgendamentoItem key={a.id} item={a} />
          ))
      }
    </>
  );
}

function EmptySection({ label }: { label: string }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
      <KIcon name="calendar" size={22} color={colors.textMuteInk} />
      <Text style={{ fontFamily: fonts.body, color: colors.textMuteInk, fontSize: fontSize.sm }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1 },
  header:     { padding: 20, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  scroll:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  groupTitle: { letterSpacing: 1.2, marginBottom: 12 },
});
