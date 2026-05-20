import { apiClient } from './api/client';
import type { VacinaTutorResponse, VacinaStatusResponse } from '../types/api';

export const getVacinas = (id: number) =>
  apiClient.get<VacinaTutorResponse[]>(`/api/v1/tutor/pets/${id}/vacinas`).then(r => r.data);

export const getVacinaStatus = (id: number) =>
  apiClient.get<VacinaStatusResponse>(`/api/v1/tutor/pets/${id}/vacinas/status`).then(r => r.data);
