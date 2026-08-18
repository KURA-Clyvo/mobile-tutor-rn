import React, { useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KIcon }        from '@components/primitives/KIcon';
import { KBadge }       from '@components/primitives/KBadge';
import { KButton }      from '@components/primitives/KButton';
import { PetListCard }  from '../../../components/domain/PetListCard';
import { AlertaBanner } from '../../../components/domain/AlertaBanner';
import { usePets }           from '../../../hooks/usePets';
import { useNotifications }  from '../../../hooks/useNotifications';
import { useAuthStore }      from '../../../store/authStore';
import { greetingPT }        from '../../../utils/date';
import type { PetDomain } from '../../../types/domain';

export default function MeusPetsScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const tutor   = useAuthStore(s => s.tutor);
  const { data: pets = [], isLoading, refetch } = usePets();

  const { data: notifs = [] } = useNotifications();
  const naoLidas        = notifs.filter(n => !n.flLida).length;
  const urgentes        = pets.filter(p => p.statusGeral === 'URGENTE');
  const nAlertas        = pets.reduce((acc, p) => acc + p.alertasAtivos, 0);
  const primeiroNome    = tutor?.nmTutor.split(' ')[0] ?? 'Tutor';

  const renderItem = useCallback(({ item }: { item: PetDomain }) => (
    <PetListCard pet={item} onPress={() => router.push(`/(tabs)/pets/${item.id}` as any)} />
  ), [router]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={{ fontFamily: fonts.display, color: colors.primary, fontSize: 24 }}>Kura.</Text>
        </View>
        <Pressable
          onPress={() => router.push('/notificacoes' as any)}
          style={[styles.bellBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel="Notificações"
          accessibilityRole="button"
        >
          <KIcon name="bell" size={18} color={colors.text} />
          {naoLidas > 0 && (
            <View style={styles.bellBadge}>
              <KBadge count={naoLidas} />
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={pets}
        keyExtractor={p => String(p.id)}
        renderItem={renderItem}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={[styles.orbTR, { backgroundColor: colors.amber, opacity: 0.12 }]} />
            <View style={styles.titleArea}>
              <Text style={[styles.kicker, { fontFamily: fonts.bodyMedium, color: colors.primary, fontSize: fontSize.sm }]}>
                {greetingPT()}, {primeiroNome}
              </Text>
              <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 36, lineHeight: 42 }}>
                {'Meus '}
                <Text style={{ fontStyle: 'italic', color: colors.primary }}>pets.</Text>
              </Text>
              <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1 }}>
                {`${pets.length} PETS · ${nAlertas} ALERTAS`}
              </Text>
            </View>
            {urgentes.map(p => (
              <AlertaBanner
                key={p.id}
                title={`${p.nome} · atenção necessária`}
                subtitle={`${p.alertasAtivos} alerta${p.alertasAtivos > 1 ? 's' : ''} ativo${p.alertasAtivos > 1 ? 's' : ''}`}
                onPress={() => router.push(`/(tabs)/pets/${p.id}` as any)}
              />
            ))}
          </>
        }
        ListFooterComponent={
          <KButton variant="ghost" block onPress={() => router.push('/(tabs)/pets/novo' as any)} style={{ marginTop: 4 }}>
            + Adicionar pet
          </KButton>
        }
        ListEmptyComponent={!isLoading ? (
          <View style={styles.empty}>
            <KIcon name="pets" size={36} color={colors.textMute} />
            <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.sm, textAlign: 'center' }}>
              Nenhum pet cadastrado ainda.
            </Text>
            <KButton variant="primary" onPress={() => router.push('/(tabs)/pets/novo' as any)}>
              Adicionar pet
            </KButton>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn:    { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bellBadge:  { position: 'absolute', top: 6, right: 6 },
  list:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  titleArea:  { marginBottom: 16, gap: 6 },
  kicker:     {},
  orbTR:      { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -60, right: -60 },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 16 },
});
