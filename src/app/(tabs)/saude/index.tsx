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
import { classificarVacina, fraseSaude, FRASE_NADA_VENCE } from '../../../utils/vacinas';
import { STATUS_PET } from '../../../utils/statusPet';

type PetSaude = NonNullable<ReturnType<typeof usePets>['data']>[number];
type DadosSaude = { pets: PetSaude[]; vacinas: { pet: PetSaude; vacina: VacinaTutorResponse }[] };

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
  // F5-M1 (G2): o `fetchStatus` do agregado considera pets E vacinas. Pets em cache ('idle') com a lista de vacinas pausada
  // (offline, nunca carregada) NÃO é "query desabilitada": tem de dar skeleton, nunca tela em branco.
  const statuses = [petsQuery.fetchStatus, ...vacinasResults.map(r => r.fetchStatus)];
  const statusAgregado = statuses.includes('paused') ? 'paused' : statuses.includes('fetching') ? 'fetching' : 'idle';
  const saudeQuery: QueryLike<DadosSaude> = {
    data: todasComDado
      ? {
          pets,
          vacinas: pets.flatMap((pet, idx) => (vacinasResults[idx]?.data ?? []).map(vacina => ({ pet, vacina }))),
        }
      : undefined,
    isLoading: petsQuery.isLoading || vacinasResults.some(r => r.isLoading),
    isError: petsQuery.isError || vacinasResults.some(r => r.isError),
    refetch: onRefresh,
    fetchStatus: statusAgregado,
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
          {d => <SaudeConteudo pets={d.pets} vacinas={d.vacinas} />}
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

function SaudeConteudo({ pets, vacinas }: DadosSaude) {
  const { colors, fonts, fontSize } = useTheme();
  const router = useRouter();
  // BR-TUT-T06: todo número da tela sai destas três listas, as MESMAS que são desenhadas — nenhum contador é somado à parte.
  const alertas = pets.filter(p => (p.alertasAtivos ?? 0) > 0);
  const classificadas = vacinas.map(x => ({ ...x, estado: classificarVacina(x.vacina) }));
  const atencao = classificadas.filter(x => x.estado === 'VENCIDA' || x.estado === 'VENCENDO');
  const emDia = classificadas.filter(x => x.estado === 'EM_DIA');
  const semData = classificadas.filter(x => x.estado === 'SEM_DATA');
  // "Tudo em dia!" afirma que NÃO há alerta: só com a contagem de alertas de TODOS os pets em mãos (o Java real não a manda).
  const alertasConhecidos = pets.every(p => p.alertasAtivos !== undefined);
  const allClear = alertasConhecidos && alertas.length === 0 && atencao.length === 0 && semData.length === 0;
  const agendar = (idPet: number) => () =>
    router.push({ pathname: '/(tabs)/agenda/novo', params: { idPet: String(idPet), tipo: 'VACINA' } } as any);
  const rotulo = [styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }];

  return (
    <>
      <Text style={[styles.contagem, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>
        {`${pets.length} PET${pets.length === 1 ? '' : 'S'}`}
      </Text>

      {atencao.length > 0 && (
        <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: fontSize.xl, lineHeight: 30, marginBottom: 20 }}>
          {fraseSaude(atencao.map(x => ({ petNome: x.pet.nome, vacina: x.vacina })))}
        </Text>
      )}

      {allClear && (
        <View style={styles.allClear}>
          <View style={[styles.allClearIcon, { backgroundColor: colors.primarySoft }]}>
            <KIcon name="check" size={40} color={colors.primary} />
          </View>
          <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: fontSize.xl }}>Tudo em dia!</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, textAlign: 'center' }}>
            {`Nenhum alerta ativo. ${FRASE_NADA_VENCE}`}
          </Text>
        </View>
      )}

      {/* Sem a contagem de alertas, só se afirma o que a lista de vacinas sustenta. */}
      {!alertasConhecidos && atencao.length === 0 && semData.length === 0 && (
        <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: fontSize.xl, lineHeight: 30, marginBottom: 20 }}>
          {FRASE_NADA_VENCE}
        </Text>
      )}

      {alertas.length > 0 && (
        <View style={styles.section}>
          <Text style={rotulo}>{`PETS COM ALERTA · ${alertas.length}`}</Text>
          {alertas.map(p => (
            <AlertaBanner
              key={p.id}
              tone={p.statusGeral === 'URGENTE' ? 'clay' : 'amber'}
              title={`${p.nome} · ${p.alertasAtivos} alerta${(p.alertasAtivos ?? 0) > 1 ? 's' : ''}`}
              subtitle={[p.statusGeral && STATUS_PET[p.statusGeral].label, p.nmClinica].filter(Boolean).join(' · ')}
              onPress={() => router.push(`/(tabs)/pets/${p.id}` as any)}
            />
          ))}
        </View>
      )}

      {atencao.length > 0 && (
        <View style={styles.section}>
          <Text style={rotulo}>{`VACINAS QUE PEDEM ATENÇÃO · ${atencao.length}`}</Text>
          {atencao.map(({ pet, vacina }) => (
            <VacinaItem key={`${pet.id}-${vacina.id}`} vacina={vacina} petNome={pet.nome} onAgendar={agendar(pet.id)} />
          ))}
        </View>
      )}

      {emDia.length > 0 && (
        <View style={styles.section}>
          <Text style={rotulo}>{`EM DIA · ${emDia.length}`}</Text>
          {emDia.map(({ pet, vacina }) => (
            <VacinaItem key={`${pet.id}-${vacina.id}`} vacina={vacina} petNome={pet.nome} />
          ))}
        </View>
      )}

      {semData.length > 0 && (
        <View style={styles.section}>
          <Text style={rotulo}>{`SEM DATA PREVISTA · ${semData.length}`}</Text>
          {semData.map(({ pet, vacina }) => (
            <VacinaItem key={`${pet.id}-${vacina.id}`} vacina={vacina} petNome={pet.nome} />
          ))}
        </View>
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
