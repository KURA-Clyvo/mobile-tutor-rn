import { apiClient } from './api/client';
import type { PetTutorResponse, PetDetalheRaw, PageRaw } from '../types/api';
import { mapPetDetailDto } from '../utils/mappers';

// GET /api/v1/tutor/pets real devolve uma página do Spring (`{content:[...]}`) com um DTO
// enxuto (`idPet`, `nmPet`, `nmEspecie`, `nmRaca`, `sgSexo`, `dtNascimento`, `sgPorte`).
// O app esperava um array já no shape de PetTutorResponse e quebrava fora do modo mock.
// Array continua aceito (é o que o mock-adapter devolve). Campos que a API não tem
// (chips, clínica, alertas) ficam vazios/neutros — nunca inventados.
// FT-09 (KURA_BACKLOG_FOTO_PET) — âncora regra 11: `dsFotoThumbUrl` espelha
// `PetResponse.java:27` (backend-tutor-java `main` `3bfb45f`, FT-05), conferido
// em 2026-09-25 com
// `git -C D:/FIAP/KURA/backend-tutor-java show 3bfb45f:src/main/java/br/com/clyvo/kura/tutor/tutor/api/dto/PetResponse.java`.
// Regra A5 do backlog: o DTO de LISTA só carrega a thumb (256px), nunca a
// variante 1080 — o campo vem sempre presente no JSON, `null` sem foto.
interface PetListaRaw {
  idPet: number; nmPet: string; nmEspecie: string; nmRaca: string;
  sgSexo: 'M' | 'F'; dtNascimento: string; sgPorte: PetTutorResponse['sgPorte'];
  dsFotoThumbUrl: string | null;
}

export function mapListaPets(data: PetTutorResponse[] | PageRaw<PetListaRaw>): PetTutorResponse[] {
  if (Array.isArray(data)) return data;
  return data.content.map((p) => ({
    id: p.idPet, nmPet: p.nmPet, nmEspecie: p.nmEspecie, nmRaca: p.nmRaca,
    dtNascimento: p.dtNascimento, sgSexo: p.sgSexo, sgPorte: p.sgPorte,
    nmClinica: '', dsStatusGeral: 'OK', nrAlertasAtivos: 0, nrConsultas: 0, chips: [],
    dsFotoThumbUrl: p.dsFotoThumbUrl,
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
