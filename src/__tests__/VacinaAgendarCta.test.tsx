// BR-TUT-T07 fix wave (I-3): o botão AGENDAR de uma vacina que pede atenção abre "Pedir horário" com o motivo Vacina e o pet certo.
// Relógio fixo; fixture assimétrica (o pet com a vacina é o do MEIO, id 22).
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import SaudeScreen from '../app/(tabs)/saude/index';
import { VacinasTab } from '../components/domain/VacinasTab';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }) }));

const NOW = new Date(2026, 9, 16, 12, 0);
const TIMERS_REAIS = ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] as const;
beforeAll(() => { jest.useFakeTimers({ now: NOW, doNotFake: [...TIMERS_REAIS] }); });
afterAll(() => { jest.useRealTimers(); });
beforeEach(() => mockPush.mockClear());

const em = (dias: number) => new Date(2026, 9, 16 + dias, 12, 0).toISOString();
const mockVACINA = { id: 10, nmVacina: 'Antirrábica', dtAplicacao: em(12), dtProximaDose: em(12), nmClinica: 'KURA', sgStatus: 'VENCENDO' as const };
const pet = (id: number, nome: string) => ({ id, nome, especie: 'Cão', raca: 'SRD', idadeAnos: 3, sexo: 'M', porte: 'M', statusGeral: 'OK' as const, alertasAtivos: 0, chips: [], nmClinica: 'KURA' });
const mockBase = { isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 1 };
const mockPETS = [pet(11, 'Mel'), pet(22, 'Thor'), pet(33, 'Bidu')];
let mockVacinas: any[];
jest.mock('../hooks/usePets', () => ({ usePets: () => ({ ...mockBase, data: mockPETS }) }));
jest.mock('../services/vacinas.service', () => ({ getVacinas: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ ...jest.requireActual('@tanstack/react-query'), useQueries: () => mockVacinas }));
jest.mock('../hooks/usePetVacinas', () => ({ usePetVacinas: () => ({ ...mockBase, data: [mockVACINA] }) }));

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('AGENDAR vacina => Pedir horário com tipo VACINA e o pet certo', () => {
  it('Saúde: o pet é o da vacina (22, o do meio), não o 1º nem o último', () => {
    mockVacinas = [{ ...mockBase, data: [] }, { ...mockBase, data: [mockVACINA] }, { ...mockBase, data: [] }];
    const r = render(<SaudeScreen />, { wrapper: W });
    fireEvent.press(r.getByLabelText('Agendar Antirrábica'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toMatchObject({ pathname: '/agenda/novo', params: { idPet: '22', tipo: 'VACINA' } });
  });

  it('aba Vacinas do pet 7: idPet "7" e tipo VACINA', () => {
    const r = render(<VacinasTab petId={7} />, { wrapper: W });
    fireEvent.press(r.getByLabelText('Agendar Antirrábica'));
    expect(mockPush.mock.calls[0][0]).toMatchObject({ pathname: '/agenda/novo', params: { idPet: '7', tipo: 'VACINA' } });
  });
});
