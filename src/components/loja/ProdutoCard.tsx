import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { KChip } from '@components/primitives/KChip';
import { formatarPrecoCentavos } from '../../utils/loja';
import type { ItemCatalogoRaw } from '../../types/loja';
import { CategoriaArte } from './CategoriaArte';

export const TEXTO_SELO_EXEMPLO = 'Exemplo';
export const TEXTO_PRECO_REFERENCIA = 'Preço de referência';
export const TEXTO_EM_BREVE = 'Em breve';
export const DICA_EM_BREVE = 'Pagamento e entrega ainda não estão ativos';

// Card da vitrine (S4-LOJA-05). Um preço só, nunca riscado; selo "Exemplo" quando a API marca o item como demonstração
// (D-LOJA-10); ação "Em breve" DESABILITADA (md = 48 px; o sm ficaria abaixo do alvo de 44 em alguns temas) até existir carrinho.
export function ProdutoCard({ item }: { item: ItemCatalogoRaw }) {
  const { colors, fonts, fontSize, radius, spacing } = useTheme();
  return (
    <View
      testID={`loja-card-${item.slug}`}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing[3], gap: spacing[2] }]}
    >
      <CategoriaArte categoria={item.categoria} />
      {item.exemplo ? <KChip tone="mute">{TEXTO_SELO_EXEMPLO}</KChip> : null}
      <Text numberOfLines={2} style={{ fontFamily: fonts.bodyMedium, fontSize: fontSize.base, color: colors.text, minHeight: 40 }}>
        {item.nome}
      </Text>
      <View>
        <Text style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.textMuteInk }}>{TEXTO_PRECO_REFERENCIA}</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: fontSize.md, color: colors.text }}>{formatarPrecoCentavos(item.preco)}</Text>
      </View>
      <KButton
        variant="secondary"
        size="md"
        disabled
        testID={`loja-em-breve-${item.slug}`}
        accessibilityHint={DICA_EM_BREVE}
      >
        {TEXTO_EM_BREVE}
      </KButton>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', borderWidth: 1 },
});
