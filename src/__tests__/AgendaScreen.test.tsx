import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../hooks/useAgendamentos', () => ({
  useAgendamentos:          () => ({ data: [
    { id: 1, dtInicio: new Date(Date.now() + 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'RETORNO', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'KURA', dsMotivo: '' },
  ], isLoading: false, refetch: jest.fn() }),
  useCancelarAgendamento:   () => ({ mutate: jest.fn(), isPending: false }),
  useAgendamentoBadgeCount: () => 1,
}));

import AgendaScreen from '../app/(tabs)/agenda/index';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('AgendaScreen', () => {
  it('shows Bóbi in próximos', async () => {
    const { getByText } = render(<AgendaScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Bóbi')).toBeTruthy());
  });
  it('shows chip Aguardando for SOLICITADO', async () => {
    const { getByText } = render(<AgendaScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Aguardando')).toBeTruthy());
  });
});
