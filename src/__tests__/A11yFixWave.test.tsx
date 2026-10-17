// BR-TUT-T09 fix wave (pós-G2). Cada teste mata uma mutação que a G2 mostrou viva (ver diário `br-tut-t09-fixwave.md`).
import React from 'react';
import { StyleSheet, Text, type ViewStyle } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KButton } from '../components/primitives/KButton';
import { KCard } from '../components/primitives/KCard';
import { KSwitchRow } from '../components/primitives/KSwitchRow';
import { KDialogProvider, useDialog, type KDialogApi } from '../components/primitives/KDialog';
import { touchTarget } from '../theme/tokens';

const W = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('I-2 — o scrim do KDialog sai da ordem de foco', () => {
  let api: KDialogApi;
  const Captor = () => { api = useDialog(); return null; };
  it('o overlay tem tabIndex -1 (RN-web ignora accessible={false}; só tabIndex tira do Tab)', () => {
    const r = render(<ThemeProvider><KDialogProvider><Captor /></KDialogProvider></ThemeProvider>);
    act(() => { void api.alerta('Atenção', 'Texto'); });
    expect(r.getByTestId('kdialog-overlay').props.tabIndex).toBe(-1);
  });
});

describe('M-3 — o piso de 44 vale DEPOIS do style do chamador', () => {
  it('KButton sm: minHeight 30 do chamador não baixa de 44 (e md não baixa de 48)', () => {
    const r = render(<KButton size="sm" onPress={jest.fn()} style={{ minHeight: 30, minWidth: 20 }}>OK</KButton>, { wrapper: W });
    const st = StyleSheet.flatten(r.getByRole('button').props.style);
    expect(st.minHeight).toBe(touchTarget.min);
    expect(st.minWidth).toBe(touchTarget.min);
    const m = render(<KButton onPress={jest.fn()} style={{ minHeight: 30 }}>MD</KButton>, { wrapper: W });
    expect(StyleSheet.flatten(m.getByRole('button').props.style).minHeight).toBe(48);
  });
  it('KButton: o chamador pode SUBIR o piso (minHeight 60 vence)', () => {
    const r = render(<KButton onPress={jest.fn()} style={{ minHeight: 60 }}>OK</KButton>, { wrapper: W });
    expect(StyleSheet.flatten(r.getByRole('button').props.style).minHeight).toBe(60);
  });
  it('KCard tocável e KCard estático: minHeight 30 do chamador não baixa de 44', () => {
    const a = render(<KCard onPress={jest.fn()} style={{ minHeight: 30 }}>x</KCard>, { wrapper: W });
    expect(StyleSheet.flatten(a.getByRole('button').props.style).minHeight).toBe(touchTarget.min);
    const b = render(<KCard style={{ minHeight: 30, minWidth: 10 }}><Text>y</Text></KCard>, { wrapper: W });
    const st = StyleSheet.flatten((b.toJSON() as unknown as { props: { style: ViewStyle } }).props.style);
    expect(st.minHeight).toBe(touchTarget.min);
    expect(st.minWidth).toBe(touchTarget.min);
  });
  it('KSwitchRow: minHeight 30 do chamador não baixa de 44', () => {
    const r = render(<KSwitchRow value={false} onValueChange={jest.fn()} accessibilityLabel="x" testID="sw" style={{ minHeight: 30, minWidth: 10 }}><></></KSwitchRow>, { wrapper: W });
    const st = StyleSheet.flatten(r.getByRole('switch').props.style);
    expect(st.minHeight).toBe(touchTarget.min);
    expect(st.minWidth).toBe(touchTarget.min);
  });
});
