import type { PetTutorResponse } from '../types/api';
import type { PetDomain } from '../types/domain';

function calcIdade(dtNascimento: string): number {
  return Math.floor((Date.now() - new Date(dtNascimento).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export function mapPetDto(dto: PetTutorResponse): PetDomain {
  return {
    id: dto.id, nome: dto.nmPet, especie: dto.nmEspecie, raca: dto.nmRaca,
    nascimento: new Date(dto.dtNascimento), sexo: dto.sgSexo, porte: dto.sgPorte,
    nmClinica: dto.nmClinica, statusGeral: dto.dsStatusGeral,
    alertasAtivos: dto.nrAlertasAtivos, idadeAnos: calcIdade(dto.dtNascimento),
    nrConsultas: dto.nrConsultas, chips: dto.chips,
  };
}
