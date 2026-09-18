import { apiClient } from './api/client';
import type { PetTutorResponse, PetDetalheRaw, PageRaw } from '../types/api';
import { mapPetDetailDto } from '../utils/mappers';

// GET /api/v1/tutor/pets real devolve uma página do Spring (`{content:[...]}`) com um DTO
// enxuto (`idPet`, `nmPet`, `nmEspecie`, `nmRaca`, `sgSexo`, `dtNascimento`, `sgPorte`).
// O app esperava um array já no shape de PetTutorResponse e quebrava fora do modo mock.
// Array continua aceito (é o que o mock-adapter devolve). Campos que a API não tem
// (chips, clínica, alertas) ficam vazios/neutros — nunca inventados.
interface PetListaRaw {
  idPet: number; nmPet: string; nmEspecie: string; nmRaca: string;
  sgSexo: 'M' | 'F'; dtNascimento: string; sgPorte: PetTutorResponse['sgPorte'];
}

export function mapListaPets(data: PetTutorResponse[] | PageRaw<PetListaRaw>): PetTutorResponse[] {
  if (Array.isArray(data)) return data;
  return data.content.map((p) => ({
    id: p.idPet, nmPet: p.nmPet, nmEspecie: p.nmEspecie, nmRaca: p.nmRaca,
    dtNascimento: p.dtNascimento, sgSexo: p.sgSexo, sgPorte: p.sgPorte,
    nmClinica: '', dsStatusGeral: 'OK', nrAlertasAtivos: 0, nrConsultas: 0, chips: [],
  }));
}

export const listPets = () =>
  apiClient
    .get<PetTutorResponse[] | PageRaw<PetListaRaw>>('/api/v1/tutor/pets')
    .then(r => mapListaPets(r.data));

// TASK-31: GET /pets/{id} agora é real (era stub 501). Java retorna um DTO
// enxuto (PetDetalheRaw) — mapPetDetailDto adapta para o shape que a tela espera,
// deixando campos sem dado (chips/vitais/observações) ausentes, nunca inventados.
export const getPetById = (id: number) =>
  apiClient.get<PetDetalheRaw>(`/api/v1/tutor/pets/${id}`).then(r => mapPetDetailDto(r.data));
