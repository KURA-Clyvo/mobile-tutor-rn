// BR-TUT-T07 — Pedir horário honesto. Relógio FIXO em toda prova (lição da T06: teste que lê a hora do dia falha à noite).
// Fixture assimétrica: 3 pets em que o escolhido não é o 1º nem o último.
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { ToastProvider } from '../components/feedback/Toast';
import NovoAgendamentoScreen from '../app/agenda/novo';

jest.setTimeout(30_000);

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
const pet = (id: number, nome: string, clinica = 'Clínica KURA') => ({
  id, nome, especie: 'Cão', raca: 'SRD', nascimento: new Date('2021-03-10'), sexo: 'M', porte: 'M',
  nmClinica: clinica, statusGeral: 'OK', alertasAtivos: 0, idadeAnos: 4, chips: [],
});
const TRES = [pet(11, 'Mel'), pet(22, 'Thor'), pet(33, 'Bidu')];
let mockPets: any;
jest.mock('../hooks/usePets', () => ({ usePets: () => mockPets }));
let mockSolicitar: jest.Mock;
jest.mock('../hooks/useAgendamentos', () => ({
  useSolicitarAgendamento: () => ({ mutateAsync: (...a: unknown[]) => mockSolicitar(...a), isPending: false }),
}));

const W = ({ children }: any) => (
  <ThemeProvider><KDialogProvider><ToastProvider>{children}</ToastProvider></KDialogProvider></ThemeProvider>
);
const ok = (data: any) => ({ data, isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 0 });
const assentar = () => act(async () => {});

// Quinta-feira 15/10/2026.
const QUINTA_10H = new Date(2026, 9, 15, 10, 0, 0);
const QUINTA_23H30 = new Date(2026, 9, 15, 23, 30, 0);
const SABADO_10H = new Date(2026, 9, 17, 10, 0, 0);

function relogio(d: Date) {
  jest.useFakeTimers({ now: d, doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'nextTick'] });
}

beforeEach(() => { mockParams = {}; mockPets = ok(TRES); mockSolicitar = jest.fn(() => Promise.resolve()); relogio(QUINTA_10H); });
afterEach(() => { jest.useRealTimers(); });

describe('seletor de pet', () => {
  it('3 pets: a escolha do 2º muda o idPet enviado (nem o 1º nem o último)', async () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText(/^Thor/));
    fireEvent.press(u.getByLabelText('Consulta de rotina'));
    fireEvent.press(u.getByLabelText('sex 16'));
    fireEvent.press(u.getByLabelText('Tarde'));
    fireEvent.press(u.getByText('Pedir horário para Thor'));
    await assentar();
    expect(mockSolicitar).toHaveBeenCalledTimes(1);
    expect(mockSolicitar.mock.calls[0][0].idPet).toBe(22);
  });

  it('vindo do perfil (params.idPet) o pet do perfil vem marcado, mesmo sendo o 2º', () => {
    mockParams = { idPet: '22' };
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.getByLabelText(/^Thor/).props.accessibilityState).toMatchObject({ checked: true });
    expect(u.getByLabelText(/^Mel/).props.accessibilityState).toMatchObject({ checked: false });
    expect(u.getByLabelText(/^Bidu/).props.accessibilityState).toMatchObject({ checked: false });
  });

  it('com 1 pet ele vem pré-selecionado e o pedido sai com o id dele', async () => {
    mockPets = ok([pet(77, 'Rex')]);
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.getByLabelText(/^Rex/).props.accessibilityState).toMatchObject({ checked: true });
    fireEvent.press(u.getByLabelText('Consulta de rotina'));
    fireEvent.press(u.getByLabelText('sex 16'));
    fireEvent.press(u.getByLabelText('Manhã'));
    fireEvent.press(u.getByText('Pedir horário para Rex'));
    await assentar();
    expect(mockSolicitar.mock.calls[0][0].idPet).toBe(77);
  });

  it('com 2+ pets e sem params nenhum vem marcado (o tutor escolhe de propósito)', () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    for (const n of [/^Mel/, /^Thor/, /^Bidu/]) expect(u.getByLabelText(n).props.accessibilityState).toMatchObject({ checked: false });
  });

  it('sem pet escolhido nada é enviado', async () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText('Consulta de rotina'));
    fireEvent.press(u.getByLabelText('sex 16'));
    fireEvent.press(u.getByLabelText('Tarde'));
    fireEvent.press(u.getAllByText('Pedir horário').at(-1)!); // o 1º é o título do cabeçalho; o último é o botão
    await assentar();
    expect(mockSolicitar).not.toHaveBeenCalled();
  });
});

describe('rádios acessíveis', () => {
  it('pet, motivo, dia e período são radio com checked, em radiogroup rotulado, alvo >= 44', () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.queryByLabelText('Período')).toBeNull(); // só existe depois de escolher o dia
    fireEvent.press(u.getByLabelText('qui 15'));
    for (const g of ['Para quem é o horário?', 'Motivo', 'Quando fica bom para você', 'Período']) {
      expect(u.getByLabelText(g).props.accessibilityRole).toBe('radiogroup');
    }
    const radios = u.UNSAFE_root.findAll((n: any) => n.props?.accessibilityRole === 'radio' && typeof n.type === 'string');
    expect(radios.length).toBe(3 + 4 + 5 + 1); // 3 pets, 4 motivos, 5 dias, Tarde (qui 15 às 10:00: só tarde)
    for (const r of radios) {
      expect(r.props.accessibilityState).toHaveProperty('checked');
      expect(StyleSheet.flatten(r.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }
    fireEvent.press(u.getByLabelText('Retorno'));
    expect(u.getByLabelText('Retorno').props.accessibilityState).toMatchObject({ checked: true });
    expect(u.getByLabelText('Consulta de rotina').props.accessibilityState).toMatchObject({ checked: false });
  });
});

describe('nada inventado', () => {
  it('nenhum "24h", "WhatsApp", "Ligue", "PASSO" nem horário riscado/indisponível', () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    const texto = JSON.stringify(u.toJSON());
    expect(texto).not.toMatch(/24 ?h/i);
    expect(texto).not.toMatch(/whatsapp/i);
    expect(texto).not.toMatch(/ligue/i);
    expect(texto).not.toMatch(/PASSO/);
    expect(texto).not.toMatch(/indispon/i);
    expect(texto).not.toMatch(/line-through/);
  });
});

describe('dia e período oferecidos (relógio fixo)', () => {
  const diasRotulos = (u: any): string[] =>
    u.UNSAFE_root
      .findAll((n: any) => typeof n.type === 'string' && n.props?.accessibilityRole === 'radio' && /^(seg|ter|qua|qui|sex|sáb|dom) \d+/.test(n.props?.accessibilityLabel ?? ''))
      .map((n: any) => n.props.accessibilityLabel);

  it('quinta 10:00: hoje oferece só Tarde (a manhã passou); fim de semana nunca aparece', () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(diasRotulos(u)).toEqual(['qui 15', 'sex 16', 'seg 19', 'ter 20', 'qua 21']);
    fireEvent.press(u.getByLabelText('qui 15'));
    expect(u.queryByLabelText('Manhã')).toBeNull();
    expect(u.getByLabelText('Tarde')).toBeTruthy();
    fireEvent.press(u.getByLabelText('sex 16'));
    expect(u.getByLabelText('Manhã')).toBeTruthy();
    expect(u.getByLabelText('Tarde')).toBeTruthy();
  });

  it('quinta 23:30: hoje não é oferecido', () => {
    jest.useRealTimers(); relogio(QUINTA_23H30);
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(diasRotulos(u)).toEqual(['sex 16', 'seg 19', 'ter 20', 'qua 21', 'qui 22']);
    expect(u.queryByLabelText('qui 15')).toBeNull();
  });

  it('sábado 10:00: o 1º dia oferecido é a segunda', () => {
    jest.useRealTimers(); relogio(SABADO_10H);
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(diasRotulos(u)[0]).toBe('seg 19');
  });

  it('trocar para um dia sem o período escolhido desmarca o período (não envia hora passada)', async () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText('sex 16'));
    fireEvent.press(u.getByLabelText('Manhã'));
    fireEvent.press(u.getByLabelText('qui 15'));
    fireEvent.press(u.getByLabelText(/^Mel/));
    fireEvent.press(u.getByLabelText('Consulta de rotina'));
    fireEvent.press(u.getByText('Pedir horário para Mel'));
    await assentar();
    expect(mockSolicitar).not.toHaveBeenCalled();
  });

  it('o instante enviado cai no dia/período escolhidos (Tarde de sexta 16) e o corpo só tem os 4 campos do app', async () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText(/^Bidu/));
    fireEvent.press(u.getByLabelText('Consulta de rotina'));
    fireEvent.press(u.getByLabelText('sex 16'));
    fireEvent.press(u.getByLabelText('Tarde'));
    fireEvent.press(u.getByText('Pedir horário para Bidu'));
    await assentar();
    const req = mockSolicitar.mock.calls[0][0];
    const d = new Date(req.dtPreferida);
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 16, 14]);
    expect(req.sgTipoConsulta).toBe('ROTINA');
    expect(req.dsMotivo).toMatch(/tarde/i);
    expect(Object.keys(req).sort()).toEqual(['dsMotivo', 'dtPreferida', 'idPet', 'sgTipoConsulta']);
  });

  it('Vacina vira VACINA (o corpo do POST de cada tipo é provado em PedirHorarioPost.test.tsx)', async () => {
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    fireEvent.press(u.getByLabelText(/^Bidu/));
    fireEvent.press(u.getByLabelText('sex 16'));
    fireEvent.press(u.getByLabelText('Manhã'));
    fireEvent.press(u.getByLabelText('Vacina'));
    fireEvent.press(u.getByText('Pedir horário para Bidu'));
    await assentar();
    expect(mockSolicitar.mock.calls[0][0].sgTipoConsulta).toBe('VACINA');
  });
});

describe('estados do usePets na tela (carregando / erro sem dado / erro com dado / vazio)', () => {
  it('carregando: skeleton, nenhum formulário e nenhuma frase de vazio', () => {
    mockPets = { ...ok(undefined), isLoading: true, fetchStatus: 'fetching' };
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.queryByLabelText('Motivo')).toBeNull();
    expect(u.queryByText(/ainda não tem pet/)).toBeNull();
    expect(u.queryByTestId('error-state')).toBeNull();
  });
  it('erro SEM dado: ErrorState + Tentar de novo; nenhuma frase de vazio nem formulário', () => {
    mockPets = { ...ok(undefined), isError: true };
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.getByTestId('error-state')).toBeTruthy();
    expect(u.getByText('Tentar de novo')).toBeTruthy();
    expect(u.queryByText(/ainda não tem pet/)).toBeNull();
    expect(u.queryByLabelText('Motivo')).toBeNull();
  });
  it('erro COM dado: formulário + faixa "Mostrando dados salvos"', () => {
    mockPets = { ...ok(TRES), isError: true };
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.getByTestId('query-state-salvos')).toBeTruthy();
    expect(u.getByLabelText(/^Thor/)).toBeTruthy();
    expect(u.queryByTestId('error-state')).toBeNull();
  });
  it('vazio verdadeiro: "a clínica cadastra", sem formulário e sem ErrorState', () => {
    mockPets = ok([]);
    const u = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(u.getByText(/ainda não tem pet cadastrado/)).toBeTruthy();
    expect(u.queryByLabelText('Motivo')).toBeNull();
    expect(u.queryByTestId('error-state')).toBeNull();
  });
});
