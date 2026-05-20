import { View, Text } from 'react-native';
import { useTheme } from '@theme/index';
import { KIcon } from '@components/primitives/KIcon';

export default function DocsTab() {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.bg }}>
      <KIcon name="download" size={28} color={colors.textMute} />
      <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.sm }}>Documentos em breve</Text>
    </View>
  );
}
