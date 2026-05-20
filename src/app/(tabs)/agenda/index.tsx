import { Text } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { useTheme } from '@theme/index';

export default function AgendaStub() {
  const t = useTheme();
  return (
    <ScreenContainer>
      <Text style={{ fontFamily: t.fonts.body, color: t.colors.text, marginTop: 24 }}>
        Agenda — Sprint 5
      </Text>
    </ScreenContainer>
  );
}
