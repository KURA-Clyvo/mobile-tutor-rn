import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';

import AddPetScreen from '../app/(tabs)/pets/novo';

// TASK-69 / BR-TUT-T10: não existe endpoint de criação de pet neste ecossistema (PET é tabela .NET-owned;
// o BFF Java só expõe GET para pets). A tela é INFORMATIVA: não coleta nada para jogar fora, não pede
// câmera/galeria e nunca afirma que um cadastro foi feito.

const mockBack = jest.fn();
const mockImagePicker = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
}));
jest.mock('expo-image-picker', () => new Proxy({}, { get: () => mockImagePicker }));

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('AddPetScreen (informativa)', () => {
  beforeEach(() => { mockBack.mockClear(); mockImagePicker.mockClear(); });

  it('diz que o cadastro é feito na clínica, em 3 passos, sem prometer nada que o app não faz', () => {
    const u = render(<AddPetScreen />, { wrapper: W });
    expect(u.getByText(/feito na clínica/)).toBeTruthy();
    expect(u.getByText('COMO FAZER')).toBeTruthy();
    expect(u.getByText('Fale com a sua clínica.')).toBeTruthy();
    expect(u.getByText(/Informe nome, espécie, raça e sexo/)).toBeTruthy();
    expect(u.getByText(/aparece em Meus pets/)).toBeTruthy();
    expect(u.queryByText('Pet cadastrado!')).toBeNull();
    expect(u.queryByText(/notifica/i)).toBeNull();
  });

  it('não tem formulário, nem "Cadastrar pet", nem "1 DE 2", e não pede câmera/galeria', () => {
    const u = render(<AddPetScreen />, { wrapper: W });
    expect(u.UNSAFE_queryAllByType(require('react-native').TextInput)).toHaveLength(0);
    expect(u.queryByText('Cadastrar pet')).toBeNull();
    expect(u.queryByText(/1 DE 2/)).toBeNull();
    expect(u.queryByLabelText('Nome do pet')).toBeNull();
    expect(mockImagePicker).not.toHaveBeenCalled();
  });

  it('"Entendi" e o botão Voltar voltam', () => {
    const u = render(<AddPetScreen />, { wrapper: W });
    fireEvent.press(u.getByText('Entendi'));
    expect(mockBack).toHaveBeenCalledTimes(1);
    fireEvent.press(u.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(2);
  });
});
