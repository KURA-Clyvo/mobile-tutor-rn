import { Text } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { useTheme } from '@theme/index';

export default function PetsStub() {
  const t = useTheme();
  return (
    <ScreenContainer>
      <Text style={{ fontFamily: t.fonts.body, color: t.colors.text, marginTop: 24 }}>
        Meus Pets — Sprint 4
      </Text>
    </ScreenContainer>
  );
}
