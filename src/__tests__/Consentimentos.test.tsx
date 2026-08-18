import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';

import ConsentimentosScreen from '../app/(tabs)/perfil/consentimentos';

// TASK-F02 (rodada de fix 1): useVoltar() (usado por ConsentimentosScreen
// desde a migração) chama router.canGoBack() — mock antigo só declarava
// `back`, e um teste que pressionasse "Voltar" quebrava com
// "router.canGoBack is not a function". mockBack/mockReplace/mockCanGoBack
// no escopo do módulo pra serem controláveis pelo describe de baixo.
const mockBack      = jest.fn();
const mockReplace   = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: mockCanGoBack }),
}));
// TASK-73 (FIX_7): shape real do Java (ConsentimentoResponse: idConsentimento/tipo/
// versaoTermo/aceito/ativo/dtAceite/dtRevogacao) — antes usava campos que não
// existem no backend (id/dsTipoConsentimento/sgStatus/dtConsentimento), com os 3
// tipos inventados (COMUNICACAO_WHATSAPP/DADOS_CLINICOS_IA/
// COMPARTILHAMENTO_LABORATORIO) que também não existem. Cobre os 5 tipos reais:
// LEMBRETES ativo, DADOS_ANONIMOS revogado, os outros 3 pendentes (ausentes da
// lista).
jest.mock('../hooks/useConsentimentos', () => ({
  useConsentimentos: () => ({
    data: [
      { idConsentimento: 1, tipo: 'LEMBRETES', versaoTermo: 'v1.0', aceito: true, ativo: true, dtAceite: new Date().toISOString(), dtRevogacao: null },
      { idConsentimento: 2, tipo: 'DADOS_ANONIMOS', versaoTermo: 'v1.0', aceito: false, ativo: false, dtAceite: new Date().toISOString(), dtRevogacao: new Date().toISOString() },
    ],
  }),
  useAssinar:  () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRevogar:  () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

const W = ({ children }: any) => {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}><ThemeProvider>{children}</ThemeProvider></QueryClientProvider>;
};

describe('ConsentimentosScreen', () => {
  it('renders all 5 real consent types', async () => {
    const { getByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Teleorientação por vídeo')).toBeTruthy());
    expect(getByText('Lembretes e comunicados da clínica')).toBeTruthy();
    expect(getByText('Uso de dados anonimizados')).toBeTruthy();
    expect(getByText('Compartilhamento com seguradora')).toBeTruthy();
    expect(getByText('Comunicações de marketing')).toBeTruthy();
  });

  it('shows Ativo chip for LEMBRETES (ativo: true)', async () => {
    const { getAllByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(getAllByText('Ativo').length).toBeGreaterThan(0));
  });

  it('shows Revogado chip for DADOS_ANONIMOS (ativo: false, com dtRevogacao)', async () => {
    const { getAllByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(getAllByText('Revogado').length).toBeGreaterThan(0));
  });

  it('shows Pendente chip for missing consent (TELEORIENTACAO/COMPARTILHAR_SEGURADORA/MARKETING)', async () => {
    const { getAllByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(getAllByText('Pendente').length).toBe(3));
  });

  it('opens modal with full text on VER TEXTO button', async () => {
    const { getAllByText, getByText } = render(<ConsentimentosScreen />, { wrapper: W });
    const btns = getAllByText('VER TEXTO COMPLETO →');
    fireEvent.press(btns[0]!);
    await waitFor(() => expect(getByText('Aceitar')).toBeTruthy());
  });
});

// TASK-F02 (rodada de fix 1): segunda mordida real de call site migrado
// (a primeira é em RegisterScreen.test.tsx, cenário "sem histórico"). Este
// cobre o cenário "com histórico" numa tela diferente — chegada normal por
// navegação (perfil -> consentimentos), não deep link.
describe('ConsentimentosScreen — botão Voltar (TASK-F02)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack.mockReset();
  });

  it('com histórico (canGoBack=true): back() puro, replace NUNCA chamado — comportamento preservado', async () => {
    mockCanGoBack.mockReturnValue(true);
    const { getByLabelText, findByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await findByText('Teleorientação por vídeo');
    fireEvent.press(getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('sem histórico (canGoBack=false): replace("/(tabs)/perfil"), back() NUNCA chamado', async () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByLabelText, findByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await findByText('Teleorientação por vídeo');
    fireEvent.press(getByLabelText('Voltar'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/perfil');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
