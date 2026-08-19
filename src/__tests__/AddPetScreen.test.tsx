import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AddPetScreen from '../app/(tabs)/pets/novo';

// TASK-69: não existe endpoint de criação de pet neste ecossistema (PET é
// tabela .NET-owned; o BFF Java só expõe GET para pets). A tela nunca deve
// afirmar que persistiu um cadastro que nenhuma chamada de API tentou fazer.

const mockBack = jest.fn();
// TASK-F02 (rodada de fix 1): useVoltar() (usado por AddPetScreen desde a
// migração) chama router.canGoBack() — sem isso no mock, um teste futuro
// que pressione "Voltar"/"CANCELAR" quebra com "canGoBack is not a
// function".
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
// TASK-F06: a tela deixou de chamar Alert.alert (nativo, espionável com
// jest.spyOn) e passou a usar `useDialog()`. O wrapper monta o KDialogProvider
// REAL na mesma ordem da raiz (_layout.tsx: Theme > KDialog), então as
// asserções abaixo leem o diálogo de verdade renderizado na árvore — não um
// dublê. É mais forte que espionar a chamada: prova que o texto chega à tela.
const W = ({ children }: any) => (
  <QueryClientProvider client={client}>
    <ThemeProvider>
      <KDialogProvider>{children}</KDialogProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

function preencherEEnviar(utils: ReturnType<typeof render>) {
  const { getByLabelText, getByText } = utils;
  fireEvent.changeText(getByLabelText('Nome do pet'), 'Rex');
  fireEvent.press(getByText('CÃO'));
  fireEvent.press(getByText('Macho'));
  fireEvent.press(getByText('Cadastrar pet'));
}

describe('AddPetScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('nunca afirma "Pet cadastrado!" — não existe chamada de API que persista o pet', async () => {
    const utils = render(<AddPetScreen />, { wrapper: W });
    preencherEEnviar(utils);

    // Antes (Alert.alert): esperava "algum alert foi chamado" e conferia que
    // nenhum TÍTULO era 'Pet cadastrado!'. Agora: espera o diálogo aparecer de
    // fato e assere o título EXATO exibido — mais específico que "not.toContain"
    // — e ainda confere que a string proibida não aparece em lugar nenhum da
    // árvore renderizada (título OU mensagem OU botão), o que a versão antiga
    // nem conseguia olhar.
    await waitFor(() => expect(utils.getByTestId('kdialog-card')).toBeTruthy());
    expect(utils.getByTestId('kdialog-titulo').props.children).toBe('Solicite à sua clínica');
    expect(utils.queryByText('Pet cadastrado!')).toBeNull();
  });

  it('orienta o tutor a procurar a clínica, sem prometer notificação que ninguém dispara', async () => {
    const utils = render(<AddPetScreen />, { wrapper: W });
    preencherEEnviar(utils);

    // Antes: toHaveBeenCalledWith(titulo, stringContaining('Rex'), any(Array)).
    // Agora, ponto a ponto: título exato; corpo contém 'Rex'; o terceiro
    // argumento (`expect.any(Array)`, que só provava "havia botões") vira a
    // asserção NOMEADA de que o botão OK existe na tela.
    await waitFor(() => expect(utils.getByTestId('kdialog-titulo').props.children).toBe('Solicite à sua clínica'));
    const corpo = utils.getByTestId('kdialog-mensagem').props.children as string;
    expect(corpo).toContain('Rex');
    expect(utils.getByTestId('kdialog-acao-OK')).toBeTruthy();
    expect(corpo).not.toMatch(/notifica/i);
  });
});
