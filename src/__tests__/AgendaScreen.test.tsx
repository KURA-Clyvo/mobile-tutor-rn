import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';

import AgendaScreen from '../app/(tabs)/agenda/index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const mockCancelar = jest.fn();
jest.mock('../hooks/useAgendamentos', () => ({
  useAgendamentos:          () => ({ data: [
    { id: 1, dtInicio: new Date(Date.now() + 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'RETORNO', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'KURA', dsMotivo: '' },
  ], isLoading: false, refetch: jest.fn() }),
  useCancelarAgendamento:   () => ({ mutate: mockCancelar, isPending: false }),
  useAgendamentoBadgeCount: () => 1,
}));

// TASK-F06: a tela usa `useDialog()` (KDialog substituiu Alert.alert), que
// exige o KDialogProvider na árvore — mesma ordem da raiz (_layout.tsx:
// ThemeProvider > KDialogProvider).
const W = ({ children }: any) => (
  <ThemeProvider>
    <KDialogProvider>{children}</KDialogProvider>
  </ThemeProvider>
);

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

// TASK-F06: fluxo DESTRUTIVO — a migração de Alert.alert para KDialog não pode
// transformar a confirmação em ação direta. Estes 2 casos travam isso: um prova
// que cancelar(id) NÃO roda antes/sem a confirmação, o outro que ele roda ao
// confirmar. Não existia teste desta confirmação antes desta task.
describe('AgendaScreen — cancelamento exige confirmação (TASK-F06)', () => {
  beforeEach(() => mockCancelar.mockClear());

  // O gesto que abre a confirmação é o toque longo no cartão do agendamento
  // (AgendamentoItem só liga onLongPress quando o item é cancelável).
  const longPressNoItem = (utils: ReturnType<typeof render>) =>
    fireEvent(utils.getByText('Bóbi'), 'longPress');

  it('abre o diálogo e NÃO cancela enquanto o tutor não confirmar', async () => {
    const utils = render(<AgendaScreen />, { wrapper: W });
    await waitFor(() => expect(utils.getByText('Bóbi')).toBeTruthy());

    longPressNoItem(utils);

    await waitFor(() => expect(utils.getByTestId('kdialog-titulo').props.children)
      .toBe('Cancelar agendamento?'));
    expect(mockCancelar).not.toHaveBeenCalled();

    // Botão de cancelar do diálogo mantém o rótulo original 'Voltar'.
    fireEvent.press(utils.getByTestId('kdialog-acao-__cancelar__'));
    await waitFor(() => expect(utils.queryByTestId('kdialog-card')).toBeNull());
    expect(mockCancelar).not.toHaveBeenCalled();
  });

  it('cancela o agendamento quando o botão destrutivo é tocado', async () => {
    const utils = render(<AgendaScreen />, { wrapper: W });
    await waitFor(() => expect(utils.getByText('Bóbi')).toBeTruthy());

    longPressNoItem(utils);
    await waitFor(() => expect(utils.getByTestId('kdialog-acao-__confirmar__')).toBeTruthy());

    const destrutivo = utils.getByTestId('kdialog-acao-__confirmar__');
    expect(destrutivo.props.accessibilityHint).toBe('Ação destrutiva. Não pode ser desfeita.');
    fireEvent.press(destrutivo);

    await waitFor(() => expect(mockCancelar).toHaveBeenCalledWith(1));
  });
});
