// BR-TUT-T03 — Consentimentos: sem a lista do servidor não se sabe o que foi aceito; "Pendente" não pode aparecer no erro.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import ConsentimentosScreen from '../app/(tabs)/perfil/consentimentos';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
}));

let mockQuery: any;
const mockRefetch = jest.fn();
jest.mock('../hooks/useConsentimentos', () => ({
  useConsentimentos: () => mockQuery,
  useAssinar:  () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRevogar:  () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

const base = { data: undefined, isLoading: false, isError: false, refetch: mockRefetch, fetchStatus: 'idle', dataUpdatedAt: 0 };
const LISTA = [
  { idConsentimento: 1, tipo: 'LEMBRETES', versaoTermo: 'v1.0', aceito: true, ativo: true, dtAceite: '2026-10-01T10:00:00Z', dtRevogacao: null },
];
const W = ({ children }: any) => <ThemeProvider><KDialogProvider>{children}</KDialogProvider></ThemeProvider>;
const FALSAS = [/Pendente/i, /Autorizado/i, /Não autorizado/i, /Necessário para o serviço/, /Tudo certo/i, /Tudo em dia/i, /\bOK\b/, /^Ativo$/, /Revogado/i];
const semStatusDeConsentimento = (r: ReturnType<typeof render>) => { for (const re of FALSAS) expect(r.queryByText(re)).toBeNull(); };

describe('Consentimentos — estados', () => {
  beforeEach(() => mockRefetch.mockClear());

  it('carregando => skeleton, nenhum status de consentimento e nenhuma chave para ligar', () => {
    mockQuery = { ...base, isLoading: true, fetchStatus: 'fetching' };
    const r = render(<ConsentimentosScreen />, { wrapper: W });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    semStatusDeConsentimento(r);
    expect(r.queryAllByLabelText(/^(Revogar|Autorizar) /)).toHaveLength(0);
  });

  it('erro sem dado => ErrorState com "Tentar de novo" (refetch), sem "Pendente"', () => {
    mockQuery = { ...base, isError: true };
    const r = render(<ConsentimentosScreen />, { wrapper: W });
    expect(r.getByTestId('error-state')).toBeTruthy();
    semStatusDeConsentimento(r);
    expect(r.queryByText('Teleorientação por vídeo')).toBeNull();
    fireEvent.press(r.getByText('Tentar de novo'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('erro COM lista salva => os opcionais com o status salvo + faixa, sem ErrorState', () => {
    mockQuery = { ...base, data: LISTA, isError: true, dataUpdatedAt: Date.now() - 10 * 60_000 };
    const r = render(<ConsentimentosScreen />, { wrapper: W });
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.getByText('Necessário para o serviço')).toBeTruthy();
    expect(r.getAllByText('Não autorizado')).toHaveLength(4);
  });

  it('sucesso => "Não autorizado" só para o que o servidor não registrou', () => {
    mockQuery = { ...base, data: LISTA };
    const r = render(<ConsentimentosScreen />, { wrapper: W });
    expect(r.getByText('Necessário para o serviço')).toBeTruthy();
    expect(r.getAllByText('Não autorizado')).toHaveLength(4);
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.queryByTestId('query-state-salvos')).toBeNull();
  });

  it('sucesso com lista vazia => os 4 opcionais aparecem como "Não autorizado" (dado real: nada aceito ainda), não é erro nem skeleton', () => {
    mockQuery = { ...base, data: [] };
    const r = render(<ConsentimentosScreen />, { wrapper: W });
    expect(r.getAllByText('Não autorizado')).toHaveLength(4);
    expect(r.queryByTestId('skeleton')).toBeNull();
    expect(r.queryByTestId('error-state')).toBeNull();
  });
});
