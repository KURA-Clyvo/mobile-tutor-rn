// BR-TUT-T03 — Saúde: erro/carregando NUNCA viram "Tudo em dia" (BR-TUT-01, P0).
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import SaudeScreen from '../app/(tabs)/saude/index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const PET = { id: 1, nome: 'Thor', especie: 'Cão', raca: 'Labrador', idadeAnos: 3, sexo: 'M', porte: 'G', statusGeral: 'OK', alertasAtivos: 0, chips: [], nmClinica: 'KURA' };
const base = { isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 0 };
let mockPets: any;
let mockVacinas: any[];
jest.mock('../hooks/usePets', () => ({ usePets: () => mockPets }));
jest.mock('../services/vacinas.service', () => ({ getVacinas: jest.fn(() => Promise.resolve([])) }));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueries: () => mockVacinas,
}));

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;
const FALSAS = [/Tudo em dia/i, /Tudo certo/i, /Nenhum alerta ativo/i, /Vacinação em dia/i, /Sem alertas no momento/i, /\bOK\b/, /Pendente/i];
const semAfirmacaoDeSaude = (r: ReturnType<typeof render>) => {
  for (const re of FALSAS) expect(r.queryByText(re)).toBeNull();
};

describe('Saúde — estados', () => {
  it('carregando pets => skeleton e nenhuma afirmação de saúde', () => {
    mockPets = { ...base, data: undefined, isLoading: true, fetchStatus: 'fetching' };
    mockVacinas = [];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    semAfirmacaoDeSaude(r);
  });

  it('carregando vacinas (pets já vieram) => skeleton, não "Tudo em dia"', () => {
    mockPets = { ...base, data: [PET] };
    mockVacinas = [{ data: undefined, isLoading: true, isError: false, refetch: jest.fn(), dataUpdatedAt: 0 }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    semAfirmacaoDeSaude(r);
  });

  it('F5-M1: pets em cache e lista de vacinas PAUSADA (offline, nunca carregada) => skeleton, nunca tela em branco', () => {
    mockPets = { ...base, data: [PET], fetchStatus: 'idle' };
    mockVacinas = [{ data: undefined, isLoading: false, isError: false, fetchStatus: 'paused', refetch: jest.fn(), dataUpdatedAt: 0 }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(r.queryByTestId('error-state')).toBeNull();
    semAfirmacaoDeSaude(r);
  });

  it('erro nos pets, sem dado => ErrorState com "Tentar de novo", nenhuma afirmação de saúde', () => {
    mockPets = { ...base, data: undefined, isError: true };
    mockVacinas = [];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByTestId('error-state')).toBeTruthy();
    expect(r.getByText('Tentar de novo')).toBeTruthy();
    semAfirmacaoDeSaude(r);
  });

  it('erro na lista de vacinas de um pet (pets ok) => ErrorState, não "Tudo em dia"', () => {
    mockPets = { ...base, data: [PET] };
    mockVacinas = [{ data: undefined, isLoading: false, isError: true, refetch: jest.fn(), dataUpdatedAt: 0 }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByTestId('error-state')).toBeTruthy();
    semAfirmacaoDeSaude(r);
  });

  it('erro COM dado salvo => mostra o dado + faixa "Mostrando dados salvos", sem ErrorState', () => {
    mockPets = { ...base, data: [{ ...PET, alertasAtivos: 1, statusGeral: 'ALERTA' }], isError: true, dataUpdatedAt: Date.now() - 5 * 60_000 };
    mockVacinas = [{ data: [], isLoading: false, isError: false, refetch: jest.fn(), dataUpdatedAt: Date.now() - 5 * 60_000 }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.getByText(/Mostrando dados salvos, atualizados há 5min/)).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.getByText(/Thor/)).toBeTruthy();
  });

  it('sucesso sem alerta algum => "Tudo em dia!" (afirmação verdadeira: tudo respondeu)', () => {
    mockPets = { ...base, data: [PET] };
    mockVacinas = [{ data: [], isLoading: false, isError: false, refetch: jest.fn(), dataUpdatedAt: 1 }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByText('Tudo em dia!')).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.queryByTestId('query-state-salvos')).toBeNull();
  });

  it('sucesso sem nenhum pet => estado vazio honesto, nunca "Tudo em dia!"', () => {
    mockPets = { ...base, data: [] };
    mockVacinas = [];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByText(/ainda não tem pets vinculados/)).toBeTruthy();
    semAfirmacaoDeSaude(r);
  });
});
