import type { LoginResponse } from '../types/api';
export async function login(): Promise<LoginResponse> {
  return {
    accessToken: 'mock-jwt-tutor-2026',
    expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(),
    tutor: { id: 1, nmTutor: 'Guilherme Sola', dsEmail: 'gui@kura.com', dsTelefone: '11999990001', dtCadastro: new Date().toISOString() },
  };
}
