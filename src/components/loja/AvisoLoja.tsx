import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { KIcon } from '@components/primitives/KIcon';

// Aviso de pré-lançamento (D-S4-6): UM bloco fixo no topo da Loja, nunca vermelho, nunca toast nem rodapé, sem botão de dispensar.
// Âmbar do tema (amberPale/amberInk), a mesma família do AlertaBanner "atenção". O texto vem de quem renderiza (a API, ou a
// constante ancorada quando ainda não há resposta) — este componente não guarda texto.
export function AvisoLoja({ texto }: { texto: string }) {
  const { colors, fonts, fontSize, radius, spacing } = useTheme();
  return (
    <View
      testID="loja-aviso"
      accessible
      accessibilityLabel={texto}
      style={[
        styles.bloco,
        { backgroundColor: colors.amberPale, borderColor: colors.chipBorderAmber, borderRadius: radius.lg, padding: spacing[3], gap: spacing[2] },
      ]}
    >
      <KIcon name="alert" size={18} color={colors.amberInk} />
      <Text style={[styles.texto, { color: colors.amberInk, fontFamily: fonts.body, fontSize: fontSize.sm, lineHeight: 19 }]}>
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1 },
  texto: { flex: 1 },
});
