import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KPetPortrait, racaToPalette } from '../components/primitives/KPetPortrait';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('KPetPortrait', () => {
  const palettes = ['lab','siam','pup'] as const;
  const tiers    = ['emoji','photo','detected'] as const;

  palettes.forEach(p => tiers.forEach(t => {
    it(`renders ${p}/${t}`, () => {
      const { toJSON } = render(<KPetPortrait palette={p} tier={t} />, { wrapper: W });
      expect(toJSON()).toBeTruthy();
    });
  }));

  it('renders badge ✨', () => {
    const { toJSON } = render(<KPetPortrait palette="pup" badge="✨" />, { wrapper: W });
    expect(toJSON()).toBeTruthy();
  });
});

describe('racaToPalette', () => {
  it('maps Labrador → lab',          () => expect(racaToPalette('Labrador')).toBe('lab'));
  it('maps Siamesa → siam',          () => expect(racaToPalette('Siamesa')).toBe('siam'));
  it('maps SRD → pup',               () => expect(racaToPalette('SRD')).toBe('pup'));
  it('maps Golden Retriever → lab',  () => expect(racaToPalette('Golden Retriever')).toBe('lab'));
});
