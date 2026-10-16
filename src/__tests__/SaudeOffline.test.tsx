// BR-TUT-T03 fix wave (F5-M1, sonda S3 da G2) — Saúde com React Query REAL: pets em cache, offline, vacinas nunca carregadas.
// O teste de estados mocka `useQueries`; este não, porque o defeito morava no `fetchStatus` que o React Query de verdade devolve.
import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';
import SaudeScreen from '../app/(tabs)/saude/index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const mockListPets = jest.fn();
const mockGetVacinas = jest.fn();
jest.mock('../services/pets.service', () => ({ listPets: () => mockListPets() }));
jest.mock('../services/vacinas.service', () => ({ getVacinas: (id: number) => mockGetVacinas(id) }));

const mk = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
const W = (qc: QueryClient) => ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <ThemeProvider>{children}</ThemeProvider>
  </QueryClientProvider>
);

afterEach(() => {
  onlineManager.setOnline(true);
});

it('offline, pets em cache fresco e vacinas nunca carregadas => skeleton (não tela em branco, não "Tudo em dia")', async () => {
  const qc = mk();
  mockListPets.mockResolvedValue([]);
  mockGetVacinas.mockResolvedValue([]);
  qc.setQueryData(['pets'], [{ id: 1, nome: 'Thor', alertasAtivos: 0, statusGeral: 'OK', nmClinica: 'K' }]);
  onlineManager.setOnline(false);
  const r = render(<SaudeScreen />, { wrapper: W(qc) });
  await new Promise((res) => setTimeout(res, 50));
  expect(r.queryAllByTestId('skeleton').length).toBeGreaterThan(0);
  expect(r.queryByTestId('error-state')).toBeNull();
  expect(r.queryByText(/Tudo em dia/)).toBeNull();
});
