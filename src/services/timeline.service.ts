import { apiClient } from './api/client';
import type { TimelineTutorEventResponse, TimelineTutorEventDetailResponse } from '../types/api';

export const getTimeline = (idPet: number) =>
  apiClient.get<TimelineTutorEventResponse[]>(`/api/v1/tutor/pets/${idPet}/timeline`).then(r => r.data);

export const getEventDetail = (idPet: number, idEvento: number) =>
  apiClient.get<TimelineTutorEventDetailResponse>(`/api/v1/tutor/pets/${idPet}/timeline/${idEvento}`).then(r => r.data);
