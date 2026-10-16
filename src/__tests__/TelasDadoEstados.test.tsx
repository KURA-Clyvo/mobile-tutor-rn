// BR-TUT-T04 — as demais telas de dado (agenda, pets, notificações, abas Consultas/Vacinas do pet) no `QueryState`.
// Para cada uma: carregando => skeleton; erro SEM dado => ErrorState + "Tentar de novo" e NENHUMA frase de vazio;
// erro COM dado => conteúdo + faixa "Mostrando dados salvos"; vazio verdadeiro => frase de vazio e NENHUM ErrorState.
// A frase de vazio e a de erro nunca coincidem (Review Focus §5). O `ListEmptyComponent` do FlatList é limite M3 do detector,
// então quem protege "vazio não aparece no erro" nas telas de lista é este arquivo.
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import AgendaScreen from '../app/(tabs)/agenda/index';
import MeusPetsScreen from '../app/(tabs)/pets/index';
import NotificacoesScreen from '../app/notificacoes';
import { ConsultasTab } from '../components/domain/ConsultasTab';
import { VacinasTab } from '../components/domain/VacinasTab';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
}));
jest.mock('../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ tutor: { id: 1, nmTutor: 'Guilherme Garcia' }, isAuthenticated: () => true }),
}));

const base = { isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 0 };
// G2 BR-TUT-T04 (M4): o mock inteiro de um `useQuery`, com os campos que o React Query de verdade preenche, COERENTES por estado.
// Sem eles, uma tela que lê `isFetched`, `failureReason`, `status` ou `error` via `undefined` passa em qualquer estado (mutações A09/A12).
const rq = (e: Record<string, unknown> = {}) => {
  const q: any = { ...base, ...e };
  const erro = q.isError ? new Error('503') : null;
  return {
    ...q,
    status: q.isError ? 'error' : q.isLoading ? 'pending' : 'success',
    isFetched: !q.isLoading,
    isFetching: q.fetchStatus === 'fetching',
    isRefetchError: !!q.isError && q.data !== undefined,
    error: erro,
    failureReason: erro,
  };
};
let mockAgenda: any;
let mockPets: any;
let mockNotifs: any;
let mockTimeline: any;
let mockEvento: any;
let mockVacinas: any;
jest.mock('../hooks/useAgendamentos', () => ({
  useAgendamentos: () => mockAgenda,
  useCancelarAgendamento: () => ({ mutate: jest.fn(), isPending: false }),
  useAgendamentoBadgeCount: () => 0,
}));
jest.mock('../hooks/usePets', () => ({ usePets: () => mockPets }));
jest.mock('../hooks/useNotifications', () => ({
  useNotifications: () => mockNotifs,
  useMarcarLida: () => ({ mutate: jest.fn() }),
  useMarcarTodasLidas: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('../hooks/usePetTimeline', () => ({
  usePetTimeline: () => mockTimeline,
  usePetTimelineEvent: () => mockEvento,
}));
jest.mock('../hooks/usePetVacinas', () => ({ usePetVacinas: () => mockVacinas }));

const W = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>
    <ThemeProvider>
      <KDialogProvider>{children}</KDialogProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

const AGORA = Date.now();
const CINCO_MIN = AGORA - 5 * 60_000;
const AGENDAMENTO = {
  id: 1, dtInicio: new Date(AGORA + 86_400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'RETORNO',
  pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'KURA', dsMotivo: '',
};
const PET = {
  id: 1, nome: 'Bóbi', especie: 'Cão', raca: 'Labrador', nascimento: new Date('2021-03-10'), sexo: 'M', porte: 'G',
  nmClinica: 'Clínica KURA', statusGeral: 'OK', alertasAtivos: 0, nrConsultas: 3, idadeAnos: 4, chips: [],
};
const NOTIF = { id: 1, dsTipo: 'VACINA_VENCENDO', dsTitulo: 'Vacina do Bóbi', dsMensagem: 'Vence em 20 dias', dtEnvio: new Date(AGORA).toISOString(), flLida: false, idPet: 1, nmPet: 'Bóbi' };
const EVENTO = { idEventoClinico: 7, nmTipo: 'CONSULTA', dtEvento: new Date(AGORA).toISOString(), nmVeterinario: 'Dra. Ana', nrCRMV: '123', nmClinica: 'KURA', sgTipoAtendimento: 'pres', dsResumoPublico: 'Check-up de rotina' };
const VACINAS = {
  vacinas: [{ id: 1, nmVacina: 'V10', dtAplicacao: new Date(AGORA - 86_400_000).toISOString(), nmClinica: 'KURA', sgStatus: 'EM_DIA', dtProximaDose: new Date(AGORA + 200 * 86_400_000).toISOString() }],
  status: { nrAplicadas: 1, nrTotal: 1, dsStatusGeral: 'EM_DIA', nmUltimaVacina: 'V10' },
};

type Caso = {
  nome: string;
  tela: () => React.ReactElement;
  /** configura o hook mockado da tela com `estado` (parcial de QueryLike) */
  usar: (estado: Record<string, unknown>) => void;
  dado: unknown;
  /** texto que só existe com o dado */
  comDado: RegExp;
  /** título do ErrorState desta tela */
  tituloErro: RegExp;
  /** frase de vazio verdadeiro */
  vazio: RegExp;
  /** dado vazio (sucesso sem nada) */
  dadoVazio: unknown;
};

const CASOS: Caso[] = [
  {
    nome: 'Agenda',
    tela: () => <AgendaScreen />,
    usar: e => { mockAgenda = rq({ ...e }); mockNotifs = rq({ data: [] }); },
    dado: [AGENDAMENTO], comDado: /Bóbi/, tituloErro: /Não consegui carregar a sua agenda/,
    vazio: /Você ainda não tem agendamentos/, dadoVazio: [],
  },
  {
    nome: 'Meus pets',
    tela: () => <MeusPetsScreen />,
    usar: e => { mockPets = rq({ ...e }); mockNotifs = rq({ data: [] }); },
    dado: [PET], comDado: /Bóbi/, tituloErro: /Não consegui carregar os seus pets/,
    vazio: /Nenhum pet cadastrado ainda/, dadoVazio: [],
  },
  {
    nome: 'Notificações',
    tela: () => <NotificacoesScreen />,
    usar: e => { mockNotifs = rq({ ...e }); },
    dado: [NOTIF], comDado: /Vacina do Bóbi/, tituloErro: /Não consegui carregar as notificações/,
    vazio: /Nenhuma notificação ainda/, dadoVazio: [],
  },
  {
    nome: 'Aba Consultas do pet',
    tela: () => <ConsultasTab petId={1} />,
    usar: e => { mockTimeline = rq({ ...e }); },
    dado: [EVENTO], comDado: /Dra\. Ana/, tituloErro: /Não consegui carregar as consultas/,
    vazio: /Nenhuma consulta registrada ainda/, dadoVazio: [],
  },
  {
    nome: 'Aba Vacinas do pet',
    tela: () => <VacinasTab petId={1} />,
    usar: e => { mockVacinas = rq({ ...e }); },
    dado: VACINAS, comDado: /Vacinação em dia/, tituloErro: /Não consegui carregar as vacinas/,
    // aqui o "vazio" é a lista vazia COM o resumo do servidor
    vazio: /Sem registro de vacinas ainda/, dadoVazio: { ...VACINAS, vacinas: [] },
  },
];

// frases de vazio de TODAS as telas: nenhuma pode aparecer num erro sem dado
const TODOS_OS_VAZIOS = [
  /Você ainda não tem agendamentos/, /Sem próximos agendamentos/, /Sem histórico ainda/, /PRÓXIMOS · 0/, /HISTÓRICO · 0/,
  /Nenhum pet cadastrado ainda/, /0 PETS/, /Nenhuma notificação ainda/, /Nenhuma consulta registrada ainda/, /0 · VISITAS/,
  /Sem eventos neste filtro/, /Sem registro de vacinas ainda/,
];

describe.each(CASOS)('$nome — estados', caso => {
  it('carregando => skeleton, sem ErrorState e sem frase de vazio', () => {
    caso.usar({ data: undefined, isLoading: true, fetchStatus: 'fetching' });
    const r = render(caso.tela(), { wrapper: W });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(r.queryByTestId('error-state')).toBeNull();
    for (const re of TODOS_OS_VAZIOS) expect(r.queryByText(re)).toBeNull();
  });

  it('erro SEM dado => ErrorState com "Tentar de novo" e NENHUMA frase de vazio (a de erro e a de vazio nunca coincidem)', () => {
    const refetch = jest.fn();
    caso.usar({ data: undefined, isError: true, refetch });
    const r = render(caso.tela(), { wrapper: W });
    expect(r.getByTestId('error-state')).toBeTruthy();
    expect(r.getByText(caso.tituloErro)).toBeTruthy();
    expect(r.getByText('Tentar de novo')).toBeTruthy();
    for (const re of TODOS_OS_VAZIOS) expect(r.queryByText(re)).toBeNull();
    expect(r.queryByText(caso.comDado)).toBeNull();
    fireEvent.press(r.getByTestId('error-state-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('erro COM dado salvo => conteúdo + faixa "Mostrando dados salvos", sem ErrorState', () => {
    caso.usar({ data: caso.dado, isError: true, dataUpdatedAt: CINCO_MIN });
    const r = render(caso.tela(), { wrapper: W });
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.getByText(/Mostrando dados salvos, atualizados há 5min/)).toBeTruthy();
    expect(r.getByText(caso.comDado)).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
  });

  it('vazio verdadeiro => frase de vazio, sem ErrorState e sem faixa', () => {
    caso.usar({ data: caso.dadoVazio });
    const r = render(caso.tela(), { wrapper: W });
    expect(r.getByText(caso.vazio)).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.queryByTestId('query-state-salvos')).toBeNull();
  });

  it('sucesso com dado => conteúdo, sem ErrorState e sem faixa', () => {
    caso.usar({ data: caso.dado });
    const r = render(caso.tela(), { wrapper: W });
    expect(r.getByText(caso.comDado)).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.queryByTestId('query-state-salvos')).toBeNull();
  });
});

describe('Meus pets — contador do sino', () => {
  it('erro na contagem de notificações (sem dado) => o sino diz que não conseguiu contar e NÃO inventa número', () => {
    mockPets = rq({ data: [PET] });
    mockNotifs = rq({ data: undefined, isError: true });
    const r = render(<MeusPetsScreen />, { wrapper: W });
    expect(r.getByLabelText('Notificações (não consegui contar as novas)')).toBeTruthy();
    expect(r.queryByLabelText('Notificações')).toBeNull();
  });

  it('contagem ok => rótulo simples e o número das não lidas', () => {
    mockPets = rq({ data: [PET] });
    mockNotifs = rq({ data: [NOTIF] });
    const r = render(<MeusPetsScreen />, { wrapper: W });
    expect(r.getByLabelText('Notificações')).toBeTruthy();
    expect(r.getByText('1')).toBeTruthy();
  });
});

describe('Consulta aberta (prontuário) — estados', () => {
  const abrir = (estado: Record<string, unknown>) => {
    mockTimeline = rq({ data: [EVENTO] });
    mockEvento = rq({ ...estado });
    const r = render(<ConsultasTab petId={1} />, { wrapper: W });
    fireEvent.press(r.getByText(/Dra\. Ana/));
    return r;
  };

  it('carregando => skeleton, nunca o texto "Carregando..." solto', () => {
    const r = abrir({ data: undefined, isLoading: true, fetchStatus: 'fetching' });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(r.queryByText('Exame físico')).toBeNull();
  });

  it('erro SEM dado => ErrorState "Não consegui carregar este prontuário", sem seções clínicas', () => {
    const refetch = jest.fn();
    const r = abrir({ data: undefined, isError: true, refetch });
    expect(r.getByText(/Não consegui carregar este prontuário/)).toBeTruthy();
    expect(r.getByText('Tentar de novo')).toBeTruthy();
    expect(r.queryByText('Exame físico')).toBeNull();
    fireEvent.press(r.getByTestId('error-state-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('erro COM dado salvo => prontuário + faixa', () => {
    const r = abrir({ data: { ...EVENTO, dsDiagnostico: 'Otite' }, isError: true, dataUpdatedAt: CINCO_MIN });
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.getByText('Otite')).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
  });
});
