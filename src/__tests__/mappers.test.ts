import { mapPetDto } from '../utils/mappers';
import type { PetTutorResponse } from '../types/api';

const dto: PetTutorResponse = {
  id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10',
  sgSexo: 'M', sgPorte: 'G', nmClinica: 'Clínica KURA', dsStatusGeral: 'URGENTE',
  nrAlertasAtivos: 1, nrConsultas: 5,
  chips: [{ tone: 'clay', label: '⚠ Retorno 2d' }, { tone: 'sage', label: 'Vacinado' }],
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
});
