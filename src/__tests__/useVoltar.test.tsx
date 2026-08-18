// src/__tests__/useVoltar.test.tsx
//
// TASK-F02: useVoltar() é a rede de segurança para as 9 chamadas de
// router.back() do app, nenhuma das quais verificava router.canGoBack().
// Estes testes provam a mordida: com canGoBack() mockado devolvendo
// `false` (tela alcançada por deep link/notificação, sem histórico),
// contra o comportamento ANTIGO (back() às cegas) a chamada não tem para
// onde voltar; contra o hook, cai em replace(destino) — sem crash, sem
// tela travada.
import React from 'react';
import { Pressable, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { useVoltar } from '../hooks/useVoltar';

const mockBack       = jest.fn();
const mockReplace    = jest.fn();
const mockCanGoBack  = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back:       mockBack,
    replace:    mockReplace,
    canGoBack:  mockCanGoBack,
  }),
}));

// Componente mínimo que expõe voltar() atrás de um Pressable — testa o hook
// do jeito que ele é de fato consumido pelas telas reais.
function ScreenRN({ destino }: { destino: string }) {
  const voltar = useVoltar(destino as any);
  return (
    <Pressable onPress={voltar} accessibilityRole="button" accessibilityLabel="Voltar">
      <Text>Voltar</Text>
    </Pressable>
  );
}

beforeEach(() => {
  mockBack.mockClear();
  mockReplace.mockClear();
  mockCanGoBack.mockReset();
});

describe('useVoltar — com histórico (comportamento preservado)', () => {
  it('chama router.back() e NUNCA replace quando canGoBack() é true', () => {
    mockCanGoBack.mockReturnValue(true);
    const { getByLabelText } = render(<ScreenRN destino="/(tabs)/pets" />);

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('useVoltar — sem histórico (rede de segurança)', () => {
  it('cai em replace(destino) e NUNCA chama back() quando canGoBack() é false', () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByLabelText } = render(<ScreenRN destino="/(tabs)/pets" />);

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/pets');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('respeita o destino de fallback declarado pelo chamador (register.tsx -> /login)', () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByLabelText } = render(<ScreenRN destino="/login" />);

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});

// --- Prova de mordida: simulação do código ANTIGO (router.back() às cegas,
// sem checar canGoBack()) para deixar registrado, no próprio arquivo de
// teste, o que o comportamento pré-fix teria feito no mesmo cenário.
describe('useVoltar — prova de mordida contra o padrão antigo', () => {
  it('código antigo (router.back() sem canGoBack): chamaria back() às cegas mesmo sem histórico', () => {
    mockCanGoBack.mockReturnValue(false);

    function ScreenAntiga() {
      const router = { back: mockBack, canGoBack: mockCanGoBack, replace: mockReplace };
      return (
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar">
          <Text>Voltar</Text>
        </Pressable>
      );
    }

    const { getByLabelText } = render(<ScreenAntiga />);
    fireEvent.press(getByLabelText('Voltar'));

    // Comportamento antigo: back() é chamado incondicionalmente, ignorando
    // que canGoBack() é false — é exatamente o bug que a F02 corrige.
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('código novo (useVoltar): no mesmo cenário sem histórico, NUNCA chama back()', () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByLabelText } = render(<ScreenRN destino="/(tabs)/pets" />);

    fireEvent.press(getByLabelText('Voltar'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/pets');
  });
});
