import { apiClient } from './api/client';
import type { PetTutorResponse, PetDetalheRaw } from '../types/api';
import { mapPetDetailDto } from '../utils/mappers';

export const listPets = () =>
  apiClient.get<PetTutorResponse[]>('/api/v1/tutor/pets').then(r => r.data);

// TASK-31: GET /pets/{id} agora é real (era stub 501). Java retorna um DTO
// enxuto (PetDetalheRaw) — mapPetDetailDto adapta para o shape que a tela espera,
// deixando campos sem dado (chips/vitais/observações) ausentes, nunca inventados.
export const getPetById = (id: number) =>
  apiClient.get<PetDetalheRaw>(`/api/v1/tutor/pets/${id}`).then(r => mapPetDetailDto(r.data));
