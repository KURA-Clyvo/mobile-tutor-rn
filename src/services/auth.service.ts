import { apiClient } from './api/client';
import type { LoginRequest, LoginResponse, RegisterTutorRequest, RegisterTutorResponse } from '../types/api';

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', req);
  return res.data;
}

// TASK-55: shape real de POST /api/v1/auth/register-invite (Java `RegisterInviteRequest`/
// `TokenResponse`, ver backend-tutor-java/.../onboarding/api/dto). Diverge do contrato
// app-facing (`RegisterTutorRequest`/`RegisterTutorResponse`) em nomes de campo (token/senha
// vs inviteToken/dsSenha) e em formato de resposta (idTutor aninhado em `tutor`, `expiresIn`
// em segundos em vez de `expiresAt` ISO). Mapeado aqui para isolar o resto do app do contrato
// real do BFF — `RegisterTutorRequest`/`RegisterTutorResponse` continuam estáveis para quem
// consome `register()` (register.tsx, mocks).
interface RegisterInviteApiResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  tutor: { idTutor: number; nmTutor: string };
}

export async function register(req: RegisterTutorRequest): Promise<RegisterTutorResponse> {
  const res = await apiClient.post<RegisterInviteApiResponse>('/api/v1/auth/register-invite', {
    token: req.inviteToken,
    senha: req.dsSenha,
    aceites: [],
  });
  return {
    idTutor:     res.data.tutor.idTutor,
    accessToken: res.data.accessToken,
    expiresAt:   new Date(Date.now() + res.data.expiresIn * 1000).toISOString(),
  };
}
