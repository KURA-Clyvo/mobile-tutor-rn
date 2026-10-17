import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@theme/index';
import type { CategoriaLoja } from '../../types/loja';

// Placeholder por categoria (S4-LOJA-05): os 4 desenhados como um CONJUNTO (mesmo viewBox 64, mesmo traço 2, mesmo
// enquadramento centrado), só traço `primary` sobre `primarySoft` — nenhuma cor literal, o tema entra por prop. Não é foto nem
// marca de produto (D-LOJA-5/10): é um desenho genérico da categoria. Decorativo: o nome do produto é o rótulo do card.
const TRACO = 2;

function Desenho({ categoria, cor }: { categoria: CategoriaLoja; cor: string }) {
  const s = { stroke: cor, strokeWidth: TRACO, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  switch (categoria) {
    case 'ALIMENTACAO': // tigela com ração
      return (
        <>
          <Path d="M10 30h44c0 12-9 20-22 20S10 42 10 30z" {...s} />
          <Path d="M24 54h16" {...s} />
          <Circle cx="23" cy="23" r="3" {...s} />
          <Circle cx="32" cy="19" r="3" {...s} />
          <Circle cx="41" cy="23" r="3" {...s} />
        </>
      );
    case 'HIGIENE': // frasco com gota
      return (
        <>
          <Rect x="21" y="22" width="22" height="32" rx="5" {...s} />
          <Rect x="27" y="13" width="10" height="9" rx="2" {...s} />
          <Path d="M32 31c-4 5-5 7-5 9a5 5 0 0 0 10 0c0-2-1-4-5-9z" {...s} />
        </>
      );
    case 'ACESSORIOS': // coleira com plaquinha
      return (
        <>
          <Circle cx="32" cy="28" r="18" {...s} />
          <Rect x="27" y="7" width="10" height="7" rx="2" {...s} />
          <Path d="M32 46v3" {...s} />
          <Circle cx="32" cy="54" r="4" {...s} />
        </>
      );
    case 'BRINQUEDOS': // bola
      return (
        <>
          <Circle cx="32" cy="32" r="19" {...s} />
          <Path d="M15 24c11 5 23 5 34 0" {...s} />
          <Path d="M15 40c11-5 23-5 34 0" {...s} />
        </>
      );
  }
}

export function CategoriaArte({ categoria }: { categoria: CategoriaLoja }) {
  const { colors, radius } = useTheme();
  return (
    <View
      testID={`loja-arte-${categoria}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.area, { backgroundColor: colors.primarySoft, borderRadius: radius.md }]}
    >
      <Svg width={72} height={72} viewBox="0 0 64 64">
        <Desenho categoria={categoria} cor={colors.primary} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { height: 104, alignItems: 'center', justifyContent: 'center' },
});
