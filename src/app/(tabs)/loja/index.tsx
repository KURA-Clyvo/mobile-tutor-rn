import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { QueryState } from '@components/feedback/QueryState';
import { Skeleton } from '@components/feedback/Skeleton';
import { AvisoLoja } from '../../../components/loja/AvisoLoja';
import { CategoriaChip } from '../../../components/loja/CategoriaChip';
import { ProdutoCard } from '../../../components/loja/ProdutoCard';
import { useCatalogo } from '../../../hooks/useCatalogo';
import { AVISO_LOJA_PRE_LANCAMENTO, CATEGORIAS_LOJA, type CatalogoLojaRaw, type CategoriaLoja } from '../../../types/loja';

export const TITULO_ERRO_LOJA = 'Não foi possível carregar a loja';
export const FRASE_VAZIO_LOJA = 'Ainda não há produtos de exemplo. Volte em breve.';

export default function LojaScreen() {
  const { colors, fonts, fontSize, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const catalogo = useCatalogo();
  const [filtro, setFiltro] = useState<CategoriaLoja | null>(null);

  // O aviso mora FORA do <QueryState> para existir nos 4 estados por construção. Com resposta, vale o texto que a API mandou;
  // sem resposta (carregando, erro sem dado), a constante ancorada (types/loja.ts, cópia byte a byte de LojaAviso.java).
  const aviso = catalogo.data?.aviso ?? AVISO_LOJA_PRE_LANCAMENTO;
  // Erro sem dado: os chips não servem a nada (não há o que filtrar) e o ErrorState ocupa o lugar da grade.
  const erroSemDado = catalogo.isError && catalogo.data === undefined;

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, gap: spacing[4] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void catalogo.refetch()} tintColor={colors.primary} />}
      >
        <View style={{ gap: spacing[1] }}>
          <Text style={{ fontFamily: fonts.display, color: colors.text, fontSize: 32, lineHeight: 38 }}>
            {'Loja de '}
            <Text style={{ fontFamily: fonts.displayItalic, color: colors.primary }}>exemplo.</Text>
          </Text>
          <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm }}>Produtos de exemplo do KURA</Text>
        </View>

        <AvisoLoja texto={aviso} />

        {!erroSemDado && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing[2] }}
            testID="loja-chips"
            accessibilityRole={'radiogroup' as any}
            accessibilityLabel="Categorias"
          >
            <CategoriaChip testID="loja-chip-tudo" rotulo="Tudo" selecionado={filtro === null} onPress={() => setFiltro(null)} />
            {CATEGORIAS_LOJA.map(c => (
              <CategoriaChip
                key={c.valor}
                testID={`loja-chip-${c.valor}`}
                rotulo={c.rotulo}
                selecionado={filtro === c.valor}
                onPress={() => setFiltro(c.valor)}
              />
            ))}
          </ScrollView>
        )}

        <QueryState
          query={catalogo}
          isEmpty={d => d.content.length === 0}
          skeleton={<SkeletonGrade />}
          errorTitle={TITULO_ERRO_LOJA}
          empty={
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.base }}>{FRASE_VAZIO_LOJA}</Text>
          }
        >
          {d => <Grade catalogo={d} filtro={filtro} onLimpar={() => setFiltro(null)} />}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function SkeletonGrade() {
  return (
    <View style={styles.grade}>
      {[0, 1, 2, 3].map(i => (
        <Skeleton key={i} variant="card" count={1} style={styles.metade} />
      ))}
    </View>
  );
}

function Grade({ catalogo, filtro, onLimpar }: { catalogo: CatalogoLojaRaw; filtro: CategoriaLoja | null; onLimpar: () => void }) {
  const { colors, fonts, fontSize, spacing } = useTheme();
  // Ordem = a da API (campo `ordem` do catálogo, editorial e estável); nenhuma ordenação aqui.
  const itens = filtro ? catalogo.content.filter(i => i.categoria === filtro) : catalogo.content;
  if (itens.length === 0) {
    const rotulo = CATEGORIAS_LOJA.find(c => c.valor === filtro)?.rotulo ?? '';
    return (
      <View style={{ gap: spacing[3], alignItems: 'flex-start' }} testID="loja-filtro-vazio">
        <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.base }}>
          {`Nenhum produto de exemplo em ${rotulo}.`}
        </Text>
        <KButton variant="ghost" size="md" onPress={onLimpar}>Ver todos os produtos</KButton>
      </View>
    );
  }
  return (
    <View style={styles.grade} testID="loja-grade">
      {itens.map(item => (
        <ProdutoCard key={item.slug} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  metade: { width: '48%' },
});
