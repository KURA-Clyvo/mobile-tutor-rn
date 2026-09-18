import type { LoginApiResponse, RegisterInviteApiResponse } from '../services/auth.service';

// Shape cru do BFF Java (antes da camada anti-corrupção de login()), igual ao registerTutor
// abaixo — ver o comentário de LoginApiResponse em auth.service.ts.
export async function login(): Promise<LoginApiResponse> {
  return {
    accessToken:  'mock-jwt-tutor-2026',
    refreshToken: 'mock-refresh-tutor-2026',
    tokenType:    'Bearer',
    expiresIn:    8 * 3600,
    idConta:      1,
    nmTutor:      'Guilherme Sola',
  };
}

// TASK-64 (FIX_5): o mock alimenta register() ANTES da camada anti-corrupcao
// (auth.service.ts:63-69), entao tem que devolver o shape cru do BFF Java
// (RegisterInviteApiResponse), nao o RegisterTutorResponse que a funcao produz depois de
// mapear. Manter os dois em sincronia: se o shape do BFF mudar, este mock muda junto — foi
// a dessincronizacao deles (auth.mock.ts parado no shape app-facing) que gerou a TASK-64
// (TypeError: Cannot read properties of undefined (reading 'idTutor'), sempre que o app
// roda em modo mock, que é o default versionado em .env.example).
export async function registerTutor(): Promise<RegisterInviteApiResponse> {
  return {
    accessToken:  'mock-jwt-tutor-new-2026',
    refreshToken: 'mock-refresh-tutor-new-2026',
    tokenType:    'Bearer',
    expiresIn:    8 * 3600,
    tutor: { idTutor: 42, nmTutor: 'Tutor Demo' },
  };
}
