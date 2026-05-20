import { apiClient } from './api/client';
import type { PetTutorResponse, PetTutorDetailResponse } from '../types/api';

export const listPets = () =>
  apiClient.get<PetTutorResponse[]>('/api/v1/tutor/pets').then(r => r.data);

export const getPetById = (id: number) =>
  apiClient.get<PetTutorDetailResponse>(`/api/v1/tutor/pets/${id}`).then(r => r.data);
