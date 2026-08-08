import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AddPetScreen from '../app/(tabs)/pets/novo';

// TASK-69: não existe endpoint de criação de pet neste ecossistema (PET é
// tabela .NET-owned; o BFF Java só expõe GET para pets). A tela nunca deve
// afirmar que persistiu um cadastro que nenhuma chamada de API tentou fazer.

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const W = ({ children }: any) => (
  <QueryClientProvider client={client}>
    <ThemeProvider>{children}</ThemeProvider>
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
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const utils = render(<AddPetScreen />, { wrapper: W });
    preencherEEnviar(utils);

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    const titulosExibidos = alertSpy.mock.calls.map(call => call[0]);
    expect(titulosExibidos).not.toContain('Pet cadastrado!');
    alertSpy.mockRestore();
  });

  it('orienta o tutor a procurar a clínica, sem prometer notificação que ninguém dispara', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const utils = render(<AddPetScreen />, { wrapper: W });
    preencherEEnviar(utils);

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(
      'Solicite à sua clínica',
      expect.stringContaining('Rex'),
      expect.any(Array),
    ));
    const ultimaChamada = alertSpy.mock.calls.at(-1);
    const corpo = ultimaChamada?.[1];
    expect(corpo).not.toMatch(/notifica/i);
    alertSpy.mockRestore();
  });
});
