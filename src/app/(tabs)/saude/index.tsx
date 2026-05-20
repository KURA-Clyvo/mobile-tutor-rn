import { Text } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { useTheme } from '@theme/index';

export default function SaudeStub() {
  const t = useTheme();
  return (
    <ScreenContainer>
      <Text style={{ fontFamily: t.fonts.body, color: t.colors.text, marginTop: 24 }}>
        Saúde — Sprint 6
      </Text>
    </ScreenContainer>
  );
}
