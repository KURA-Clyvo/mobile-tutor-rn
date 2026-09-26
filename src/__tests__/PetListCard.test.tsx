import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { PetListCard } from '../components/domain/PetListCard';
import type { PetDomain } from '../types/domain';

// FT-09 (KURA_BACKLOG_FOTO_PET): prova que a lista passa a variante THUMB
// (regra A5 — a lista nunca baixa a 1080) e o nome do pet para o
// KPetPortrait. Literais próprios aqui (regra do ciclo: não importar
// constantes do módulo testado para montar o esperado).
const FOTO_THUMB_URL =
  'https://kura-clinica.vercel.app/proxy/clinica/api/v1/fotos/clinica/1/pet/2/uuid-fixo_256.webp?exp=1790000000&sig=deadbeef';

const petBase: PetDomain = {
  id: 1, nome: 'Bóbi', especie: 'Cão', raca: 'Labrador', nascimento: new Date('2021-03-10'),
  sexo: 'M', porte: 'G', nmClinica: 'Clínica KURA', statusGeral: 'URGENTE',
  alertasAtivos: 1, idadeAnos: 4, nrConsultas: 8,
  chips: [{ tone: 'clay', label: '⚠ Retorno 2d' }],
};

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('PetListCard — foto (FT-09)', () => {
  it('com fotoThumbUrl, passa a URL da THUMB e o nome ao KPetPortrait', () => {
    const pet: PetDomain = { ...petBase, fotoThumbUrl: FOTO_THUMB_URL };
    const { getByTestId } = render(<PetListCard pet={pet} onPress={jest.fn()} />, { wrapper: W });
    const foto = getByTestId('k-pet-portrait-foto');
    expect(foto.props.source[0].uri).toBe(FOTO_THUMB_URL);
  });

  it('sem fotoThumbUrl, mantém a ilustração (sem imagem real)', () => {
    const pet: PetDomain = { ...petBase, fotoThumbUrl: null };
    const { queryByTestId } = render(<PetListCard pet={pet} onPress={jest.fn()} />, { wrapper: W });
    expect(queryByTestId('k-pet-portrait-foto')).toBeNull();
  });

  // Mordida: trocar `fotoUrl={pet.fotoThumbUrl}` por qualquer outro campo (ex.:
  // `pet.nmClinica`) em PetListCard.tsx faz este teste falhar — a URI
  // renderizada deixa de bater com o literal esperado.
  it('mordida-alvo: a URI renderizada é exatamente pet.fotoThumbUrl, não outro campo', () => {
    const pet: PetDomain = { ...petBase, fotoThumbUrl: FOTO_THUMB_URL };
    const { getByTestId } = render(<PetListCard pet={pet} onPress={jest.fn()} />, { wrapper: W });
    const foto = getByTestId('k-pet-portrait-foto');
    expect(foto.props.source[0].uri).not.toBe(pet.nmClinica);
    expect(foto.props.source[0].uri).toBe(pet.fotoThumbUrl);
  });
});
