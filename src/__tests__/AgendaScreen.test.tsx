import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';

import AgendaScreen from '../app/(tabs)/agenda/index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const mockCancelar = jest.fn();
let mockExtras: any[] = []; // pedidos a mais (BR-TUT-T10 fix wave I-1); vazio = fixture original de 1 item
jest.mock('../hooks/useAgendamentos', () => ({
  useAgendamentos:          () => ({ data: [
    ...mockExtras,
    { id: 1, dtInicio: new Date(Date.now() + 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'RETORNO', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'KURA', dsMotivo: '' },
  ], isLoading: false, refetch: jest.fn() }),
  useCancelarAgendamento:   () => ({ mutateAsync: mockCancelar, isPending: false }),
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

  // BR-TUT-T10: o gatilho é o botão visível "Cancelar agendamento" do card (o toque longo saiu).
  const longPressNoItem = (utils: ReturnType<typeof render>) =>
    fireEvent.press(utils.getByLabelText(/^Cancelar agendamento de Bóbi/));

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

// BR-TUT-T10 fix wave (I-1): com 2+ pedidos cancelaveis, o id cancelado e o do botao tocado (nao o 1o da lista).
describe('AgendaScreen — cancela o pedido certo (BR-TUT-T10 I-1)', () => {
  const dia = (n: number) => new Date(Date.now() + n * 86400_000).toISOString();
  beforeEach(() => {
    mockCancelar.mockClear();
    mockExtras = [
      { id: 2, dtInicio: dia(3), nrDuracaoMinutos: 30, sgStatus: 'AGENDADO', sgTipoConsulta: 'ROTINA', pet: { id: 2, nmPet: 'Mel', nmEspecie: 'Gato', nmRaca: 'Siamês' }, nmClinica: 'KURA', dsMotivo: '' },
      { id: 3, dtInicio: dia(5), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'VACINA', pet: { id: 3, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'Boxer' }, nmClinica: 'KURA', dsMotivo: '' },
    ];
  });
  afterEach(() => { mockExtras = []; });

  it.each([['Mel', 2], ['Thor', 3], ['Bóbi', 1]] as const)('tocar no botao do %s cancela o id %i', async (pet, id) => {
    const u = render(<AgendaScreen />, { wrapper: W });
    await waitFor(() => expect(u.getByText(pet)).toBeTruthy());
    expect(u.getAllByText('Cancelar agendamento')).toHaveLength(3);
    fireEvent.press(u.getByLabelText(new RegExp(`^Cancelar agendamento de ${pet} `)));
    await waitFor(() => expect(u.getByTestId('kdialog-acao-__confirmar__')).toBeTruthy());
    fireEvent.press(u.getByTestId('kdialog-acao-__confirmar__'));
    await waitFor(() => expect(mockCancelar).toHaveBeenCalledTimes(1));
    expect(mockCancelar).toHaveBeenCalledWith(id);
  });
});
