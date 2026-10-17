// BR-TUT-T08 fix wave (G2 I-1, I-2, M-3, M-5): estado e botão POR LINHA, caixa "Necessário" com o estado do servidor, ordem do canvas.
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { ToastProvider } from '../components/feedback/Toast';
import { LGPD_CONSENTIMENTOS } from '../constants/lgpd';
import ConsentimentosScreen from '../app/(tabs)/perfil/consentimentos';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));

let mockData: any[];
let mockAssinar: jest.Mock;
jest.mock('../hooks/useConsentimentos', () => ({
  useConsentimentos: () => ({ data: mockData, isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 0 }),
  useAssinar: () => ({ mutateAsync: (...a: unknown[]) => mockAssinar(...a), isPending: false }),
  useRevogar: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

let perigo = '';
const Sonda = () => { perigo = useTheme().colors.danger; return null; };
const W = ({ children }: any) => <ThemeProvider><Sonda /><KDialogProvider><ToastProvider>{children}</ToastProvider></KDialogProvider></ThemeProvider>;
const c = (tipo: string, ativo: boolean, extra: any = {}) =>
  ({ idConsentimento: 1, tipo, versaoTermo: 'v1.0', aceito: ativo, ativo, dtAceite: '2026-01-05T10:00:00', dtRevogacao: null, ...extra });
const tit = (t: keyof typeof LGPD_CONSENTIMENTOS) => LGPD_CONSENTIMENTOS[t].titulo;

// Sobe do botão da linha até o container que também contém o título do tipo.
const linha = (u: ReturnType<typeof render>, titulo: string) => {
  let n: any = u.getByLabelText(new RegExp(`^(Revogar|Autorizar) ${titulo}$`));
  while (n && !within(n).queryByText(titulo)) n = n.parent;
  return within(n);
};

describe('Consentimentos — estado e botão por linha (I-2)', () => {
  beforeEach(() => { mockAssinar = jest.fn(() => Promise.resolve()); });

  it('cada linha mostra o PRÓPRIO estado e o PRÓPRIO botão (ativo / revogado / sem registro / ativo)', () => {
    mockData = [
      c('TELEORIENTACAO', true, { dtAceite: '2026-01-05T10:00:00' }),
      c('DADOS_ANONIMOS', false, { dtRevogacao: '2026-02-03T10:00:00' }),
      c('MARKETING', true, { dtAceite: '2026-03-07T10:00:00' }),
    ];
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    const tele = linha(u, tit('TELEORIENTACAO'));
    expect(tele.getByText('Autorizado em 05/01/2026')).toBeTruthy();
    expect(tele.getByText('Revogar')).toBeTruthy();
    expect(tele.queryByText('Autorizar')).toBeNull();
    const anon = linha(u, tit('DADOS_ANONIMOS'));
    expect(anon.getByText('Revogado em 03/02/2026')).toBeTruthy();
    expect(anon.getByText('Autorizar')).toBeTruthy();
    expect(anon.queryByText('Revogar')).toBeNull();
    const seg = linha(u, tit('COMPARTILHAR_SEGURADORA'));
    expect(seg.getByText('Não autorizado')).toBeTruthy();
    expect(seg.getByText('Autorizar')).toBeTruthy();
    const mkt = linha(u, tit('MARKETING'));
    expect(mkt.getByText('Autorizado em 07/03/2026')).toBeTruthy();
    expect(mkt.getByText('Revogar')).toBeTruthy();
  });
});

describe('Consentimentos — caixa "Necessário para o serviço" (I-1)', () => {
  beforeEach(() => { mockAssinar = jest.fn(() => Promise.resolve()); });

  it('LEMBRETES ativo => "Ativo desde <data>", sem botão de ligar e sem botão de revogar', () => {
    mockData = [c('LEMBRETES', true, { dtAceite: '2026-01-05T10:00:00' })];
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    expect(u.getByTestId('lembretes-estado').props.children).toBe('Ativo desde 05/01/2026');
    expect(u.queryByText('Ligar lembretes')).toBeNull();
    expect(u.queryByText('Lembretes desligados')).toBeNull();
    expect(u.queryByLabelText(/Revogar Lembretes/i)).toBeNull();
  });

  it.each([
    ['revogado', [c('LEMBRETES', false, { dtRevogacao: '2026-02-03T10:00:00' })]],
    ['inativo sem data de revogação', [c('LEMBRETES', false)]],
    ['sem registro', []],
  ])('LEMBRETES %s => "Lembretes desligados" + "Ligar lembretes"', (_n, dados) => {
    mockData = dados as any[];
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    expect(u.getByTestId('lembretes-estado').props.children).toBe('Lembretes desligados');
    expect(u.getByText('Ligar lembretes')).toBeTruthy();
    expect(u.queryByText(/Ativo desde/)).toBeNull();
  });

  it('ligar: registra LEMBRETES e só anuncia sucesso DEPOIS da resposta; duplo toque chama 1x', async () => {
    let resolver!: () => void;
    mockAssinar = jest.fn(() => new Promise<void>((r) => { resolver = r; }));
    mockData = [];
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    fireEvent.press(u.getByText('Ligar lembretes'));
    fireEvent.press(u.getByText('Ligar lembretes'));
    await waitFor(() => expect(mockAssinar).toHaveBeenCalledTimes(1));
    expect(mockAssinar.mock.calls[0][0]).toMatchObject({ tipo: 'LEMBRETES' });
    expect(u.queryByText('Lembretes ligados')).toBeNull();
    resolver();
    expect(await u.findByText('Lembretes ligados')).toBeTruthy();
  });

  it('ligar com falha => toast de erro, nenhum toast de sucesso', async () => {
    mockAssinar = jest.fn(() => Promise.reject(new Error('500')));
    mockData = [];
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    fireEvent.press(u.getByText('Ligar lembretes'));
    expect(await u.findByText('Não foi possível ligar os lembretes. Tente novamente.')).toBeTruthy();
    expect(StyleSheet.flatten(u.getByTestId('toast').props.style).borderColor).toBe(perigo); // tipo 'erro', não 'sucesso'
    expect(u.queryByText('Lembretes ligados')).toBeNull();
  });
});

describe('Consentimentos — ordem (M-3) e termo (M-5)', () => {
  beforeEach(() => { mockAssinar = jest.fn(() => Promise.resolve()); });

  it('as 4 linhas vêm ANTES da caixa "Necessário para o serviço" (canvas TutorConsentimentos)', () => {
    mockData = [];
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    const arvore = JSON.stringify(u.toJSON());
    const iCaixa = arvore.indexOf('Necessário para o serviço');
    expect(iCaixa).toBeGreaterThan(-1);
    expect(arvore.indexOf(tit('TELEORIENTACAO'))).toBeLessThan(iCaixa);
    expect(arvore.lastIndexOf('VER TEXTO COMPLETO')).toBeLessThan(iCaixa);
  });

  it('VER TEXTO COMPLETO: ativo => termo sem "Aceitar"; inativo => com "Aceitar"', () => {
    mockData = [c('TELEORIENTACAO', true)];
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText(`Ver texto completo: ${tit('TELEORIENTACAO')}`));
    expect(u.queryByText('Aceitar')).toBeNull();
    fireEvent.press(u.getByText('Fechar'));
    fireEvent.press(u.getByLabelText(`Ver texto completo: ${tit('MARKETING')}`));
    expect(u.getByText('Aceitar')).toBeTruthy();
  });
});
