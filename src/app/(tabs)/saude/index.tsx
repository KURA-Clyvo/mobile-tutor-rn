import { View, Text, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { useTheme } from '@theme/index';
import { KIcon }   from '@components/primitives/KIcon';
import { KCard }   from '@components/primitives/KCard';
import { AlertaBanner } from '../../../components/domain/AlertaBanner';
import { VacinaItem }   from '../../../components/domain/VacinaItem';
import { usePets }      from '../../../hooks/usePets';
import { getVacinas }   from '../../../services/vacinas.service';
import type { VacinaTutorResponse } from '../../../types/api';

export default function SaudeScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: pets = [], isLoading: petsLoading, refetch: refetchPets } = usePets();

  const vacinasResults = useQueries({
    queries: pets.map(pet => ({
      queryKey: ['pets', pet.id, 'vacinas'],
      queryFn:  () => getVacinas(pet.id),
      staleTime: 60_000,
      enabled:  pet.id > 0,
    })),
  });

  const isLoading = petsLoading || vacinasResults.some(r => r.isLoading);

  const onRefresh = () => {
    refetchPets();
    vacinasResults.forEach(r => r.refetch());
  };

  const alertas = pets.filter(p => p.alertasAtivos > 0);

  const vacinaAlerts: { pet: typeof pets[0]; vacina: VacinaTutorResponse }[] = [];
  pets.forEach((pet, idx) => {
    const list = vacinasResults[idx]?.data ?? [];
    list
      .filter(v => v.sgStatus !== 'EM_DIA')
      .forEach(v => vacinaAlerts.push({ pet, vacina: v }));
  });

  const totalAlertas = alertas.length + vacinaAlerts.length;
  const allClear     = alertas.length === 0 && vacinaAlerts.length === 0 && !isLoading;

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.titleArea}>
          <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 32, lineHeight: 38 }}>
            {'Saúde dos seus '}
            <Text style={{ fontStyle: 'italic', color: colors.primary }}>pets.</Text>
          </Text>
          <Text style={{ fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs, letterSpacing: 1 }}>
            {`${pets.length} PETS · ${totalAlertas} ALERTAS`}
          </Text>
        </View>

        {allClear && (
          <View style={styles.allClear}>
            <View style={[styles.allClearIcon, { backgroundColor: colors.primarySoft }]}>
              <KIcon name="check" size={40} color={colors.primary} />
            </View>
            <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 28 }}>Tudo em dia!</Text>
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, textAlign: 'center' }}>
              Nenhum alerta ativo e todas as vacinas em dia.
            </Text>
          </View>
        )}

        {alertas.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>
              {`ALERTAS ATIVOS · ${alertas.length}`}
            </Text>
            {alertas.map(p => (
              <AlertaBanner
                key={p.id}
                title={`${p.nome} · ${p.alertasAtivos} alerta${p.alertasAtivos > 1 ? 's' : ''}`}
                subtitle={`Status: ${p.statusGeral} · ${p.nmClinica}`}
                onPress={() => router.push(`/(tabs)/pets/${p.id}` as any)}
              />
            ))}
          </View>
        )}

        {alertas.length === 0 && !allClear && (
          <KCard style={[styles.emptyCard, { borderColor: colors.primarySoft }]}>
            <View style={styles.emptyRow}>
              <KIcon name="check" size={20} color={colors.primary} />
              <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm }}>
                Sem alertas no momento
              </Text>
            </View>
          </KCard>
        )}

        {vacinaAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>
              {`VACINAS · ${vacinaAlerts.length}`}
            </Text>
            {vacinaAlerts.map(({ pet, vacina }) => (
              <VacinaItem
                key={`${pet.id}-${vacina.id}`}
                vacina={vacina}
                compact
                onAgendar={() => router.push({ pathname: '/(tabs)/agenda/novo', params: { idPet: String(pet.id), tipo: 'RETORNO' } } as any)}
              />
            ))}
          </View>
        )}

        {vacinaAlerts.length === 0 && !allClear && (
          <KCard style={[styles.emptyCard, { borderColor: colors.primarySoft }]}>
            <View style={styles.emptyRow}>
              <KIcon name="vaccine" size={20} color={colors.primary} />
              <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm }}>
                Vacinação em dia!
              </Text>
            </View>
          </KCard>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMute, fontSize: fontSize.xs }]}>
            DOCUMENTOS
          </Text>
          <KCard>
            <View style={styles.emptyRow}>
              <KIcon name="download" size={20} color={colors.textMute} />
              <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.sm }}>
                Documentos em breve
              </Text>
            </View>
          </KCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  scroll:      { padding: 20, paddingBottom: 40 },
  titleArea:   { marginBottom: 20, gap: 6 },
  allClear:    { alignItems: 'center', paddingVertical: 48, gap: 16 },
  allClearIcon:{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  section:     { marginBottom: 24 },
  sectionTitle:{ letterSpacing: 1.2, marginBottom: 10 },
  emptyCard:   { marginBottom: 20 },
  emptyRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
