import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';

import NovoAgendamentoScreen from '../app/(tabs)/agenda/novo';

// G2 FT-09 (M-4/frente 5): prova que o card de confirmação de agendamento
// mostra a foto (thumb) do pet selecionado — o dado já chega via usePets()
// desde a FT-09, mas a tela não estava ligando ao KPetPortrait. Sem isto, o
// tutor via a foto do Bóbi na lista, tocava em "agendar" e o card de
// confirmação mostrava a ilustração. Literais próprios (regra do ciclo: não
// importar constantes do módulo testado para montar o esperado).
const FOTO_THUMB_URL =
  'https://kura-tutor.vercel.app/proxy/tutor/api/v1/fotos/clinica/1/pet/2/uuid-fixo_256.webp?exp=1790000000&sig=deadbeef';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
}));

jest.mock('../hooks/usePets', () => ({
  usePets: () => ({
    data: [
      {
        id: 1, nome: 'Bóbi', especie: 'Cão', raca: 'Labrador', nascimento: new Date('2021-03-10'),
        sexo: 'M' as const, porte: 'G' as const, nmClinica: 'Clínica KURA', statusGeral: 'OK' as const,
        alertasAtivos: 0, idadeAnos: 4, chips: [], fotoThumbUrl: FOTO_THUMB_URL,
      },
    ],
  }),
}));

jest.mock('../hooks/useAgendamentos', () => ({
  useSolicitarAgendamento: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@components/primitives/KDialog', () => ({
  useDialog: () => ({ alerta: jest.fn(), mostrar: jest.fn() }),
}));

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('NovoAgendamentoScreen — foto do pet no card de confirmação (FT-09)', () => {
  it('o card de confirmação recebe a thumb do pet selecionado', () => {
    const { getByTestId } = render(<NovoAgendamentoScreen />, { wrapper: W });
    const foto = getByTestId('k-pet-portrait-foto');
    expect(foto.props.source[0].uri).toBe(FOTO_THUMB_URL);
  });

  // Mordida: remover `fotoUrl={selectedPet.fotoThumbUrl}` de agenda/novo.tsx
  // faz este teste falhar (o card volta a mostrar a ilustração).
  it('mordida-alvo: sem fotoUrl, o card não teria imagem real nenhuma', () => {
    const { queryByTestId } = render(<NovoAgendamentoScreen />, { wrapper: W });
    expect(queryByTestId('k-pet-portrait-foto')).not.toBeNull();
  });
});
