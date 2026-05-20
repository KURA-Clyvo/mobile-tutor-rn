import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KChip } from '../components/primitives/KChip';
import { KBadge } from '../components/primitives/KBadge';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('KChip', () => {
  const tones = ['sage','amber','clay','ocean','mute'] as const;
  tones.forEach(t => {
    it(`renders tone ${t}`, () => {
      const { getByText } = render(<KChip tone={t}>Label</KChip>, { wrapper: W });
      expect(getByText('Label')).toBeTruthy();
    });
  });
  it('renders dot when dot=true', () => {
    const { toJSON } = render(<KChip dot>Hi</KChip>, { wrapper: W });
    expect(toJSON()).toBeTruthy();
  });
});

describe('KBadge', () => {
  it('returns null when count=0', () => {
    const { toJSON } = render(<KBadge count={0} />, { wrapper: W });
    expect(toJSON()).toBeNull();
  });
  it('shows 99+ when count > 99', () => {
    const { getByText } = render(<KBadge count={150} />, { wrapper: W });
    expect(getByText('99+')).toBeTruthy();
  });
  it('renders dot variant', () => {
    const { toJSON } = render(<KBadge dot />, { wrapper: W });
    expect(toJSON()).toBeTruthy();
  });
});
