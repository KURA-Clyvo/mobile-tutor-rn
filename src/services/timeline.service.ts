import { apiClient } from './api/client';
import type { PageRaw, TimelineEventoRaw } from '../types/api';
import { mapTimelineEventoDto, mapTimelineEventoDetailDto } from '../utils/mappers';

// TASK-31: GET /pets/{id}/timeline agora é real (era stub 501). Java pagina
// (Spring Data Page) — extraímos `.content` e mapeamos cada item.
export const getTimeline = (idPet: number) =>
  apiClient.get<PageRaw<TimelineEventoRaw>>(`/api/v1/tutor/pets/${idPet}/timeline`)
    .then(r => r.data.content.map(mapTimelineEventoDto));

// TASK-31: detalhe de evento — antes sem rota nenhuma no Java.
export const getEventDetail = (idPet: number, idEvento: number) =>
  apiClient.get<TimelineEventoRaw>(`/api/v1/tutor/pets/${idPet}/timeline/${idEvento}`)
    .then(r => mapTimelineEventoDetailDto(r.data));
