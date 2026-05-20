import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { KIcon }   from '@components/primitives/KIcon';
import { AgendamentoItem } from '../../../components/domain/AgendamentoItem';
import { useAgendamentos, useCancelarAgendamento } from '../../../hooks/useAgendamentos';
import { isFuture } from '../../../utils/date';

export default function AgendaScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const router = useRouter();
  const { data: agendamentos = [], isLoading, refetch } = useAgendamentos();
  const { mutate: cancelar, isPending: canceling } = useCancelarAgendamento();

  const { proximos, historico } = useMemo(() => ({
    proximos:  [...agendamentos.filter(a => isFuture(a.dtInicio))].sort((a, b) => new Date(a.dtInicio).getTime() - new Date(b.dtInicio).getTime()),
    historico: [...agendamentos.filter(a => !isFuture(a.dtInicio))].sort((a, b) => new Date(b.dtInicio).getTime() - new Date(a.dtInicio).getTime()),
  }), [agendamentos]);

  const handleCancel = (id: number) => {
    Alert.alert(
      'Cancelar agendamento?',
      'Você pode solicitar outro agendamento depois.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar agendamento', style: 'destructive', onPress: () => cancelar(id) },
      ]
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
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
        refreshControl={<RefreshControl refreshing={isLoading || canceling} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <Text style={[styles.groupTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>
          {`PRÓXIMOS · ${proximos.length}`}
        </Text>
        {proximos.length === 0
          ? <EmptySection label="Sem próximos agendamentos" />
          : proximos.map(a => (
              <AgendamentoItem key={a.id} item={a} onLongPress={() => handleCancel(a.id)} />
            ))
        }

        <Text style={[styles.groupTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, marginTop: 24 }]}>
          {`HISTÓRICO · ${historico.length}`}
        </Text>
        {historico.length === 0
          ? <EmptySection label="Sem histórico ainda" />
          : historico.map(a => (
              <AgendamentoItem key={a.id} item={a} />
            ))
        }
      </ScrollView>
    </View>
  );
}

function EmptySection({ label }: { label: string }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
      <KIcon name="calendar" size={22} color={colors.textMute} />
      <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.sm }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1 },
  header:     { padding: 20, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  scroll:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  groupTitle: { letterSpacing: 1.2, marginBottom: 12 },
});
