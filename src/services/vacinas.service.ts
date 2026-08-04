import { apiClient } from './api/client';
import type { VacinaVencendoRaw, VacinaStatusRaw } from '../types/api';
import { mapVacinaDto, mapVacinaStatusDto } from '../utils/mappers';

// TASK-31: ambos endpoints antes sem backing nenhum no Java. Leitura de
// VW_VACINAS_VENCENDO — só retorna pendências futuras (ver mapVacinaDto).
export const getVacinas = (id: number) =>
  apiClient.get<VacinaVencendoRaw[]>(`/api/v1/tutor/pets/${id}/vacinas`).then(r => r.data.map(mapVacinaDto));

export const getVacinaStatus = (id: number) =>
  apiClient.get<VacinaStatusRaw>(`/api/v1/tutor/pets/${id}/vacinas/status`).then(r => mapVacinaStatusDto(r.data));
