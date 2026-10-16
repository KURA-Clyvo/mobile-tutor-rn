// BR-TUT-T06 — Saúde: de quem e quando. Contador = itens desenhados; uma fonte para o estado da vacina e do pet.
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import SaudeScreen from '../app/(tabs)/saude/index';
import PetDetailScreen from '../app/(tabs)/pets/[id]/index';
import { VacinasTab } from '../components/domain/VacinasTab';
import { PetListCard } from '../components/domain/PetListCard';
import { classificarVacina, fraseSaude, quandoVacina } from '../utils/vacinas';
import { STATUS_PET } from '../utils/statusPet';
import { mapPetDetailDto } from '../utils/mappers';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
  useLocalSearchParams: () => ({ id: '1' }),
}));

const DIA = 86_400_000;
const em = (dias: number) => new Date(Date.now() + dias * DIA + 3_600_000).toISOString();
const vac = (id: number, nmVacina: string, dias: number) =>
  ({ id, nmVacina, dtAplicacao: em(dias), dtProximaDose: em(dias), nmClinica: 'KURA', sgStatus: 'VENCENDO' as const });

const THOR = { id: 1, nome: 'Thor', especie: 'Cão', raca: 'SRD', idadeAnos: 3, sexo: 'M', porte: 'M', statusGeral: 'ALERTA' as const, alertasAtivos: 1, chips: [], nmClinica: 'KURA' };
const MEL = { ...THOR, id: 2, nome: 'Mel', especie: 'Gato', statusGeral: 'URGENTE' as const, alertasAtivos: 2 };
const BIA = { ...THOR, id: 3, nome: 'Bia', statusGeral: 'OK' as const, alertasAtivos: 0 };
const VACINAS_POR_PET: Record<number, ReturnType<typeof vac>[]> = {
  1: [vac(10, 'Antirrábica', 12), vac(11, 'V10', 200)],
  2: [vac(20, 'V4 felina', -7)],
  3: [vac(30, 'Giárdia', 150)],
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
const resp = (pets: (typeof THOR)[]) => pets.map(p => ({ ...base, data: VACINAS_POR_PET[p.id] }));

describe('Saúde — contadores derivam da lista exibida', () => {
  it('cada contador = itens desenhados (3 pets, vencida / vencendo / em dia)', () => {
    mockPets = { ...base, data: [THOR, MEL, BIA] };
    mockVacinas = resp([THOR, MEL, BIA]);
    const r = render(<SaudeScreen />, { wrapper: W });

    expect(numero(r, /^VACINAS QUE PEDEM ATENÇÃO · \d+$/)).toBe(r.getAllByLabelText(/^Agendar /).length);
    expect(r.getAllByLabelText(/^Agendar /)).toHaveLength(2);
    expect(numero(r, /^EM DIA · \d+$/)).toBe(r.getAllByText('Em dia').length);
    expect(r.getAllByText('Em dia')).toHaveLength(2);
    expect(numero(r, /^PETS COM ALERTA · \d+$/)).toBe(r.getAllByLabelText('Ver detalhes').length);
    expect(r.getAllByLabelText('Ver detalhes')).toHaveLength(2);
    expect(r.getByText('3 PETS')).toBeTruthy();
    expect(r.getAllByText('Vencida')).toHaveLength(1);
    expect(r.getAllByText('Vencendo')).toHaveLength(1);
    // a soma dos itens desenhados = as vacinas da fixture
    expect(r.getAllByLabelText(/^Agendar /).length + r.getAllByText('Em dia').length).toBe(
      Object.values(VACINAS_POR_PET).flat().length,
    );
  });

  it('cada vacina diz de qual pet é, o nome e quando', () => {
    mockPets = { ...base, data: [THOR, MEL, BIA] };
    mockVacinas = resp([THOR, MEL, BIA]);
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByText('Antirrábica · Thor')).toBeTruthy();
    expect(r.getByText('vence em 12 dias')).toBeTruthy();
    expect(r.getByText('V4 felina · Mel')).toBeTruthy();
    expect(r.getByText('venceu há 7 dias')).toBeTruthy();
    expect(r.getByText('2 vacinas pedem atenção.')).toBeTruthy();
  });

  it('voz do DS para um caso só', () => {
    mockPets = { ...base, data: [THOR] };
    mockVacinas = [{ ...base, data: [vac(10, 'Antirrábica', 12)] }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByText('Thor tem uma vacina vencendo em 12 dias.')).toBeTruthy();
  });

  it('erro COM dado salvo: as vacinas continuam com pet e quando, e a faixa de dados salvos aparece', () => {
    mockPets = { ...base, data: [THOR], isError: true, dataUpdatedAt: Date.now() - 5 * 60_000 };
    mockVacinas = [{ ...base, data: [vac(10, 'Antirrábica', 12)], dataUpdatedAt: Date.now() - 5 * 60_000 }];
    const r = render(<SaudeScreen />, { wrapper: W });
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.getByText('Antirrábica · Thor')).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
  });
});

describe('uma fonte para o estado', () => {
  const FIXTURES = [vac(1, 'A', -3), vac(2, 'B', 0), vac(3, 'C', 30), vac(4, 'D', 31), vac(5, 'E', 335)];

  it('fronteiras de classificarVacina e do texto "quando"', () => {
    expect(FIXTURES.map(v => classificarVacina(v))).toEqual(['VENCIDA', 'VENCENDO', 'VENCENDO', 'EM_DIA', 'EM_DIA']);
    expect(quandoVacina(FIXTURES[0]!)).toBe('venceu há 3 dias');
    expect(quandoVacina(FIXTURES[1]!)).toBe('vence hoje');
    expect(quandoVacina(vac(9, 'F', 1))).toBe('vence em 1 dia');
    expect(fraseSaude([])).toBe('Nenhuma vacina pedindo atenção.');
  });

  it('a mesma lista tem os mesmos chips na Saúde e na aba Vacinas do pet', () => {
    mockPets = { ...base, data: [THOR] };
    mockVacinas = [{ ...base, data: FIXTURES }];
    const saude = render(<SaudeScreen />, { wrapper: W });
    mockTab = { ...base, data: { vacinas: FIXTURES, status: { nrAplicadas: 0, nrTotal: 5, dsStatusGeral: 'ALERTA' } } };
    const aba = render(<VacinasTab petId={1} />, { wrapper: W });
    for (const chip of ['Vencida', 'Vencendo', 'Em dia']) {
      expect(aba.queryAllByText(chip).length).toBe(saude.queryAllByText(chip).length);
    }
    expect(aba.getAllByText('Vencendo')).toHaveLength(2);
    // a faixa da aba é a conta da própria lista
    expect(aba.getByText('1 vacina vencida — agende já')).toBeTruthy();
    expect(aba.getByText('2 outras vencendo')).toBeTruthy();
    expect(numero(aba, /^PEDEM ATENÇÃO · \d+$/)).toBe(3);
    expect(numero(aba, /^EM DIA · \d+$/)).toBe(2);
    // sem o "0/5" do resumo do servidor (o 0 não tem fonte)
    expect(aba.queryByText(/^\d+\/\d+$/)).toBeNull();
  });

  it.each(['OK', 'ALERTA', 'URGENTE'] as const)('status do pet %s: o detalhe mostra o mesmo texto da lista', status => {
    const pet = { ...THOR, statusGeral: status };
    mockPets = { ...base, data: [pet] };
    mockDetalhe = {
      ...base,
      data: { id: 1, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'SRD', dtNascimento: '2021-03-10', sgSexo: 'M', sgPorte: 'M', nmClinica: 'KURA', nrAlertasAtivos: 0, nrConsultas: 1, chips: [] },
    };
    const lista = render(<PetListCard pet={pet as any} onPress={jest.fn()} />, { wrapper: W });
    const detalhe = render(<PetDetailScreen />, { wrapper: W });
    expect(lista.getAllByText(STATUS_PET[status].label).length).toBeGreaterThan(0);
    expect(detalhe.getAllByText(STATUS_PET[status].label)).toHaveLength(1);
  });

  it('o mapper do detalhe não inventa status', () => {
    const d = mapPetDetailDto({ idPet: 1, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'SRD', dtNascimento: '2021-03-10', sgSexo: 'M', sgPorte: 'M', nmClinica: 'K', nrConsultas: 0 } as any);
    expect(d.dsStatusGeral).toBeUndefined();
  });
});
