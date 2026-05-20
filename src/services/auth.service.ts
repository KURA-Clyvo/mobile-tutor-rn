import { apiClient } from './api/client';
import type { LoginRequest, LoginResponse, RegisterTutorRequest, RegisterTutorResponse } from '../types/api';

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', req);
  return res.data;
}

export async function register(req: RegisterTutorRequest): Promise<RegisterTutorResponse> {
  const res = await apiClient.post<RegisterTutorResponse>('/api/v1/auth/register', req);
  return res.data;
}
