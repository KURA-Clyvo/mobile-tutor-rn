import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KIcon } from '@components/primitives/KIcon';
import { KChip } from '@components/primitives/KChip';
import { useNotifications, useMarcarLida, useMarcarTodasLidas } from '../hooks/useNotifications';
import { useVoltar } from '../hooks/useVoltar';
import type { NotificacaoTutorResponse } from '../types/api';

type Tone = 'amber' | 'sage' | 'clay' | 'ocean';

const TIPO_CHIP: Record<NotificacaoTutorResponse['dsTipo'], { tone: Tone; label: string }> = {
  VACINA_VENCENDO:        { tone: 'amber', label: 'Vacina'     },
  RETORNO_PENDENTE:       { tone: 'amber', label: 'Retorno'    },
  AGENDAMENTO_CONFIRMADO: { tone: 'sage',  label: 'Confirmado' },
  AGENDAMENTO_CANCELADO:  { tone: 'clay',  label: 'Cancelado'  },
  COMUNICADO_CLINICA:     { tone: 'ocean', label: 'Aviso'      },
  RESULTADO_EXAME:        { tone: 'clay',  label: 'Exame'      },
};

export default function NotificacoesScreen() {
  const { colors, fonts, fontSize, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // TASK-F02: alcançável por toque em notificação push
  // (notifications.service.ts:93-95), sem histórico de navegação.
  const voltar = useVoltar('/(tabs)/pets');
  const { data: notifs = [], isLoading }          = useNotifications();
  const { mutate: marcarLida }                    = useMarcarLida();
  const { mutate: marcarTodas, isPending: markingAll } = useMarcarTodasLidas();

  const naoLidas  = notifs.filter(n => !n.flLida).length;
  const ordenadas = [...notifs].sort((a, b) => new Date(b.dtEnvio).getTime() - new Date(a.dtEnvio).getTime());

  const handleTap = (n: NotificacaoTutorResponse) => {
    if (!n.flLida) marcarLida(n.id);
    if (n.idPet)              router.push(`/(tabs)/pets/${n.idPet}` as any);
    else if (n.idAgendamento) router.push('/(tabs)/agenda' as any);
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
          style={{ minHeight: 44, justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Marcar todas como lidas"
        >
          <Text style={{ fontFamily: fonts.mono, fontSize: fontSize.xs, letterSpacing: 0.8, color: naoLidas > 0 ? colors.primary : colors.textMute }}>
            LER TODAS
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={ordenadas}
        keyExtractor={n => String(n.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item: n }) => {
          const chip = TIPO_CHIP[n.dsTipo];
          return (
            <Pressable
              onPress={() => handleTap(n)}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: n.flLida ? colors.surface : colors.surface2, borderColor: colors.border, borderRadius: radius.lg },
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${n.flLida ? 'Lida' : 'Não lida'}: ${n.dsTitulo}. ${n.dsMensagem}`}
            >
              {!n.flLida && <View style={[styles.unreadDot, { backgroundColor: colors.clay }]} />}
              <View style={styles.itemContent}>
                <View style={styles.itemTop}>
                  <KChip tone={chip.tone}>{chip.label}</KChip>
                  <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10 }}>
                    {new Date(n.dtEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.sm, marginTop: 6 }}>
                  {n.dsTitulo}
                </Text>
                <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs, lineHeight: 18, marginTop: 2 }}>
                  {n.dsMensagem}
                </Text>
                {n.nmPet && (
                  <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: 10, letterSpacing: 0.8, marginTop: 4 }}>
                    {n.nmPet.toUpperCase()}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.empty}>
            <KIcon name="bell" size={32} color={colors.textMute} />
            <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.sm }}>
              Nenhuma notificação ainda.
            </Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  circle:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, paddingHorizontal: 12 },
  list:        { padding: 16, paddingBottom: 40 },
  item:        { flexDirection: 'row', padding: 14, borderWidth: 1, marginBottom: 10, gap: 10 },
  unreadDot:   { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  itemContent: { flex: 1 },
  itemTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty:       { alignItems: 'center', paddingTop: 60, gap: 12 },
});
