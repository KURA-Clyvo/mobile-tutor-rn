import { apiClient } from './api/client';
import type { PetListaRaw, PetDetalheRaw, PageRaw } from '../types/api';
import { mapPetDetailDto, mapPetListaDto } from '../utils/mappers';
import { desembrulharPagina } from './api/pagina';

// T-2: duas divergências, as duas tratadas aqui. O envelope `Page<T>` sai em
// `desembrulharPagina`; os nomes de campo (`idPet` -> `id`) saem em `mapPetListaDto`.
// `PetResponse` tem 7 campos e só — `nmClinica`, `dsStatusGeral`, `nrAlertasAtivos`,
// `nrConsultas` e `chips` não existem nele, e o mapper os deixa ausentes.
export const listPets = () =>
  apiClient.get<PageRaw<PetListaRaw> | PetListaRaw[]>('/api/v1/tutor/pets')
    .then(r => desembrulharPagina(r.data).map(mapPetListaDto));

// TASK-31: GET /pets/{id} agora é real (era stub 501). Java retorna um DTO
// enxuto (PetDetalheRaw) — mapPetDetailDto adapta para o shape que a tela espera,
// deixando campos sem dado (chips/vitais/observações) ausentes, nunca inventados.
export const getPetById = (id: number) =>
  apiClient.get<PetDetalheRaw>(`/api/v1/tutor/pets/${id}`).then(r => mapPetDetailDto(r.data));
