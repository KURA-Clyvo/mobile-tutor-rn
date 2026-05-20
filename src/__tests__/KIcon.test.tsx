import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KIcon, type IconName } from '../components/primitives/KIcon';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;
const ALL_ICONS: IconName[] = ['pets','agenda','saude','perfil','back','close','arrowR','chevR','bell','check','alert','plus','share','download','vaccine','calendar','search'];

describe('KIcon', () => {
  it('renders all 17 icons without crash', () => {
    ALL_ICONS.forEach(name => {
      const { unmount } = render(<KIcon name={name} />, { wrapper: W });
      unmount();
    });
  });
  it('total icon count is 17', () => {
    expect(ALL_ICONS).toHaveLength(17);
  });
});
