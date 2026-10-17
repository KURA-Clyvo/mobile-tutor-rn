// BR-TUT-G4 m-6: "VER SAÚDE" da notificação abre o perfil do pet JÁ na aba Vacinas (?tab=vacinas); sem o parâmetro, Visão geral.
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import PetDetailScreen from '../app/(tabs)/pets/[id]/index';

let mockParams: any;
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
}));
const PET = { id: 1, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10', sgSexo: 'M', sgPorte: 'G', nmClinica: 'Clínica KURA', dsStatusGeral: 'OK', nrAlertasAtivos: 0, nrConsultas: 5, chips: [] };
const mockBase = { isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 1 };
jest.mock('../hooks/usePetDetail', () => ({ usePetDetail: () => ({ ...mockBase, data: PET }) }));
jest.mock('../hooks/usePets', () => ({ usePets: () => ({ ...mockBase, data: [{ id: 1, statusGeral: 'OK' }] }) }));
jest.mock('../components/domain/VacinasTab', () => ({ VacinasTab: () => { const { Text } = require('react-native'); return <Text>ABA-VACINAS</Text>; } }));
const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('perfil do pet — parâmetro tab', () => {
  it('tab=vacinas abre a aba Vacinas', () => {
    mockParams = { id: '1', tab: 'vacinas' };
    expect(render(<PetDetailScreen />, { wrapper: W }).queryByText('ABA-VACINAS')).toBeTruthy();
  });
  it('sem tab abre a Visão geral', () => {
    mockParams = { id: '1' };
    expect(render(<PetDetailScreen />, { wrapper: W }).queryByText('ABA-VACINAS')).toBeNull();
  });
});
