import React from 'react';
import { View, Text, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { useTheme } from '@theme/index';
import { KIcon }   from '@components/primitives/KIcon';
import { KCard }   from '@components/primitives/KCard';
import { QueryState, type QueryLike } from '@components/feedback/QueryState';
import { Skeleton } from '@components/feedback/Skeleton';
import { AlertaBanner } from '../../../components/domain/AlertaBanner';
import { VacinaItem }   from '../../../components/domain/VacinaItem';
import { usePets }      from '../../../hooks/usePets';
import { getVacinas }   from '../../../services/vacinas.service';
import type { VacinaTutorResponse } from '../../../types/api';

type PetSaude = NonNullable<ReturnType<typeof usePets>['data']>[number];
type DadosSaude = { pets: PetSaude[]; vacinaAlerts: { pet: PetSaude; vacina: VacinaTutorResponse }[] };

export default function SaudeScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const petsQuery = usePets();
  const pets = petsQuery.data ?? [];

  const vacinasResults = useQueries({
    queries: pets.map(pet => ({
      queryKey: ['pets', pet.id, 'vacinas'],
      queryFn:  () => getVacinas(pet.id),
      staleTime: 60_000,
      enabled:  pet.id > 0,
    })),
  });

  const onRefresh = () => {
    void petsQuery.refetch();
    vacinasResults.forEach(r => r.refetch());
  };

  // BR-TUT-T03: "Tudo em dia" só existe se TODAS as consultas responderam. Sem a lista de vacinas de algum pet não se
  // sabe se há vacina vencendo, então `data` fica indefinido (carregando ou erro) em vez de virar lista vazia.
  const todasComDado = petsQuery.data !== undefined && vacinasResults.every(r => r.data !== undefined);
  const saudeQuery: QueryLike<DadosSaude> = {
    data: todasComDado
      ? {
          pets,
          vacinaAlerts: pets.flatMap((pet, idx) =>
            (vacinasResults[idx]?.data ?? [])
              .filter(v => v.sgStatus !== 'EM_DIA')
              .map(vacina => ({ pet, vacina })),
          ),
        }
      : undefined,
    isLoading: petsQuery.isLoading || vacinasResults.some(r => r.isLoading),
    isError: petsQuery.isError || vacinasResults.some(r => r.isError),
    refetch: onRefresh,
    fetchStatus: petsQuery.fetchStatus,
    dataUpdatedAt: Math.min(petsQuery.dataUpdatedAt, ...vacinasResults.map(r => r.dataUpdatedAt)) || undefined,
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={saudeQuery.isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.titleArea}>
          <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 32, lineHeight: 38 }}>
            {'Saúde dos seus '}
            <Text style={{ fontStyle: 'italic', color: colors.primary }}>pets.</Text>
          </Text>
        </View>

        <QueryState
          query={saudeQuery}
          isEmpty={d => d.pets.length === 0}
          skeleton={<Skeleton variant="card" count={2} />}
          errorTitle="Não consegui carregar a saúde dos seus pets"
          empty={<SemPets />}
        >
          {d => <SaudeConteudo pets={d.pets} vacinaAlerts={d.vacinaAlerts} />}
        </QueryState>
      </ScrollView>
    </View>
  );
}

/** Sucesso VAZIO de verdade: o servidor respondeu e não há pet vinculado. Não é "tudo em dia". */
function SemPets() {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <KCard>
      <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm }}>
        Você ainda não tem pets vinculados. Quando a clínica cadastrar o seu, a saúde dele aparece aqui.
      </Text>
    </KCard>
  );
}

function SaudeConteudo({ pets, vacinaAlerts }: DadosSaude) {
  const { colors, fonts, fontSize } = useTheme();
  const router = useRouter();
  const alertas = pets.filter(p => p.alertasAtivos > 0);
  const totalAlertas = alertas.length + vacinaAlerts.length;
  const allClear     = totalAlertas === 0;

  return (
    <>
      <Text style={[styles.contagem, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>
        {`${pets.length} PETS · ${totalAlertas} ALERTAS`}
      </Text>

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
          <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>
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
          <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>
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
        <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>
          DOCUMENTOS
        </Text>
        <KCard>
          <View style={styles.emptyRow}>
            <KIcon name="download" size={20} color={colors.textMuteInk} />
            <Text style={{ fontFamily: fonts.body, color: colors.textMuteInk, fontSize: fontSize.sm }}>
              Documentos em breve
            </Text>
          </View>
        </KCard>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  scroll:      { padding: 20, paddingBottom: 40 },
  titleArea:   { marginBottom: 20, gap: 6 },
  contagem:    { letterSpacing: 1, marginBottom: 12 },
  allClear:    { alignItems: 'center', paddingVertical: 48, gap: 16 },
  allClearIcon:{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  section:     { marginBottom: 24 },
  sectionTitle:{ letterSpacing: 1.2, marginBottom: 10 },
  emptyCard:   { marginBottom: 20 },
  emptyRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
