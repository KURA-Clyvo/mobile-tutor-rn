import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KButton } from '../components/primitives/KButton';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('KButton', () => {
  it('renders children', () => {
    const { getByText } = render(<KButton onPress={jest.fn()}>Entrar</KButton>, { wrapper: W });
    expect(getByText('Entrar')).toBeTruthy();
  });
  it('calls onPress when pressed', () => {
    const fn = jest.fn();
    const { getByRole } = render(<KButton onPress={fn}>OK</KButton>, { wrapper: W });
    fireEvent.press(getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('does NOT call onPress when loading', () => {
    const fn = jest.fn();
    const { getByRole } = render(<KButton onPress={fn} loading>OK</KButton>, { wrapper: W });
    fireEvent.press(getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });
  it('does NOT call onPress when disabled', () => {
    const fn = jest.fn();
    const { getByRole } = render(<KButton onPress={fn} disabled>OK</KButton>, { wrapper: W });
    fireEvent.press(getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });
  it('renders all variants without crash', () => {
    (['primary','secondary','ghost','danger'] as const).forEach(v => {
      const { unmount } = render(<KButton variant={v} onPress={jest.fn()}>T</KButton>, { wrapper: W });
      unmount();
    });
  });
});
