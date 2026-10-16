import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { ToastProvider } from '../components/feedback/Toast';
import NovoAgendamentoScreen from '../app/(tabs)/agenda/novo';
import AgendaScreen from '../app/(tabs)/agenda/index';

// BR-TUT-T05: retorno de ação com o verbo. Sucesso só depois da resposta; erro nunca vira sucesso.
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('../hooks/usePets', () => ({
  usePets: () => ({
    data: [{ id: 1, nome: 'Bóbi', especie: 'Cão', raca: 'Labrador', nascimento: new Date('2021-03-10'), sexo: 'M', porte: 'G',
      nmClinica: 'Clínica KURA', statusGeral: 'OK', alertasAtivos: 0, idadeAnos: 4, chips: [] }],
  }),
}));
let mockSolicitar: jest.Mock;
let mockCancelar: jest.Mock;
jest.mock('../hooks/useAgendamentos', () => ({
  useSolicitarAgendamento: () => ({ mutateAsync: (...a: unknown[]) => mockSolicitar(...a), isPending: false }),
  useCancelarAgendamento:  () => ({ mutateAsync: (...a: unknown[]) => mockCancelar(...a), isPending: false }),
  useAgendamentos: () => ({
    data: [{ id: 7, dtInicio: new Date(Date.now() + 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'RETORNO',
      pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'KURA', dsMotivo: '' }],
    isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle',
  }),
  useAgendamentoBadgeCount: () => 1,
}));

const W = ({ children }: any) => (
  <ThemeProvider><KDialogProvider><ToastProvider>{children}</ToastProvider></KDialogProvider></ThemeProvider>
);

describe('Solicitar horário — retorno', () => {
  beforeEach(() => { mockBack.mockClear(); mockSolicitar = jest.fn(() => Promise.resolve()); });

  async function preencher() {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    fireEvent.press(u.getByText('09:00'));
    fireEvent.changeText(u.getByLabelText('Motivo da consulta'), 'Vacina anual');
    fireEvent.press(u.getByText('Confirmar agendamento'));
    return u;
  }

  it('sucesso: toast "Horário solicitado" e volta (sem diálogo com prazo)', async () => {
    const u = await preencher();
    expect(await u.findByText('Horário solicitado')).toBeTruthy();
    expect(mockBack).toHaveBeenCalled();
    expect(u.queryByText('Solicitação enviada!')).toBeNull();
  });

  it('falha: toast de erro, não volta e não afirma "solicitado"', async () => {
    mockSolicitar = jest.fn(() => Promise.reject(new Error('500')));
    const u = await preencher();
    expect(await u.findByText(/Não foi possível solicitar/)).toBeTruthy();
    expect(u.queryByText('Horário solicitado')).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });
});

describe('Cancelar agendamento — retorno', () => {
  beforeEach(() => { mockCancelar = jest.fn(() => Promise.resolve()); });

  async function cancelar() {
    const u = render(<AgendaScreen />, { wrapper: W });
    fireEvent(await u.findByText('Bóbi'), 'longPress');
    fireEvent.press(await u.findByTestId('kdialog-acao-__confirmar__'));
    return u;
  }

  it('sucesso: toast "Agendamento cancelado" depois da resposta', async () => {
    const u = await cancelar();
    expect(await u.findByText('Agendamento cancelado')).toBeTruthy();
    expect(mockCancelar).toHaveBeenCalledWith(7);
  });

  it('falha: toast de erro, nunca "cancelado"', async () => {
    mockCancelar = jest.fn(() => Promise.reject(new Error('500')));
    const u = await cancelar();
    expect(await u.findByText(/Não foi possível cancelar/)).toBeTruthy();
    expect(u.queryByText('Agendamento cancelado')).toBeNull();
  });
});
