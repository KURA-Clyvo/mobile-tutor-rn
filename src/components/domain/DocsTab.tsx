import { View, Text } from 'react-native';
import { useTheme } from '@theme/index';
import { KIcon } from '@components/primitives/KIcon';

// TASK-F03: estilo ajustado de "tela cheia" (flex:1 + justifyContent:'center' +
// backgroundColor) para "conteúdo de aba" (paddingTop, sem flex/bg) — este
// componente deixou de ser rota própria (renderizada sozinha, tela cheia) e
// passou a ser conteúdo dentro do ScrollView de pets/[id]/index.tsx, igual às
// abas Consultas/Vacinas. Estilo herdado do antigo DocsPlaceholder local.
export function DocsTab() {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
      <KIcon name="download" size={28} color={colors.textMute} />
      <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.sm }}>Documentos em breve</Text>
    </View>
  );
}
