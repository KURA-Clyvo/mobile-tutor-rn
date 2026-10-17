import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { KIcon }     from '@components/primitives/KIcon';
import { VacinaItem } from './VacinaItem';
import { QueryState } from '@components/feedback/QueryState';
import { Skeleton } from '@components/feedback/Skeleton';
import { usePetVacinas } from '@hooks/usePetVacinas';
import { classificarVacina, piorEstado } from '../../utils/vacinas';
import { parseData } from '../../utils/date';
import type { VacinaTutorResponse } from '../../types/api';

export function VacinasTab({ petId }: { petId: number }) {
  const { colors, fonts, fontSize } = useTheme();
  const vacinasQuery = usePetVacinas(petId);

  return (
    <View>
      <Text style={{ fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs, letterSpacing: 1, marginBottom: 4 }}>
        04 · IMUNIZAÇÃO
      </Text>
      <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 28, lineHeight: 34, marginBottom: 16 }}>
        {'Carteira de '}
        <Text style={{ fontStyle: 'italic', color: colors.primary }}>vacinação.</Text>
      </Text>

      <QueryState
        query={vacinasQuery}
        // A lista vazia é dado ("Sem registro de vacinas ainda" fica dentro do conteúdo), não vazio de tela.
        isEmpty={() => false}
        skeleton={<Skeleton variant="card" count={2} />}
        errorTitle="Não consegui carregar as vacinas"
        empty={null}
      >
        {d => <VacinasConteudo petId={petId} vacinas={d} />}
      </QueryState>
    </View>
  );
}

function VacinasConteudo({ petId, vacinas }: { petId: number; vacinas: VacinaTutorResponse[] }) {
  const { colors, fonts, fontSize } = useTheme();
  const router = useRouter();

  // BR-TUT-T06: a faixa e as listas saem da MESMA classificação (`classificarVacina`), a mesma da Saúde. O resumo do servidor
  // (`/vacinas/status`: "0/N" com 0 sem fonte) deixou de ser exibido e de ser buscado: número sem fonte não entra.
  const classificadas = vacinas.map(v => ({ v, estado: classificarVacina(v) }));
  const porData = (a: { v: VacinaTutorResponse }, b: { v: VacinaTutorResponse }) =>
    parseData(a.v.dtProximaDose || a.v.dtAplicacao).getTime() - parseData(b.v.dtProximaDose || b.v.dtAplicacao).getTime();
  const atencao = classificadas.filter(c => c.estado === 'VENCIDA' || c.estado === 'VENCENDO').sort(porData);
  const emDia = classificadas.filter(c => c.estado === 'EM_DIA').sort(porData);
  const semData = classificadas.filter(c => c.estado === 'SEM_DATA');
  const nVencidas = atencao.filter(c => c.estado === 'VENCIDA').length;
  const nVencendo = atencao.length - nVencidas;
  const pior = piorEstado(classificadas.map(c => c.estado));

  const bannerCfg = {
    EM_DIA:   { bg: colors.primarySoft, border: colors.primary, icon: 'check' as const, iconColor: colors.primary, title: 'Vacinação em dia' },
    VENCENDO: { bg: colors.amberPale,   border: colors.amberInk, icon: 'alert' as const, iconColor: colors.amberInk,
                title: `${nVencendo} vacina${nVencendo === 1 ? '' : 's'} vencendo` },
    SEM_DATA: { bg: colors.surface,     border: colors.borderStrong, icon: 'alert' as const, iconColor: colors.textMuteInk,
                title: `${semData.length} vacina${semData.length === 1 ? '' : 's'} sem data prevista` },
    VENCIDA:  { bg: colors.clayPale,    border: colors.clayInk, icon: 'alert' as const, iconColor: colors.clayInk,
                title: `${nVencidas} vacina${nVencidas === 1 ? '' : 's'} vencida${nVencidas === 1 ? '' : 's'} — agende já` },
  };
  const bCfg = bannerCfg[pior];

  return (
    <>
      {vacinas.length > 0 && (
      <View style={[styles.banner, { backgroundColor: bCfg.bg, borderColor: bCfg.border }]}>
        <View style={[styles.bannerIcon, { backgroundColor: bCfg.iconColor + '22' }]}>
          <KIcon name={bCfg.icon} size={20} color={bCfg.iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, color: bCfg.iconColor, fontSize: fontSize.sm }}>{bCfg.title}</Text>
          {pior === 'VENCIDA' && nVencendo > 0 && (
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs }}>
              {`${nVencendo} outra${nVencendo === 1 ? '' : 's'} vencendo`}
            </Text>
          )}
        </View>
      </View>
      )}

      {atencao.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>{`PEDEM ATENÇÃO · ${atencao.length}`}</Text>
          {atencao.map(({ v }) => (
            <VacinaItem
              key={v.id}
              vacina={v}
              onAgendar={() => router.push({ pathname: '/(tabs)/agenda/novo', params: { idPet: String(petId), tipo: 'VACINA' } } as any)}
            />
          ))}
        </>
      )}

      {emDia.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>{`EM DIA · ${emDia.length}`}</Text>
          {emDia.map(({ v }) => <VacinaItem key={v.id} vacina={v} />)}
        </>
      )}

      {semData.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.mono, color: colors.textMuteInk, fontSize: fontSize.xs }]}>{`SEM DATA PREVISTA · ${semData.length}`}</Text>
          {semData.map(({ v }) => <VacinaItem key={v.id} vacina={v} />)}
        </>
      )}

      {vacinas.length === 0 && (
        <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
          <KIcon name="vaccine" size={28} color={colors.textMuteInk} />
          <Text style={{ fontFamily: fonts.body, color: colors.textMuteInk }}>Sem registro de vacinas ainda.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { letterSpacing: 1.2, marginTop: 20, marginBottom: 10 },
  banner:       { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 20, gap: 12 },
  bannerIcon:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
