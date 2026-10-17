// BR-TUT-T07 fix wave (G2: I-1, I-2, I-4, m-1, m-2, m-4) — da opção tocada na tela até o corpo do POST, com o service REAL.
// Relógio FIXO e fixture assimétrica (3 pets; o escolhido é o do meio). Só `apiClient` e `usePets` são falsos.
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { ToastProvider } from '../components/feedback/Toast';
import NovoAgendamentoScreen from '../app/(tabs)/agenda/novo';
import { mapListaAgendamentos } from '../services/agendamentos.service';
import { apiClient } from '../services/api/client';

jest.setTimeout(30_000);
jest.mock('../services/api/client', () => ({ apiClient: { post: jest.fn(), get: jest.fn(), delete: jest.fn() } }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
const pet = (id: number, nome: string) => ({
  id, nome, especie: 'Cão', raca: 'SRD', nascimento: new Date('2021-03-10'), sexo: 'M', porte: 'M',
  nmClinica: 'Clínica KURA', statusGeral: 'OK', alertasAtivos: 0, idadeAnos: 4, chips: [],
});
const ok = (data: any) => ({ data, isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 0 });
let mockPets: any;
jest.mock('../hooks/usePets', () => ({ usePets: () => mockPets }));
jest.mock('../hooks/useAgendamentos', () => ({
  // o hook real exige QueryClient; o que importa aqui é o service real por baixo
  useSolicitarAgendamento: () => ({ mutateAsync: (r: any) => require('../services/agendamentos.service').solicitarAgendamento(r), isPending: false }),
}));

const W = ({ children }: any) => (
  <ThemeProvider><KDialogProvider><ToastProvider>{children}</ToastProvider></KDialogProvider></ThemeProvider>
);
const assentar = () => act(async () => {});
const post = apiClient.post as jest.Mock;

function relogio(d: Date) {
  jest.useFakeTimers({ now: d, doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'nextTick'] });
}
const quinta = (h: number, m = 0) => new Date(2026, 9, 15, h, m, 0); // quinta 15/10/2026

beforeEach(() => {
  post.mockReset(); post.mockResolvedValue({ data: { id: 1 } });
  mockPets = ok([pet(11, 'Mel'), pet(22, 'Thor'), pet(33, 'Bidu')]);
  relogio(quinta(10));
});
afterEach(() => { jest.useRealTimers(); });

function escolherTudo(u: any, motivo: string, dia = 'sex 16', periodo = 'Tarde') {
  fireEvent.press(u.getByLabelText(/^Thor/));
  fireEvent.press(u.getByLabelText(motivo));
  fireEvent.press(u.getByLabelText(dia));
  fireEvent.press(u.getByLabelText(periodo));
}

describe('I-2: cada opção de motivo chega ao POST com o valor exato do Java', () => {
  it.each([
    ['Vacina', 'VACINA'],
    ['Consulta de rotina', 'CONSULTA'],
    ['Retorno', 'RETORNO'],
    ['Teleorientação', 'TELEORIENTACAO'],
  ])('"%s" => tipo "%s" no corpo do POST', async (rotulo, tipoJava) => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    escolherTudo(u, rotulo);
    fireEvent.press(u.getByText('Pedir horário para Thor'));
    await assentar();
    expect(post).toHaveBeenCalledTimes(1);
    const [rota, corpo] = post.mock.calls[0];
    expect(rota).toBe('/api/v1/tutor/agendamentos');
    expect(corpo.tipo).toBe(tipoJava);
    expect(corpo.idPet).toBe(22);
    expect(corpo.dtAgendamento).toBe('2026-10-16T14:00:00'); // hora de parede, sem Z
    expect(corpo.observacoes).toContain(rotulo);
  });
});

describe('I-1: ida e volta — o que o app envia volta com o mesmo rótulo na Agenda', () => {
  it.each([
    ['VACINA', 'VACINA'],
    ['CONSULTA', 'ROTINA'],
    ['RETORNO', 'RETORNO'],
    ['TELEORIENTACAO', 'TELEORIENTACAO'],
  ])('enviado "%s" => lido de volta como "%s"', (tipoJava, lido) => {
    const [ag] = mapListaAgendamentos({ content: [{
      idAgendamento: 1, idPet: 22, nmPet: 'Thor', nmEspecie: null, nmRaca: null, nmClinica: 'C', dtAgendamento: '2026-10-16T14:00:00',
      nrDuracaoMinutos: 30, tipo: tipoJava, status: 'AGENDADO', observacoes: null, dsSalaUrl: null,
    }] } as any);
    expect(ag!.sgTipoConsulta).toBe(lido);
  });
});

describe('I-4: período só com a âncora a >= 60 min; fronteiras (quinta 15/10, âncoras 09:00 e 14:00)', () => {
  const periodosDeHoje = (h: number, m: number) => {
    jest.useRealTimers(); relogio(quinta(h, m));
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    const hoje = u.queryByLabelText('qui 15');
    if (!hoje) return null;
    fireEvent.press(hoje);
    return ['Manhã', 'Tarde'].filter((p) => u.queryByLabelText(p));
  };
  it.each([
    [7, 59, ['Manhã', 'Tarde']], [8, 0, ['Manhã', 'Tarde']], [8, 1, ['Tarde']],
    [12, 59, ['Tarde']], [13, 0, ['Tarde']], [13, 1, null],
  ])('relógio %i:%i => hoje oferece %j', (h, m, esperado) => {
    expect(periodosDeHoje(h as number, m as number)).toEqual(esperado);
  });

  it('a tela ficou aberta: marca a Tarde às 12:30, envia às 13:05 => período desmarcado, mensagem, NADA enviado', async () => {
    jest.useRealTimers(); relogio(quinta(12, 30));
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    escolherTudo(u, 'Retorno', 'qui 15', 'Tarde');
    expect(u.getByLabelText('Tarde').props.accessibilityState).toMatchObject({ checked: true });
    jest.setSystemTime(quinta(13, 5));
    fireEvent.press(u.getByText('Pedir horário para Thor'));
    await assentar();
    expect(post).not.toHaveBeenCalled();
    expect(u.getByText(/Esse período já passou/)).toBeTruthy();
    expect(u.queryByLabelText('Tarde')).toBeNull(); // o dia de hoje saiu da lista: nada mais a oferecer hoje
    expect(u.queryByLabelText('qui 15')).toBeNull();
  });

  it('o dia continua com outro período: 07:30 marca Manhã, 08:30 envia => Manhã some, Tarde fica DESMARCADA, nada enviado', async () => {
    jest.useRealTimers(); relogio(quinta(7, 30));
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    escolherTudo(u, 'Retorno', 'qui 15', 'Manhã');
    jest.setSystemTime(quinta(8, 30));
    fireEvent.press(u.getByText('Pedir horário para Thor'));
    await assentar();
    expect(post).not.toHaveBeenCalled();
    expect(u.getByText(/Esse período já passou/)).toBeTruthy();
    expect(u.queryByLabelText('Manhã')).toBeNull();
    expect(u.getByLabelText('Tarde').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('antes da fronteira o envio sai normalmente (12:30 marca, 12:59 envia)', async () => {
    jest.useRealTimers(); relogio(quinta(12, 30));
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    escolherTudo(u, 'Retorno', 'qui 15', 'Tarde');
    jest.setSystemTime(quinta(12, 59));
    fireEvent.press(u.getByText('Pedir horário para Thor'));
    await assentar();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][1].dtAgendamento).toBe('2026-10-15T14:00:00');
  });
});

describe('m-1: carregando mostra o skeleton de verdade', () => {
  it('skeleton presente; formulário, vazio e erro ausentes', () => {
    mockPets = { ...ok(undefined), isLoading: true, fetchStatus: 'fetching' };
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(u.queryByLabelText('Motivo')).toBeNull();
    expect(u.queryByText(/ainda não tem pet/)).toBeNull();
    expect(u.queryByTestId('error-state')).toBeNull();
  });
});

describe('m-2: depois de uma falha o botão volta a funcionar', () => {
  it('1º envio falha => toast de erro; 2º toque envia de novo (sem soltar a trava no finally, o 2º não chama)', async () => {
    post.mockRejectedValueOnce(new Error('rede'));
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    escolherTudo(u, 'Retorno');
    fireEvent.press(u.getByText('Pedir horário para Thor'));
    await assentar();
    expect(post).toHaveBeenCalledTimes(1);
    expect(u.getByText(/Não foi possível solicitar/)).toBeTruthy();
    fireEvent.press(u.getByText('Pedir horário para Thor'));
    await assentar();
    expect(post).toHaveBeenCalledTimes(2);
  });
});

describe('m-4: o alerta diz o que falta e o grupo "Dia" tem o rótulo do título visível', () => {
  it('só o motivo escolhido => "Escolha o pet. Escolha o dia. Escolha o período."', async () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText('Retorno'));
    fireEvent.press(u.getAllByText('Pedir horário').at(-1)!);
    await assentar();
    expect(u.getByText('Escolha o pet. Escolha o dia. Escolha o período.')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });
  it('rótulo acessível do grupo = título visível', () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.getByText('Quando fica bom para você')).toBeTruthy();
    expect(u.getByLabelText('Quando fica bom para você').props.accessibilityRole).toBe('radiogroup');
    expect(u.queryByLabelText('Dia')).toBeNull();
  });
});

describe('I-5 (rodapé): promete só o que o app faz', () => {
  it('o rodapé diz "Aguardando até a clínica confirmar" e não "quando ela marcar"', () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.getByText('O pedido aparece em Agenda como Aguardando até a clínica confirmar.')).toBeTruthy();
    expect(u.queryByText(/quando ela marcar/i)).toBeNull();
  });
});
