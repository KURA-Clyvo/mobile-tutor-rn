// BR-TUT-T09 — roles (card de consulta, MOSTRAR/OCULTAR), linha de switch com alvo de linha inteira e anúncio do toast no iOS (m8).
// O tamanho >= 44 de cada tocável é o gate estático `a11y-alvos-gate.test.tsx`; aqui só o que ele não enxerga (comportamento).
import React from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { ConsultasTab } from '../components/domain/ConsultasTab';
import { KTextField } from '../components/primitives/KTextField';
import { KSwitchRow } from '../components/primitives/KSwitchRow';
import { ToastProvider, mostrarToast } from '../components/feedback/Toast';
import { KTabBar } from '../components/layout/KTabBar';
import { touchTarget } from '../theme/tokens';

let mockTimeline: any;
jest.mock('../hooks/usePetTimeline', () => ({ usePetTimeline: () => mockTimeline, usePetTimelineEvent: () => ({}) }));
const W = ({ children }: any) => <ThemeProvider><ToastProvider>{children}</ToastProvider></ThemeProvider>;
const rq = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 1 });

describe('roles', () => {
  it('card de consulta: role button com rótulo (data, veterinário) e toque abre o prontuário', () => {
    mockTimeline = rq([{ idEventoClinico: 7, nmTipo: 'CONSULTA', dtEvento: '2026-09-01T10:00:00Z', nmClinica: 'KURA', nmVeterinario: 'Dra. Ana', dsResumoPublico: 'Rotina' }]);
    const r = render(<ConsultasTab petId={1} />, { wrapper: W });
    const card = r.getByRole('button', { name: /Consulta de .*Dra\. Ana.*Ver prontuário/ });
    expect(card).toBeTruthy();
    fireEvent.press(card);
    expect(r.getByLabelText('Voltar')).toBeTruthy(); // abriu o detalhe: o Voltar do prontuário também é role button
  });

  it('MOSTRAR/OCULTAR: role button, rótulo e alvo declarado >= 44', () => {
    const r = render(<KTextField label="Senha" secureTextEntry />, { wrapper: W });
    const mostrar = r.getByRole('button', { name: 'Mostrar senha' });
    const st = StyleSheet.flatten(mostrar.props.style);
    expect(st.minHeight).toBeGreaterThanOrEqual(touchTarget.min);
    expect(st.minWidth).toBeGreaterThanOrEqual(touchTarget.min);
    fireEvent.press(mostrar);
    expect(r.getByRole('button', { name: 'Ocultar senha' })).toBeTruthy();
  });

  it('KTabBar: cada aba declara >= 44 e role tab', () => {
    const state = { index: 0, routes: [{ key: 'a', name: 'pets' }, { key: 'b', name: 'agenda' }, { key: 'c', name: 'saude' }, { key: 'd', name: 'perfil' }] };
    const nav = { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() };
    const r = render(<KTabBar {...({ state, navigation: nav, descriptors: {}, insets: { bottom: 0 } } as any)} />, { wrapper: W });
    const abas = r.getAllByRole('tab');
    expect(abas).toHaveLength(4);
    for (const a of abas) expect(StyleSheet.flatten(a.props.style).minHeight).toBeGreaterThanOrEqual(touchTarget.min);
  });
});

describe('rótulos de botões só-ícone (G2 M-1)', () => {
  it('"Compartilhar prontuário" tem rótulo (o botão é só ícone; sem rótulo o leitor diz "botão")', () => {
    mockTimeline = rq([{ idEventoClinico: 7, nmTipo: 'CONSULTA', dtEvento: '2026-09-01T10:00:00Z', nmClinica: 'KURA', nmVeterinario: 'Dra. Ana', dsResumoPublico: 'Rotina' }]);
    const r = render(<ConsultasTab petId={1} />, { wrapper: W });
    fireEvent.press(r.getByRole('button', { name: /Consulta de .*Dra\. Ana/ }));
    expect(r.getByRole('button', { name: 'Compartilhar prontuário' })).toBeTruthy();
  });
});

describe('KSwitchRow', () => {
  it('a LINHA alterna (alvo = linha) e anuncia role switch + checked', () => {
    const fn = jest.fn();
    const r = render(<KSwitchRow value={false} onValueChange={fn} accessibilityLabel="Modo escuro" testID="sw"><></></KSwitchRow>, { wrapper: W });
    const linha = r.getByRole('switch', { name: 'Modo escuro' });
    expect(linha.props.accessibilityState).toMatchObject({ checked: false });
    expect(StyleSheet.flatten(linha.props.style).minHeight).toBeGreaterThanOrEqual(touchTarget.min);
    fireEvent.press(linha);
    expect(fn).toHaveBeenCalledWith(true);
  });
  it('dois toques seguidos chegam ao dono 2x: o primitivo NÃO trava (a trava, se existir, é do chamador)', () => {
    const fn = jest.fn();
    const r = render(<KSwitchRow value={false} onValueChange={fn} accessibilityLabel="Notificações" testID="sw2"><></></KSwitchRow>, { wrapper: W });
    fireEvent.press(r.getByTestId('sw2-row'));
    fireEvent.press(r.getByTestId('sw2-row'));
    expect(fn).toHaveBeenCalledTimes(2);
  });
  // G2 M-1: o RN-web desta versão NÃO converte `accessibilityState` em `aria-checked`; a prop explícita e a tecla Espaço
  // (role=switch não responde ao Espaço no RN-web) são do primitivo e não tinham teste.
  it('aria-checked espelha o valor e a tecla Espaço alterna', () => {
    // Lê as props do COMPOSTO `Pressable`: o Pressable do RN funde `aria-checked` em `accessibilityState` no nó nativo, então
    // o host não as mostra. LIMITE: o DOM do RN-web (aria-checked/Espaço de verdade) só a sonda de DOM mede (R3 da G2).
    const fn = jest.fn();
    const monta = (v: boolean) => <KSwitchRow value={v} onValueChange={fn} accessibilityLabel="Modo escuro" testID="sw3"><></></KSwitchRow>;
    const r = render(monta(true), { wrapper: W });
    expect(r.UNSAFE_getAllByProps({ testID: 'sw3-row' })[0]!.props['aria-checked']).toBe(true);
    const prevent = jest.fn();
    r.UNSAFE_getAllByProps({ testID: 'sw3-row' })[0]!.props.onKeyDown({ key: ' ', preventDefault: prevent });
    expect(prevent).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(false);
    fn.mockClear();
    r.UNSAFE_getAllByProps({ testID: 'sw3-row' })[0]!.props.onKeyDown({ key: 'a', preventDefault: jest.fn() });
    expect(fn).not.toHaveBeenCalled();
    r.rerender(monta(false));
    expect(r.UNSAFE_getAllByProps({ testID: 'sw3-row' })[0]!.props['aria-checked']).toBe(false);
  });
});

describe('m8 — toast anunciado no iOS', () => {
  afterEach(() => { jest.restoreAllMocks(); });
  const mostrar = (os: string) => {
    jest.replaceProperty(Platform, 'OS', os as typeof Platform.OS);
    const spy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
    spy.mockClear(); // o restoreAllMocks não zera o histórico do spy do teste anterior
    const r = render(<ToastProvider><></></ToastProvider>, { wrapper: ThemeProvider });
    act(() => { mostrarToast({ tipo: 'sucesso', texto: 'Horário solicitado' }); });
    return { spy, r };
  };
  it('iOS: announceForAccessibility com o texto do toast', () => {
    const { spy, r } = mostrar('ios');
    expect(spy).toHaveBeenCalledWith('Horário solicitado');
    expect(r.getByTestId('toast')).toBeTruthy();
  });
  it('iOS: toasts em sequência anunciam OS DOIS (m8 só anunciava o primeiro)', () => {
    const { spy } = mostrar('ios');
    act(() => { mostrarToast({ tipo: 'erro', texto: 'Segundo aviso' }); });
    expect(spy.mock.calls.map((c) => c[0])).toEqual(['Horário solicitado', 'Segundo aviso']);
  });
  it.each(['android', 'web'])('%s: NÃO chama (liveRegion / role=alert já anunciam; chamar falaria 2×)', (os) => {
    const { spy, r } = mostrar(os);
    expect(r.getByTestId('toast')).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });
});
