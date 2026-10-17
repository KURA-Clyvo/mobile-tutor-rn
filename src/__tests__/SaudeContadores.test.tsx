// BR-TUT-T06 — Saúde: de quem e quando. Contador = itens desenhados; uma fonte para o estado da vacina e do pet.
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, within } from '@testing-library/react-native';
import { lightColors } from '../theme/tokens';
import { ThemeProvider } from '../theme/index';
import SaudeScreen from '../app/(tabs)/saude/index';
import PetDetailScreen from '../app/(tabs)/pets/[id]/index';
import MeusPetsScreen from '../app/(tabs)/pets/index';
import { VacinasTab } from '../components/domain/VacinasTab';
import { PetListCard } from '../components/domain/PetListCard';
import { classificarVacina, fraseSaude, piorEstado, quandoVacina } from '../utils/vacinas';
import { STATUS_PET } from '../utils/statusPet';
import { mapPetDetailDto, mapPetDto } from '../utils/mappers';
import { mapListaPets } from '../services/pets.service';
import { VacinaItem } from '../components/domain/VacinaItem';

// Só a lista de pets (MeusPetsScreen) usa estes dois.
jest.mock('../hooks/useNotifications', () => ({ useNotifications: () => ({ data: [], isError: false, isLoading: false, refetch: jest.fn() }) }));
jest.mock('../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ tutor: { id: 1, nmTutor: 'Guilherme', dsEmail: 'g@k.com', dsTelefone: '', dtCadastro: '' }, isAuthenticated: () => true, themeOverride: null, setThemeOverride: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
  useLocalSearchParams: () => ({ id: '1' }),
}));

// Relógio fixo (I3 do G2): toda data da fixture sai de NOW, ao meio-dia LOCAL. Antes era `Date.now() + dias + 1h`, que cruzava a
// meia-noite depois das 23:00 e deixava o teste vermelho no CI entre 02:00 e 03:00 UTC. Só `Date` é falso; os timers são os reais.
const NOW = new Date(2026, 9, 16, 12, 0);
const TIMERS_REAIS = ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] as const;
beforeAll(() => { jest.useFakeTimers({ now: NOW, doNotFake: [...TIMERS_REAIS] }); });
afterAll(() => { jest.useRealTimers(); });

const em = (dias: number) => new Date(2026, 9, 16 + dias, 12, 0).toISOString();
const vac = (id: number, nmVacina: string, dias: number) =>
  ({ id, nmVacina, dtAplicacao: em(dias), dtProximaDose: em(dias), nmClinica: 'KURA', sgStatus: 'VENCENDO' as const });

type PetFx = { id: number; nome: string; especie: string; raca: string; idadeAnos: number; sexo: string; porte: string; statusGeral?: 'OK' | 'ALERTA' | 'URGENTE'; alertasAtivos?: number; chips: never[]; nmClinica: string };
// Fixture ASSIMÉTRICA (I4 do G2): cada contador tem um tamanho DIFERENTE dos outros — 4 pets, 2 com alerta, 3 vacinas pedindo
// atenção, 1 em dia —, o pet com MAIS alertas (Bobi, 3) NÃO é o urgente (Mel, 1), a mesma vacina está em 2 pets e um pet não tem vacina.
// Se dois contadores tivessem o mesmo tamanho, trocar um pelo outro passaria despercebido.
const BOBI: PetFx = { id: 1, nome: 'Bobi', especie: 'Cão', raca: 'SRD', idadeAnos: 3, sexo: 'M', porte: 'M', statusGeral: 'ALERTA', alertasAtivos: 3, chips: [], nmClinica: 'KURA' };
const MEL: PetFx = { ...BOBI, id: 2, nome: 'Mel', especie: 'Gato', statusGeral: 'URGENTE', alertasAtivos: 1 };
const BIA: PetFx = { ...BOBI, id: 3, nome: 'Bia', statusGeral: 'OK', alertasAtivos: 0 };
const ZECA: PetFx = { ...BOBI, id: 4, nome: 'Zeca', statusGeral: 'OK', alertasAtivos: 0 };
const THOR: PetFx = { ...BOBI, id: 5, nome: 'Thor', statusGeral: 'ALERTA', alertasAtivos: 1 };
const PETS4 = [BOBI, MEL, BIA, ZECA];
const VACINAS_POR_PET: Record<number, ReturnType<typeof vac>[]> = {
  1: [vac(10, 'Antirrábica', 12)],
  2: [vac(10, 'Antirrábica', -7), vac(20, 'Giárdia', 20)],
  3: [],
  4: [vac(30, 'V10', 200)],
  5: [vac(10, 'Antirrábica', 12)],
};

const base = { isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 1 };
let mockPets: any;
let mockVacinas: any[];
jest.mock('../hooks/usePets', () => ({ usePets: () => mockPets }));
jest.mock('../services/vacinas.service', () => ({ getVacinas: jest.fn() }));

jest.mock('@tanstack/react-query', () => ({ ...jest.requireActual('@tanstack/react-query'), useQueries: () => mockVacinas }));
let mockDetalhe: any;
jest.mock('../hooks/usePetDetail', () => ({ usePetDetail: () => mockDetalhe }));
let mockTab: any;
jest.mock('../hooks/usePetVacinas', () => ({ usePetVacinas: () => mockTab }));

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;
const numero = (r: ReturnType<typeof render>, re: RegExp) =>
  Number(String(r.getByText(re).props.children).match(/(\d+)$/)?.[1]);
const resp = (pets: PetFx[]) => pets.map(p => ({ ...base, data: VACINAS_POR_PET[p.id] }));
const DETALHE = { id: 1, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'SRD', dtNascimento: '2021-03-10', sgSexo: 'M', sgPorte: 'M', nmClinica: 'KURA', nrAlertasAtivos: 0, nrConsultas: 1, chips: [] };

describe('Saúde — contadores derivam da lista exibida', () => {
  it('cada contador = itens desenhados E = o número esperado (4 pets, 2 com alerta, 3 pedem atenção, 1 em dia)', () => {
    mockPets = { ...base, data: PETS4 };
    mockVacinas = resp(PETS4);
    const r = render(<SaudeScreen />, { wrapper: W });

    // número literal: o contador certo tem um tamanho que nenhum outro contador tem
    expect(numero(r, /^VACINAS QUE PEDEM ATENÇÃO · \d+$/)).toBe(3);
    expect(r.getAllByLabelText(/^Agendar /)).toHaveLength(3);
    expect(numero(r, /^EM DIA · \d+$/)).toBe(1);
    expect(r.getAllByText('Em dia')).toHaveLength(1);
    expect(numero(r, /^PETS COM ALERTA · \d+$/)).toBe(2);
    expect(r.getAllByLabelText('Ver detalhes')).toHaveLength(2);
    expect(r.getByText('4 PETS')).toBeTruthy();
    expect(r.getAllByText('Vencida')).toHaveLength(1);
    expect(r.getAllByText('Vencendo')).toHaveLength(2);
    // a mesma vacina em 2 pets aparece nos 2 (nada deduplica entre pets); o pet sem vacina não quebra nem some da contagem
    expect(r.getByText('Antirrábica · Bobi')).toBeTruthy();
    expect(r.getByText('Antirrábica · Mel')).toBeTruthy();
    expect(r.getByText('Giárdia · Mel')).toBeTruthy();
    expect(r.getByText('V10 · Zeca')).toBeTruthy();
    // a soma dos itens desenhados = as vacinas da fixture
    expect(r.getAllByLabelText(/^Agendar /).length + r.getAllByText('Em dia').length).toBe(
      Object.values(VACINAS_POR_PET).flat().length - VACINAS_POR_PET[5]!.length,
    );
  });

  it('clay = urgência, amber = atenção: Mel (URGENTE, 1 alerta) em clay, Bobi (ALERTA, 3 alertas) em amber — o tom vem do STATUS, não da contagem', () => {
    mockPets = { ...base, data: PETS4 };
    mockVacinas = resp(PETS4);
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(within(r.getByTestId('alerta-clay')).getByText('Mel · 1 alerta')).toBeTruthy();
    expect(within(r.getByTestId('alerta-clay')).getByText('Urgente · KURA')).toBeTruthy();
    expect(within(r.getByTestId('alerta-amber')).getByText('Bobi · 3 alertas')).toBeTruthy();
    expect(within(r.getByTestId('alerta-amber')).getByText('Atenção · KURA')).toBeTruthy();
    // vacina: vencida = clay, vencendo = amber (o chip carrega o tom; o texto do rótulo é o que o tutor lê)
    const cor = (t: string) => StyleSheet.flatten(r.getAllByText(t)[0]!.props.style).color;
    expect(cor('Vencida')).toBe(lightColors.clayInk);
    expect(cor('Vencendo')).toBe(lightColors.amberInk);
  });

  it('cada vacina diz de qual pet é, o nome e quando', () => {
    mockPets = { ...base, data: PETS4 };
    mockVacinas = resp(PETS4);
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByText('vence em 12 dias')).toBeTruthy();
    expect(r.getByText('venceu há 7 dias')).toBeTruthy();
    expect(r.getByText('vence em 20 dias')).toBeTruthy();
    expect(r.getByText('3 vacinas pedem atenção.')).toBeTruthy();
  });

  it('voz do DS para um caso só', () => {
    mockPets = { ...base, data: [THOR] };
    mockVacinas = [{ ...base, data: [vac(10, 'Antirrábica', 12)] }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByText('Thor tem uma vacina vencendo em 12 dias.')).toBeTruthy();
  });

  it('erro COM dado salvo: as vacinas continuam com pet e quando, e a faixa de dados salvos aparece', () => {
    mockPets = { ...base, data: [THOR], isError: true, dataUpdatedAt: NOW.getTime() - 5 * 60_000 };
    mockVacinas = [{ ...base, data: [vac(10, 'Antirrábica', 12)], dataUpdatedAt: NOW.getTime() - 5 * 60_000 }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.getByText('Antirrábica · Thor')).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
  });
});

describe('"Tudo em dia!" só existe sem alerta E sem vacina pedindo atenção (I5 do G2)', () => {
  const OK1: PetFx = { ...BOBI, statusGeral: 'OK', alertasAtivos: 0 };
  const tela = (vacinas: ReturnType<typeof vac>[]) => {
    mockPets = { ...base, data: [OK1] };
    mockVacinas = [{ ...base, data: vacinas }];
    return render(<SaudeScreen />, { wrapper: W });
  };

  it('controle positivo: pet OK, sem vacina nenhuma => "Tudo em dia!" e a cópia que o servidor sustenta', () => {
    const r = tela([]);
    expect(r.getByText('Tudo em dia!')).toBeTruthy();
    expect(r.getByText('Nenhum alerta ativo. Nenhuma vacina vence nos próximos 30 dias.')).toBeTruthy();
    expect(r.queryByText(/todas as vacinas em dia/i)).toBeNull();
  });

  it('controle positivo: só vacina em dia (além da janela) => "Tudo em dia!"', () => {
    expect(tela([vac(1, 'V10', 200)]).getByText('Tudo em dia!')).toBeTruthy();
  });

  it.each([
    ['vencida', -3],
    ['vencendo', 5],
    ['vencendo hoje', 0],
  ])('pet sem alerta + vacina %s => NÃO diz "Tudo em dia!" e lista a vacina', (_n, dias) => {
    const r = tela([vac(1, 'V10', dias)]);
    expect(r.queryByText('Tudo em dia!')).toBeNull();
    expect(r.queryByText(/Nenhum alerta ativo/)).toBeNull();
    expect(r.getByText(/^VACINAS QUE PEDEM ATENÇÃO · 1$/)).toBeTruthy();
  });
});

describe('uma fonte para o estado', () => {
  // 2 vencidas, 1 vencendo (a fronteira de 30 dias), 4 em dia: nenhum par de contadores tem o mesmo tamanho
  const FIXTURES = [vac(1, 'A', -3), vac(2, 'B', -1), vac(3, 'C', 30), vac(4, 'D', 31), vac(5, 'E', 335), vac(6, 'F', 100), vac(7, 'G', 60)];

  it('fronteiras de classificarVacina e do texto "quando" (dia de calendário, como a view do Java)', () => {
    expect([-1, 0, 1, 30, 31].map(d => classificarVacina(vac(9, 'X', d)))).toEqual(['VENCIDA', 'VENCENDO', 'VENCENDO', 'VENCENDO', 'EM_DIA']);
    expect(quandoVacina(vac(9, 'X', -3))).toBe('venceu há 3 dias');
    expect(quandoVacina(vac(9, 'X', -1))).toBe('venceu há 1 dia');
    expect(quandoVacina(vac(9, 'X', 0))).toBe('vence hoje');
    expect(quandoVacina(vac(9, 'X', 1))).toBe('vence em 1 dia');
    expect(fraseSaude([])).toBe('Nenhuma vacina vence nos próximos 30 dias.');
  });

  it('a mesma lista tem os mesmos chips na Saúde e na aba Vacinas do pet, e os números são os esperados', () => {
    mockPets = { ...base, data: [THOR] };
    mockVacinas = [{ ...base, data: FIXTURES }];
    const saude = render(<SaudeScreen />, { wrapper: W });
    mockTab = { ...base, data: FIXTURES };
    const aba = render(<VacinasTab petId={1} />, { wrapper: W });
    for (const chip of ['Vencida', 'Vencendo', 'Em dia']) {
      expect(aba.queryAllByText(chip).length).toBe(saude.queryAllByText(chip).length);
    }
    expect(aba.getAllByText('Vencida')).toHaveLength(2);
    expect(aba.getAllByText('Vencendo')).toHaveLength(1);
    expect(aba.getAllByText('Em dia')).toHaveLength(4);
    // a faixa da aba é a conta da própria lista
    expect(aba.getByText('2 vacinas vencidas — agende já')).toBeTruthy();
    expect(aba.getByText('1 outra vencendo')).toBeTruthy();
    expect(numero(aba, /^PEDEM ATENÇÃO · \d+$/)).toBe(3);
    expect(numero(aba, /^EM DIA · \d+$/)).toBe(4);
    // sem o "0/5" do resumo do servidor (o 0 não tem fonte)
    expect(aba.queryByText(/^\d+\/\d+$/)).toBeNull();
  });

  it.each(['OK', 'ALERTA', 'URGENTE'] as const)('status do pet %s: o detalhe mostra o mesmo texto da lista', status => {
    const pet = { ...THOR, id: 1, statusGeral: status }; // o detalhe lê o pet de id 1 (useLocalSearchParams)
    mockPets = { ...base, data: [pet] };
    mockDetalhe = { ...base, data: DETALHE };
    const lista = render(<PetListCard pet={pet as any} onPress={jest.fn()} />, { wrapper: W });
    const detalhe = render(<PetDetailScreen />, { wrapper: W });
    expect(lista.getAllByText(STATUS_PET[status].label).length).toBeGreaterThan(0);
    expect(detalhe.getAllByText(STATUS_PET[status].label)).toHaveLength(1);
  });

  it('lista de pets: "Atenção" em amber-ink, "Urgente" em clay-ink', () => {
    const cor = (statusGeral: 'ALERTA' | 'URGENTE', t: string) => {
      const r = render(<PetListCard pet={{ ...THOR, statusGeral } as any} onPress={jest.fn()} />, { wrapper: W });
      return StyleSheet.flatten(r.getByText(t).props.style).color;
    };
    expect(cor('ALERTA', 'Atenção')).toBe(lightColors.amberInk);
    expect(cor('URGENTE', 'Urgente')).toBe(lightColors.clayInk);
  });

  it('o mapper do detalhe não inventa status', () => {
    const d = mapPetDetailDto({ idPet: 1, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'SRD', dtNascimento: '2021-03-10', sgSexo: 'M', sgPorte: 'M', nmClinica: 'K', nrConsultas: 0 } as any);
    expect(d.dsStatusGeral).toBeUndefined();
  });
});

describe('data ausente ou ilegível (I2 do G2): nunca "em dia"', () => {
  const SEM = { id: 99, nmVacina: 'Raiva', dtAplicacao: 'lixo', dtProximaDose: 'lixo', nmClinica: 'KURA', sgStatus: 'VENCENDO' as const };

  it.each(['lixo', '', undefined])('classificarVacina(%p) => SEM_DATA e a cópia não mostra "Invalid Date"', d => {
    const v = { dtProximaDose: d as any, dtAplicacao: d as any };
    expect(classificarVacina(v)).toBe('SEM_DATA');
    expect(quandoVacina(v)).toBe('sem data prevista');
    expect(quandoVacina(v)).not.toMatch(/Invalid/);
    expect(piorEstado(['EM_DIA', 'SEM_DATA'])).toBe('SEM_DATA');
    expect(piorEstado(['VENCENDO', 'SEM_DATA'])).toBe('VENCENDO');
  });

  it('Saúde: fica numa seção própria, fora do contador "EM DIA", sem "Tudo em dia!" e sem "Invalid Date"', () => {
    const OK1: PetFx = { ...BIA, id: 1 };
    mockPets = { ...base, data: [OK1] };
    mockVacinas = [{ ...base, data: [SEM, vac(1, 'V10', 200)] }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(numero(r, /^EM DIA · \d+$/)).toBe(1);
    expect(numero(r, /^SEM DATA PREVISTA · \d+$/)).toBe(1);
    expect(r.getAllByText('Em dia')).toHaveLength(1);
    expect(r.getByText('Sem data')).toBeTruthy();
    expect(r.queryByText('Tudo em dia!')).toBeNull();
    expect(r.queryByText(/Invalid/)).toBeNull();
  });

  it('aba Vacinas: banner e seção dizem "sem data prevista", nunca "Vacinação em dia"', () => {
    mockTab = { ...base, data: [SEM] };
    const r = render(<VacinasTab petId={1} />, { wrapper: W });
    expect(r.getByText('1 vacina sem data prevista')).toBeTruthy();
    expect(r.queryByText('Vacinação em dia')).toBeNull();
    expect(numero(r, /^SEM DATA PREVISTA · \d+$/)).toBe(1);
    expect(r.queryByText(/^EM DIA/)).toBeNull();
    expect(r.queryByText(/Invalid/)).toBeNull();
  });

  // BR-TUT-T11 (m-d da T06): SEM_DATA não pode ir para "PEDEM ATENÇÃO" (duplicada, e com Agendar) — antes só a Saúde era travada.
  it('aba Vacinas (m-d): vacina sem data fica só em "SEM DATA PREVISTA", fora de "PEDEM ATENÇÃO" e sem Agendar', () => {
    mockTab = { ...base, data: [SEM, vac(1, 'V10', 12)] };
    const r = render(<VacinasTab petId={1} />, { wrapper: W });
    expect(numero(r, /^PEDEM ATENÇÃO · \d+$/)).toBe(1);
    expect(numero(r, /^SEM DATA PREVISTA · \d+$/)).toBe(1);
    expect(r.getAllByText('Raiva')).toHaveLength(1);
    expect(r.queryByLabelText('Agendar Raiva')).toBeNull();
    expect(r.getByLabelText('Agendar V10')).toBeTruthy();
  });

  // BR-TUT-T11 (m-e da T06): em modo real (alertas dos pets desconhecidos) uma vacina sem data NÃO autoriza "Nenhuma vacina vence...".
  it('Saúde (m-e): alertas desconhecidos + vacina sem data => não afirma "Nenhuma vacina vence nos próximos 30 dias."', () => {
    const SEM_ALERTAS: PetFx = { ...BIA, id: 1, alertasAtivos: undefined, statusGeral: undefined };
    mockPets = { ...base, data: [SEM_ALERTAS] };
    mockVacinas = [{ ...base, data: [SEM] }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(numero(r, /^SEM DATA PREVISTA · \d+$/)).toBe(1);
    expect(r.queryByText(/Nenhuma vacina vence/)).toBeNull();
    expect(r.queryByText('Tudo em dia!')).toBeNull();
    // controle positivo: sem a vacina sem data, a frase aparece (o detector enxerga o que busca)
    mockVacinas = [{ ...base, data: [vac(1, 'V10', 200)] }];
    const ok = render(<SaudeScreen />, { wrapper: W });
    expect(ok.getByText(/Nenhuma vacina vence/)).toBeTruthy();
  });
});

describe('YYYY-MM-DD é data de calendário LOCAL (m2 do G2)', () => {
  it('o worker roda em São Paulo (globalSetup): UTC-3, onde a data-só lida como UTC recuaria um dia', () => {
    expect(NOW.getTimezoneOffset()).toBe(180);
  });

  it.each([
    ['2026-10-16', 'VENCENDO', 'vence hoje'],
    ['2026-10-15', 'VENCIDA', 'venceu há 1 dia'],
    ['2026-11-15', 'VENCENDO', 'vence em 30 dias'],
    ['2026-11-16', 'EM_DIA', 'em dia · próxima 16 de nov. de 2026'],
  ])('%s => %s, "%s"', (d, estado, quando) => {
    const v = { dtProximaDose: d, dtAplicacao: d };
    expect(classificarVacina(v)).toBe(estado);
    expect(quandoVacina(v)).toBe(quando);
  });
});

describe('modo real: a lista paginada do Java não traz status nem alertas (I1 do G2)', () => {
  // Formato REAL de GET /api/v1/tutor/pets: página do Spring com o `PetResponse` do Java (8 campos, nenhum de status/alerta).
  // ÂNCORA (regra 11): backend-tutor-java `main@d1522ee`, `tutor/api/dto/PetResponse.java:11-27`, conferido em 2026-10-16:
  //   grep -n "String\|Long" backend-tutor-java/src/main/java/br/com/clyvo/kura/tutor/tutor/api/dto/PetResponse.java
  const PAGINA = {
    content: [{ idPet: 1, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'SRD', sgSexo: 'M', sgPorte: 'M', dtNascimento: '2021-03-10', dsFotoThumbUrl: null }],
  } as any;
  const pets = () => mapListaPets(PAGINA).map(mapPetDto);

  it('o mapper não inventa: status e alertas ficam desconhecidos', () => {
    const [p] = pets();
    expect(p!.statusGeral).toBeUndefined();
    expect(p!.alertasAtivos).toBeUndefined();
  });

  it('Saúde: sem "Tudo em dia!" nem "Nenhum alerta ativo" — só o que a lista de vacinas sustenta', () => {
    mockPets = { ...base, data: pets() };
    mockVacinas = [{ ...base, data: [] }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.queryByText('Tudo em dia!')).toBeNull();
    expect(r.queryByText(/Nenhum alerta ativo/)).toBeNull();
    expect(r.queryByText('Tudo certo')).toBeNull();
    expect(r.getByText('Nenhuma vacina vence nos próximos 30 dias.')).toBeTruthy();
  });

  // Re-G2 BR-TUT-T06 I-1/m-c: no modo real nenhum contador ou seção de alerta é montado a partir de status/alerta ausente.
  it('Saúde: sem seção "PETS COM ALERTA" e nenhum "undefined" na tela', () => {
    mockPets = { ...base, data: pets() };
    mockVacinas = [{ ...base, data: [] }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.queryByText(/^PETS COM ALERTA/)).toBeNull();
    expect(r.queryByText(/undefined/)).toBeNull();
  });

  it('lista de pets: "N PETS" sem "ALERTAS" (nada de "0 ALERTAS" inventado)', () => {
    mockPets = { ...base, data: pets() };
    const r = render(<MeusPetsScreen />, { wrapper: W });
    expect(r.getByText(/^1 PETS?$/)).toBeTruthy();
    expect(r.queryByText(/ALERTAS/)).toBeNull();
  });

  // Reprodução do maestro (BR-TUT-T06): `pets.every` → `pets.some` sobrevivia (659/659) porque só havia "todos conhecidos" ou
  // "todos desconhecidos". Basta UM pet sem contagem para o "Tudo em dia!" deixar de ter fonte.
  it('um pet com contagem conhecida e outro sem: ainda sem "Tudo em dia!"', () => {
    const [desconhecido] = pets();
    mockPets = { ...base, data: [{ ...BIA, id: 9 }, { ...desconhecido!, id: 10 }] };
    mockVacinas = [{ ...base, data: [] }, { ...base, data: [] }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.queryByText('Tudo em dia!')).toBeNull();
    expect(r.getByText('Nenhuma vacina vence nos próximos 30 dias.')).toBeTruthy();
  });

  it('cartão da lista e detalhe: sem "Tudo certo", sem chip de status', () => {
    const [p] = pets();
    const card = render(<PetListCard pet={p!} onPress={jest.fn()} />, { wrapper: W });
    expect(card.queryByText('Tudo certo')).toBeNull();
    mockPets = { ...base, data: [p] };
    mockDetalhe = { ...base, data: DETALHE };
    const det = render(<PetDetailScreen />, { wrapper: W });
    expect(det.queryByText('Tudo certo')).toBeNull();
    expect(det.queryByText('Atenção')).toBeNull();
    expect(det.queryByText('Urgente')).toBeNull();
  });
});

describe('VacinaItem mostra o que veio no dado (m6 do G2)', () => {
  const COMPLETA = { id: 1, nmVacina: 'V10', dtAplicacao: em(-120), dtProximaDose: em(245), nmClinica: 'KURA', nmVeterinario: 'Dra. Ana', nrLote: 'L123', sgStatus: 'EM_DIA' as const };

  it('veterinário, lote e data de aplicação, sem emoji', () => {
    const r = render(<VacinaItem vacina={COMPLETA} />, { wrapper: W });
    expect(r.getByText('KURA · Dra. Ana')).toBeTruthy();
    expect(r.getByText(/^Aplicada em .*2026.* · lote L123$/)).toBeTruthy();
    expect(JSON.stringify(r.toJSON())).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('a view do Java não tem data de aplicação (mapper deixa dtAplicacao ausente): não se afirma "Aplicada em"', () => {
    const { dtAplicacao: _ausente, ...semAplicacao } = vac(1, 'V10', 12);
    const r = render(<VacinaItem vacina={semAplicacao} />, { wrapper: W });
    expect(r.queryByText(/Aplicada em/)).toBeNull();
    expect(r.queryByText(/lote/)).toBeNull();
  });
});
