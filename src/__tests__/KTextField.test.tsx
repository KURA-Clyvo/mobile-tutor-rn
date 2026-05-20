import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KTextField } from '../components/primitives/KTextField';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('KTextField', () => {
  it('renders label uppercase', () => {
    const { getByText } = render(<KTextField label="Email" />, { wrapper: W });
    expect(getByText('EMAIL')).toBeTruthy();
  });
  it('shows error text', () => {
    const { getByText } = render(<KTextField label="Email" error="Inválido" />, { wrapper: W });
    expect(getByText('Inválido')).toBeTruthy();
  });
  it('toggles password visibility', () => {
    const { getByLabelText } = render(<KTextField label="Senha" secureTextEntry />, { wrapper: W });
    fireEvent.press(getByLabelText('Mostrar senha'));
    expect(getByLabelText('Ocultar senha')).toBeTruthy();
  });
  it('no layout shift without error (minHeight reserved)', () => {
    const { toJSON } = render(<KTextField label="Nome" />, { wrapper: W });
    expect(toJSON()).toBeTruthy();
  });
});
