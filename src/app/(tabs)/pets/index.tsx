import React from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KuraMark } from '@components/brand/KuraMark';
import { KIcon }        from '@components/primitives/KIcon';
import { KBadge }       from '@components/primitives/KBadge';
import { KButton }      from '@components/primitives/KButton';
import { QueryState }   from '@components/feedback/QueryState';
import { Skeleton }     from '@components/feedback/Skeleton';
import { PetListCard }  from '../../../components/domain/PetListCard';
import { AlertaBanner } from '../../../components/domain/AlertaBanner';
import { usePets }           from '../../../hooks/usePets';
import { useNotifications }  from '../../../hooks/useNotifications';
import { useAuthStore }      from '../../../store/authStore';
import { greetingPT }        from '../../../utils/date';
import type { PetDomain } from '../../../types/domain';
import { touchTarget } from '@theme/tokens';

export default function MeusPetsScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const tutor   = useAuthStore(s => s.tutor);
  const petsQuery = usePets();

  // O contador do sino é auxiliar: se a contagem não veio, o sino continua e o NÚMERO não é inventado (nem "0").
  const { data: notifs, isError: notifErro } = useNotifications();
  const semContagem = notifErro && notifs == null;
  const naoLidas    = (notifs ?? []).filter(n => !n.flLida).length;
  const primeiroNome = tutor?.nmTutor.split(' ')[0] ?? 'Tutor';

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <KuraMark size={28} variante="sobreNeutro" />
        </View>
        <Pressable
          onPress={() => router.push('/notificacoes' as any)}
          style={[styles.bellBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel={semContagem ? 'Notificações (não consegui contar as novas)' : 'Notificações'}
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

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={Boolean(petsQuery.isRefetching)} onRefresh={() => void petsQuery.refetch()} tintColor={colors.primary} />}
      >
        <View style={[styles.orbTR, { backgroundColor: colors.amber, opacity: 0.12 }]} />
        <View style={styles.titleArea}>
          <Text style={[styles.kicker, { fontFamily: fonts.bodyMedium, color: colors.primary, fontSize: fontSize.sm }]}>
            {greetingPT()}, {primeiroNome}
          </Text>
          <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 36, lineHeight: 42 }}>
            {'Meus '}
            <Text style={{ fontStyle: 'italic', color: colors.primary }}>pets.</Text>
          </Text>
        </View>

        <QueryState
          query={petsQuery}
          skeleton={<Skeleton variant="card" count={2} />}
          errorTitle="Não consegui carregar os seus pets"
          empty={<SemPets onAdicionar={() => router.push('/(tabs)/pets/novo' as any)} />}
        >
          {pets => <ListaPets pets={pets} />}
        </QueryState>
      </ScrollView>
    </View>
  );
}

/** Sucesso VAZIO de verdade: o servidor respondeu e não há pet. Nunca aparece no erro (o QueryState desenha o ErrorState). */
function SemPets({ onAdicionar }: { onAdicionar: () => void }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={styles.empty}>
      <KIcon name="pets" size={36} color={colors.textMuteInk} />
      <Text style={{ fontFamily: fonts.body, color: colors.textMuteInk, fontSize: fontSize.sm, textAlign: 'center' }}>
        Nenhum pet cadastrado ainda.
      </Text>
      <KButton variant="primary" onPress={onAdicionar}>
        Adicionar pet
      </KButton>
    </View>
  );
}

function ListaPets({ pets }: { pets: PetDomain[] }) {
  const { colors, fonts, fontSize } = useTheme();
  const router = useRouter();
  const urgentes = pets.filter(p => p.statusGeral === 'URGENTE');
  const alertasConhecidos = pets.every(p => p.alertasAtivos !== undefined);
  const nAlertas = pets.reduce((acc, p) => acc + (p.alertasAtivos ?? 0), 0);

  return (
    <>
      <Text style={[styles.contagem, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs, letterSpacing: 1 }]}>
        {alertasConhecidos ? `${pets.length} PETS · ${nAlertas} ALERTAS` : `${pets.length} PETS`}
      </Text>
      {urgentes.map(p => (
        <AlertaBanner
          key={p.id}
          title={`${p.nome} · atenção necessária`}
          subtitle={`${p.alertasAtivos ?? 1} alerta${(p.alertasAtivos ?? 1) > 1 ? 's' : ''} ativo${(p.alertasAtivos ?? 1) > 1 ? 's' : ''}`}
          onPress={() => router.push(`/(tabs)/pets/${p.id}` as any)}
        />
      ))}
      {pets.map(p => (
        <PetListCard key={p.id} pet={p} onPress={() => router.push(`/(tabs)/pets/${p.id}` as any)} />
      ))}
      <KButton variant="ghost" block onPress={() => router.push('/(tabs)/pets/novo' as any)} style={{ marginTop: 4 }}>
        + Adicionar pet
      </KButton>
    </>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn:    { width: touchTarget.min, height: touchTarget.min, borderRadius: touchTarget.min / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bellBadge:  { position: 'absolute', top: 6, right: 6 },
  list:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  titleArea:  { marginBottom: 16, gap: 6 },
  contagem:   { marginBottom: 12 },
  kicker:     {},
  orbTR:      { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -60, right: -60 },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 16 },
});
