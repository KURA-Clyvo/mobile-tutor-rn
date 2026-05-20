import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KCard } from '../components/primitives/KCard';
import { KChip } from '../components/primitives/KChip';
import { KBadge } from '../components/primitives/KBadge';
import { Text } from 'react-native';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('primitives barrel smoke', () => {
  it('KCard renders children', () => {
    const { getByText } = render(<KCard><Text>Conteúdo</Text></KCard>, { wrapper: W });
    expect(getByText('Conteúdo')).toBeTruthy();
  });
  it('KCard onPress is pressable', () => {
    const fn = jest.fn();
    const { getByRole } = render(<KCard onPress={fn}><Text>OK</Text></KCard>, { wrapper: W });
    expect(getByRole('button')).toBeTruthy();
  });
  it('all 5 KChip tones render', () => {
    (['sage','amber','clay','ocean','mute'] as const).forEach(tone => {
      const { unmount } = render(<KChip tone={tone}>T</KChip>, { wrapper: W });
      unmount();
    });
  });
  it('KBadge count=0 returns null', () => {
    const { toJSON } = render(<KBadge count={0} />, { wrapper: W });
    expect(toJSON()).toBeNull();
  });
});
