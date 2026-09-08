import { apiClient } from './api/client';
import type { PetTutorResponse, PetDetalheRaw, PageRaw } from '../types/api';
import { mapPetDetailDto } from '../utils/mappers';
import { desembrulharPagina } from './api/pagina';

// T-2: o Java devolve `Page<PetResponse>` aqui (envelope `{content, totalElements}`),
// não array — o mock devolve array. `desembrulharPagina` aceita as duas formas, então
// o `.map()` de `usePets` continua recebendo lista nos dois modos.
//
// 🔴 Pendente e NÃO resolvido nesta camada: os NOMES dos campos de `PetResponse`
// (Java) também divergem de `PetTutorResponse` (app) — está documentado em
// `backend-tutor-java/docs/INT-01-contract-map.md` (linha #3), repositório que não
// está nesta máquina. Nenhum mapper de lista foi escrito aqui de propósito: inventar
// nome de campo sem a fonte é o mesmo erro que já custou ciclos neste projeto.
export const listPets = () =>
  apiClient.get<PageRaw<PetTutorResponse> | PetTutorResponse[]>('/api/v1/tutor/pets')
    .then(r => desembrulharPagina(r.data));

// TASK-31: GET /pets/{id} agora é real (era stub 501). Java retorna um DTO
// enxuto (PetDetalheRaw) — mapPetDetailDto adapta para o shape que a tela espera,
// deixando campos sem dado (chips/vitais/observações) ausentes, nunca inventados.
export const getPetById = (id: number) =>
  apiClient.get<PetDetalheRaw>(`/api/v1/tutor/pets/${id}`).then(r => mapPetDetailDto(r.data));
