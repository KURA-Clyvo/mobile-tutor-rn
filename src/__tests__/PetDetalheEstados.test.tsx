// BR-TUT-T03 — perfil do pet: erro/carregando NUNCA viram o chip "Tudo certo" (BR-TUT-03 `?? 'OK'`, P0).
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import PetDetailScreen from '../app/(tabs)/pets/[id]/index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
}));

let mockQuery: any;
const mockRefetch = jest.fn();
jest.mock('../hooks/usePetDetail', () => ({ usePetDetail: () => mockQuery }));
// BR-TUT-T06: o status do pet vem da LISTA (`usePets`), não do detalhe.
let mockLista: any;
jest.mock('../hooks/usePets', () => ({ usePets: () => mockLista }));

const PET = {
  id: 1, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10',
  sgSexo: 'M', sgPorte: 'G', nmClinica: 'Clínica KURA', dsStatusGeral: 'OK', nrAlertasAtivos: 0, nrConsultas: 5, chips: [],
};
const base = { data: undefined, isLoading: false, isError: false, refetch: mockRefetch, fetchStatus: 'idle', dataUpdatedAt: 0 };
const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;
const FALSAS = [/Tudo certo/i, /Tudo em dia/i, /\bOK\b/, /Pendente/i];
const semStatusFalso = (r: ReturnType<typeof render>) => { for (const re of FALSAS) expect(r.queryByText(re)).toBeNull(); };

describe('Perfil do pet — estados', () => {
  beforeEach(() => { mockRefetch.mockClear(); mockLista = { data: [{ id: 1, statusGeral: 'OK' }], isError: false }; });

  it('carregando => skeleton, sem chip de status', () => {
    mockQuery = { ...base, isLoading: true, fetchStatus: 'fetching' };
    const r = render(<PetDetailScreen />, { wrapper: W });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    semStatusFalso(r);
  });

  it('erro sem dado => ErrorState com "Tentar de novo" (chama refetch), sem "Tudo certo"', () => {
    mockQuery = { ...base, isError: true };
    const r = render(<PetDetailScreen />, { wrapper: W });
    expect(r.getByTestId('error-state')).toBeTruthy();
    semStatusFalso(r);
    fireEvent.press(r.getByText('Tentar de novo'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('F5-M4: erro sem dado => a barra de título diz "Perfil do pet", não "…" (que lê como carregando)', () => {
    mockQuery = { ...base, isError: true };
    const r = render(<PetDetailScreen />, { wrapper: W });
    expect(r.getByText('Perfil do pet')).toBeTruthy();
    expect(r.queryByText('…')).toBeNull();
  });

  it('F5-M4 (controle): carregando mantém "…" na barra; com dado a barra mostra o nome', () => {
    mockQuery = { ...base, isLoading: true, fetchStatus: 'fetching' };
    const c = render(<PetDetailScreen />, { wrapper: W });
    expect(c.getByText('…')).toBeTruthy();
    expect(c.queryByText('Perfil do pet')).toBeNull();
    c.unmount();
    mockQuery = { ...base, data: PET };
    const ok = render(<PetDetailScreen />, { wrapper: W });
    expect(ok.queryByText('Perfil do pet')).toBeNull();
  });

  it('erro COM dado salvo => perfil + faixa de dados salvos, sem ErrorState', () => {
    mockQuery = { ...base, data: PET, isError: true, dataUpdatedAt: Date.now() - 2 * 3_600_000 };
    const r = render(<PetDetailScreen />, { wrapper: W });
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.getByText(/atualizados há 2h/)).toBeTruthy();
    // F7-M2: a faixa tem gutter lateral (spacing[5]=20) — sem ele encosta nas bordas a 390.
    const flat = Object.assign({}, ...[].concat(r.getByTestId('query-state-salvos').props.style as any).flat(3).filter(Boolean));
    expect(flat.marginHorizontal).toBe(20);
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.getAllByText('Thor').length).toBeGreaterThan(0);
  });

  it('sucesso com status OK => chip "Tudo certo" (o servidor disse OK)', () => {
    mockQuery = { ...base, data: PET };
    const r = render(<PetDetailScreen />, { wrapper: W });
    expect(r.getByText('Tudo certo')).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.queryByTestId('query-state-salvos')).toBeNull();
  });

  it('sucesso com status desconhecido/ausente => NENHUM chip de status (nada de default OK)', () => {
    mockQuery = { ...base, data: PET };
    mockLista = { data: [], isError: false };
    const r = render(<PetDetailScreen />, { wrapper: W });
    expect(r.getAllByText('Thor').length).toBeGreaterThan(0);
    semStatusFalso(r);
    expect(r.queryByText('Atenção')).toBeNull();
  });
});
