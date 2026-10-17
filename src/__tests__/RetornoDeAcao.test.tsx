import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { ToastProvider } from '../components/feedback/Toast';
import NovoAgendamentoScreen from '../app/(tabs)/agenda/novo';
import AgendaScreen from '../app/(tabs)/agenda/index';

// Cache frio (`--no-cache`/`--runInBand`): o 1º render da tela paga a transformação do bundle e passa de 5 s; o teste espera
// promessas que ele mesmo resolve (sem `findByText` de 1 s), então só o orçamento do teste muda.
jest.setTimeout(30_000);

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

// Promessa segura: o teste decide quando o serviço responde (G2 BR-TUT-T05 I1). Sem isso, um mock que resolve na hora
// deixa passar "toast de sucesso antes do await".
function adiada() {
  let ok!: () => void;
  let falha!: (e: Error) => void;
  const p = new Promise<void>((res, rej) => { ok = res; falha = rej; });
  return { p, ok, falha };
}
const assentar = () => act(async () => {});

describe('Solicitar horário — retorno', () => {
  beforeEach(() => { mockBack.mockClear(); mockSolicitar = jest.fn(() => Promise.resolve()); });

  async function preencher() {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText('Vacina'));
    fireEvent.press(u.getAllByLabelText(/^(seg|ter|qua|qui|sex) \d+$/)[0]!); // 1º dia oferecido: independe da hora do dia
    fireEvent.press(u.getAllByLabelText(/^(Manhã|Tarde)$/)[0]!);
    fireEvent.press(u.getByText('Pedir horário para Bóbi'));
    return u;
  }

  it('sucesso: nenhum toast enquanto o serviço não respondeu; depois, "Horário solicitado" e volta', async () => {
    const d = adiada();
    mockSolicitar = jest.fn(() => d.p);
    const u = await preencher();
    await assentar();
    expect(mockSolicitar).toHaveBeenCalledTimes(1);
    expect(u.queryByTestId('toast')).toBeNull();
    expect(u.queryByText('Horário solicitado')).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
    await act(async () => { d.ok(); });
    expect(u.getByText('Horário solicitado')).toBeTruthy();
    expect(mockBack).toHaveBeenCalled();
    expect(u.queryByText('Solicitação enviada!')).toBeNull();
  });

  it('falha: toast de erro, não volta e não afirma "solicitado"', async () => {
    const d = adiada();
    mockSolicitar = jest.fn(() => d.p);
    const u = await preencher();
    await assentar();
    expect(u.queryByTestId('toast')).toBeNull();
    await act(async () => { d.falha(new Error('500')); });
    expect(u.getByText(/Não foi possível solicitar/)).toBeTruthy();
    expect(u.queryByText('Horário solicitado')).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('duplo toque em "Pedir horário" chama o serviço 1x', async () => {
    const d = adiada();
    mockSolicitar = jest.fn(() => d.p);
    const u = await preencher();
    fireEvent.press(u.getByText('Pedir horário para Bóbi'));
    await assentar();
    expect(mockSolicitar).toHaveBeenCalledTimes(1);
    await act(async () => { d.ok(); });
  });
});

describe('Cancelar agendamento — retorno', () => {
  beforeEach(() => { mockCancelar = jest.fn(() => Promise.resolve()); });

  async function cancelar() {
    const u = render(<AgendaScreen />, { wrapper: W });
    fireEvent(await u.findByText('Bóbi'), 'longPress');
    fireEvent.press(await u.findByTestId('kdialog-acao-__confirmar__'));
    await assentar();
    return u;
  }

  it('sucesso: nenhum toast enquanto o servidor não respondeu; depois "Agendamento cancelado"', async () => {
    const d = adiada();
    mockCancelar = jest.fn(() => d.p);
    const u = await cancelar();
    expect(mockCancelar).toHaveBeenCalledWith(7);
    expect(u.queryByTestId('toast')).toBeNull();
    expect(u.queryByText('Agendamento cancelado')).toBeNull();
    await act(async () => { d.ok(); });
    expect(u.getByText('Agendamento cancelado')).toBeTruthy();
  });

  it('falha: toast de erro, nunca "cancelado"', async () => {
    const d = adiada();
    mockCancelar = jest.fn(() => d.p);
    const u = await cancelar();
    expect(u.queryByTestId('toast')).toBeNull();
    await act(async () => { d.falha(new Error('500')); });
    expect(u.getByText(/Não foi possível cancelar/)).toBeTruthy();
    expect(u.queryByText('Agendamento cancelado')).toBeNull();
  });

  it('segundo toque longo com o cancelamento em voo não abre outro diálogo nem chama o serviço de novo', async () => {
    const d = adiada();
    mockCancelar = jest.fn(() => d.p);
    const u = await cancelar();
    fireEvent(u.getByText('Bóbi'), 'longPress');
    await assentar();
    expect(u.queryByTestId('kdialog-acao-__confirmar__')).toBeNull();
    expect(mockCancelar).toHaveBeenCalledTimes(1);
    await act(async () => { d.ok(); });
  });
});
