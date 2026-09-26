import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';

import PetDetailScreen from '../app/(tabs)/pets/[id]/index';

// FT-09 (KURA_BACKLOG_FOTO_PET): prova que o detalhe passa a variante 1080
// (regra A5 — só o detalhe baixa a variante grande) ao KPetPortrait do hero.
// Literais próprios (regra do ciclo: não importar constantes do módulo
// testado para montar o esperado).
const FOTO_1080_URL =
  'https://kura-tutor.vercel.app/proxy/tutor/api/v1/fotos/clinica/1/pet/2/uuid-fixo_1080.webp?exp=1790000000&sig=deadbeef';
const FOTO_THUMB_URL =
  'https://kura-tutor.vercel.app/proxy/tutor/api/v1/fotos/clinica/1/pet/2/uuid-fixo_256.webp?exp=1790000000&sig=deadbeef';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }),
}));

// Prefixo `mock` é exigido pelo babel-plugin-jest-hoist: variável referenciada
// de dentro da factory de jest.mock() só é permitida se começar com "mock"
// (case-insensitive) — sem isso, `ReferenceError: out-of-scope variable`.
let mockPetFixture: any;
jest.mock('../hooks/usePetDetail', () => ({
  usePetDetail: () => ({ data: mockPetFixture, isLoading: false }),
}));

const basePet = {
  id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10',
  sgSexo: 'M' as const, sgPorte: 'G' as const, nmClinica: 'Clínica KURA',
  dsStatusGeral: 'OK' as const, nrAlertasAtivos: 0, nrConsultas: 5, chips: [],
};

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('PetDetailScreen — avatar com foto real no hero (FT-09)', () => {
  it('com dsFotoUrl, o hero recebe a variante 1080 e o nome do pet', async () => {
    mockPetFixture = { ...basePet, dsFotoUrl: FOTO_1080_URL, dsFotoThumbUrl: FOTO_THUMB_URL };
    const { getByTestId } = render(<PetDetailScreen />, { wrapper: W });
    await waitFor(() => {
      const foto = getByTestId('k-pet-portrait-foto');
      expect(foto.props.source[0].uri).toBe(FOTO_1080_URL);
    });
  });

  // G2 FT-09 (M-1): o título acima ("...e o nome do pet") não tinha
  // asserção correspondente — sem `nome={pet?.nmPet}`, o KPetPortrait não
  // gera `accessibilityLabel` nenhum no hero. Mordida: remover
  // `nome={pet?.nmPet}` em pets/[id]/index.tsx faz este teste falhar.
  it('o accessibilityLabel do hero usa o nome do pet ("Foto de Bóbi")', async () => {
    mockPetFixture = { ...basePet, dsFotoUrl: FOTO_1080_URL, dsFotoThumbUrl: FOTO_THUMB_URL };
    const { getByTestId } = render(<PetDetailScreen />, { wrapper: W });
    await waitFor(() => {
      expect(getByTestId('k-pet-portrait').props.accessibilityLabel).toBe(`Foto de ${basePet.nmPet}`);
    });
  });

  it('sem dsFotoUrl (null), mantém a ilustração no hero', async () => {
    mockPetFixture = { ...basePet, dsFotoUrl: null, dsFotoThumbUrl: null };
    const { queryByTestId, getAllByText } = render(<PetDetailScreen />, { wrapper: W });
    // "Bóbi" aparece 2x (barra de topo + título do hero) — getAllByText em vez
    // de getByText, só pra confirmar que a tela terminou de montar com o pet.
    await waitFor(() => expect(getAllByText('Bóbi').length).toBeGreaterThan(0));
    expect(queryByTestId('k-pet-portrait-foto')).toBeNull();
  });

  // Mordida: trocar `fotoUrl={pet?.dsFotoUrl}` por `pet?.dsFotoThumbUrl` no
  // hero de pets/[id]/index.tsx faz este teste falhar (URI vira a thumb).
  it('mordida-alvo: o hero NÃO usa a thumb (256), usa a 1080', async () => {
    mockPetFixture = { ...basePet, dsFotoUrl: FOTO_1080_URL, dsFotoThumbUrl: FOTO_THUMB_URL };
    const { getByTestId } = render(<PetDetailScreen />, { wrapper: W });
    await waitFor(() => {
      const foto = getByTestId('k-pet-portrait-foto');
      expect(foto.props.source[0].uri).not.toBe(FOTO_THUMB_URL);
      expect(foto.props.source[0].uri).toBe(FOTO_1080_URL);
    });
  });
});
