import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { formatRelativeTime } from '../../utils/date';
import { ALVO_MINIMO, ErrorState, ROTULO_TENTAR_DE_NOVO } from './ErrorState';
import { Skeleton } from './Skeleton';

// ÂNCORA (regra 11): cópia de mobile-clinica-rn `src/components/feedback/QueryState.tsx`, linhas 1-107, commit 773ae66,
// conferida em 2026-10-15:
//   git -C mobile-clinica-rn show 773ae66:src/components/feedback/QueryState.tsx | sed -n '1,107p'
// DIVERGÊNCIAS do tutor: (1) tema/botão do tutor (`useTheme()` sem `typography`; `KButton` no lugar de `KCButton`;
// o botão da faixa sobe a 44 px por `ALVO_MINIMO`); (2) `QueryLike` ganha `dataUpdatedAt?` OPCIONAL e a faixa passa a dizer
// "atualizados há 5min" (o canvas `TutorEstados` pede a hora do dado salvo; sem o campo a faixa fica como a da clínica) —
// aditivo, a assinatura da clínica continua válida; (3) NENHUM `opacity` no conteúdo em cache (V2-I1: o canvas tinha
// `opacity: 0.92` nos 2 cards e o ciclo o rejeitou; a clínica também não usa). Lógica de loading/erro/vazio idêntica.
//
// loading | empty | error | content num lugar só. A regra que importa: ERRO NUNCA VIRA VAZIO. `isError` sem dado =>
// ErrorState; `isError` COM dado em cache => o conteúdo continua visível (sem `opacity`) e uma faixa diz que são dados salvos.
export type QueryLike<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
  /** React Query: 'idle' + sem dado = query desabilitada (nada foi pedido). Opcional p/ mocks. */
  fetchStatus?: 'fetching' | 'paused' | 'idle';
  /** Epoch ms do último dado bom (React Query `dataUpdatedAt`). Opcional: sem ele a faixa não diz há quanto tempo. */
  dataUpdatedAt?: number;
};

export interface QueryStateProps<T> {
  query: QueryLike<T>;
  /** Default: array vazio. */
  isEmpty?: (data: T) => boolean;
  /** Default: <Skeleton variant="list" />. */
  skeleton?: React.ReactNode;
  /** Frase de vazio VERDADEIRO (a chamada deu certo e não há nada). */
  empty: React.ReactNode;
  /** Default: "Não foi possível carregar". */
  errorTitle?: string;
  /** Estilo extra da faixa de dados salvos (gutter quando a tela usa o QueryState fora do padding do conteúdo). */
  faixaStyle?: StyleProp<ViewStyle>;
  children: (data: T) => React.ReactNode;
}

export const TEXTO_DADOS_SALVOS = 'Mostrando dados salvos';

const vazioPadrao = (d: unknown) => Array.isArray(d) && d.length === 0;

type Tema = ReturnType<typeof useTheme>;

const makeStyles = ({ colors, fonts, fontSize, radius, spacing }: Tema) =>
  StyleSheet.create({
    faixa: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing[2],
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      marginBottom: spacing[3],
      borderRadius: radius.md,
      backgroundColor: colors.infoBg,
    },
    faixaTexto: { fontFamily: fonts.body, fontSize: fontSize.base, color: colors.text, flexShrink: 1 },
    alvo: { minHeight: ALVO_MINIMO },
  });

/** Faixa "Mostrando dados salvos. [Tentar de novo]": refetch falhou mas há dado em cache. Telas que não usam
 *  <QueryState> renderizam o dado E esta faixa, nunca só o erro. `dataUpdatedAt` (epoch ms) é opcional. */
export function FaixaDadosSalvos({ onRetry, dataUpdatedAt, style }: { onRetry: () => void; dataUpdatedAt?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const quando = dataUpdatedAt ? formatRelativeTime(new Date(dataUpdatedAt)) : '';
  const texto = quando ? `${TEXTO_DADOS_SALVOS}, atualizados ${quando}.` : `${TEXTO_DADOS_SALVOS}.`;
  return (
    <View style={[styles.faixa, style]} testID="query-state-salvos" accessibilityRole="alert">
      <Text style={styles.faixaTexto}>{texto}</Text>
      <KButton variant="ghost" size="sm" onPress={onRetry} style={styles.alvo} testID="query-state-salvos-retry" accessibilityLabel={ROTULO_TENTAR_DE_NOVO}>
        {ROTULO_TENTAR_DE_NOVO}
      </KButton>
    </View>
  );
}

export function QueryState<T>({
  query,
  isEmpty = vazioPadrao,
  skeleton,
  empty,
  errorTitle,
  faixaStyle,
  children,
}: QueryStateProps<T>) {
  const { data, isLoading, isError, refetch, fetchStatus, dataUpdatedAt } = query;
  const tentar = () => {
    void refetch();
  };

  // isLoading (React Query: pendente + buscando) implica sem dado; se um mock/chamador mandar os
  // dois, carregar vence — nunca desenhar "vazio" enquanto busca.
  if (isLoading) return <>{skeleton ?? <Skeleton variant="list" />}</>;

  if (data === undefined) {
    if (isError) return <ErrorState titulo={errorTitle} onRetry={tentar} />;
    // Query DESABILITADA (`enabled:false`: sem dado, sem erro, nada em voo): nada foi pedido, então não há
    // o que carregar nem o que declarar vazio. Skeleton aqui seria spinner eterno anunciado como
    // "Carregando"; `empty` seria uma afirmação falsa. Renderiza nada.
    if (fetchStatus === 'idle') return <></>;
    // Sem `fetchStatus` (objeto à mão) ou 'paused' (offline): segue o skeleton, que é o estado honesto.
    return <>{skeleton ?? <Skeleton variant="list" />}</>;
  }

  return (
    <>
      {isError ? <FaixaDadosSalvos onRetry={tentar} dataUpdatedAt={dataUpdatedAt} style={faixaStyle} /> : null}
      {isEmpty(data) ? empty : children(data)}
    </>
  );
}
