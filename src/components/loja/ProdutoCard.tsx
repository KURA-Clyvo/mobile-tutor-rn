import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { KChip } from '@components/primitives/KChip';
import { formatarPrecoCentavos, urlImagemLoja } from '../../utils/loja';
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
  // NX-04: foto ilustrativa quando a API manda `imagem`; falha de carga (rede, 404, base ausente no mock) ou item sem `imagem`
  // => o placeholder SVG da categoria, o mesmo padrão do KPetPortrait (`erroFoto`). Foto em cima, texto embaixo: a foto nunca
  // fica sob o texto, então o contraste do nome/preço não muda.
  const [erroFoto, setErroFoto] = useState(false);
  const caminhoFoto = item.imagem?.urlThumb;
  useEffect(() => { setErroFoto(false); }, [caminhoFoto]);
  return (
    <View
      testID={`loja-card-${item.slug}`}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing[3], gap: spacing[2] }]}
    >
      {item.imagem && !erroFoto ? (
        <Image
          testID={`loja-foto-${item.slug}`}
          source={{ uri: urlImagemLoja(item.imagem.urlThumb) }}
          style={[styles.foto, { borderRadius: radius.md, backgroundColor: colors.primarySoft }]}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          accessibilityLabel={item.imagem.alt}
          onError={() => setErroFoto(true)}
        />
      ) : (
        <CategoriaArte categoria={item.categoria} />
      )}
      {item.exemplo ? <KChip tone="mute">{TEXTO_SELO_EXEMPLO}</KChip> : null}
      {/* SEM numberOfLines: o nome carrega a quantidade ("1 kg", "85 g", "M") a que o preço de referência se refere (CDC art. 31);
          cortar o nome apaga essa informação (G2 da LOJA-05, I-1: 3 dos 10 nomes do seed real eram cortados). */}
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: fontSize.base, color: colors.text, minHeight: 40 }}>
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
  foto: { height: 104, width: '100%' }, // mesma altura do placeholder (CategoriaArte): o card não muda de tamanho se a foto falhar
});
