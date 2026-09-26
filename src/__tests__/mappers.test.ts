import { mapPetDto, mapPetDetailDto } from '../utils/mappers';
import type { PetTutorResponse, PetDetalheRaw } from '../types/api';

const dto: PetTutorResponse = {
  id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10',
  sgSexo: 'M', sgPorte: 'G', nmClinica: 'Clínica KURA', dsStatusGeral: 'URGENTE',
  nrAlertasAtivos: 1, nrConsultas: 5,
  chips: [{ tone: 'clay', label: '⚠ Retorno 2d' }, { tone: 'sage', label: 'Vacinado' }],
  dsFotoThumbUrl: 'https://kura-clinica.example/api/v1/fotos/clinica/1/pet/2/uuid_256.webp?exp=1&sig=aaa',
};

describe('mapPetDto', () => {
  it('maps all fields', () => {
    const pet = mapPetDto(dto);
    expect(pet.nome).toBe('Bóbi');
    expect(pet.statusGeral).toBe('URGENTE');
    expect(pet.chips).toHaveLength(2);
    expect(pet.nascimento).toBeInstanceOf(Date);
    expect(typeof pet.idadeAnos).toBe('number');
  });

  // FT-09 (KURA_BACKLOG_FOTO_PET): regra A5 — a lista só recebe a thumb.
  // Mordida: remover `fotoThumbUrl: dto.dsFotoThumbUrl` de mapPetDto faz
  // este teste falhar.
  it('propaga dsFotoThumbUrl para fotoThumbUrl (mordida: não propagar quebra este teste)', () => {
    const pet = mapPetDto(dto);
    expect(pet.fotoThumbUrl).toBe('https://kura-clinica.example/api/v1/fotos/clinica/1/pet/2/uuid_256.webp?exp=1&sig=aaa');
  });

  it('pet sem dsFotoThumbUrl (null) mapeia fotoThumbUrl como null', () => {
    const pet = mapPetDto({ ...dto, dsFotoThumbUrl: null });
    expect(pet.fotoThumbUrl).toBeNull();
  });
});

describe('mapPetDetailDto — foto (FT-09)', () => {
  const raw: PetDetalheRaw = {
    idPet: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10',
    sgSexo: 'M', sgPorte: 'G', nmClinica: 'Clínica KURA', nmVeterinarioResponsavel: null, nrConsultas: 5,
    dsFotoUrl: 'https://kura-clinica.example/api/v1/fotos/clinica/1/pet/2/uuid_1080.webp?exp=1&sig=aaa',
    dsFotoThumbUrl: 'https://kura-clinica.example/api/v1/fotos/clinica/1/pet/2/uuid_256.webp?exp=1&sig=aaa',
  };

  // Mordida: trocar `dsFotoUrl: raw.dsFotoUrl` por `raw.dsFotoThumbUrl` (ou
  // vice-versa) em mapPetDetailDto faz este teste falhar — os 2 literais são
  // deliberadamente distintos (1080 vs. 256) pra pegar a troca.
  it('propaga as 2 variantes sem trocar thumb<->1080 (mordida: trocar as 2 quebra este teste)', () => {
    const pet = mapPetDetailDto(raw);
    expect(pet.dsFotoUrl).toBe('https://kura-clinica.example/api/v1/fotos/clinica/1/pet/2/uuid_1080.webp?exp=1&sig=aaa');
    expect(pet.dsFotoThumbUrl).toBe('https://kura-clinica.example/api/v1/fotos/clinica/1/pet/2/uuid_256.webp?exp=1&sig=aaa');
    expect(pet.dsFotoUrl).not.toBe(pet.dsFotoThumbUrl);
  });

  it('pet sem foto (os 2 null) mapeia os 2 campos como null', () => {
    const pet = mapPetDetailDto({ ...raw, dsFotoUrl: null, dsFotoThumbUrl: null });
    expect(pet.dsFotoUrl).toBeNull();
    expect(pet.dsFotoThumbUrl).toBeNull();
  });
});
