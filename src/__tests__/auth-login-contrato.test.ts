jest.mock('../services/api/client', () => ({ apiClient: { post: jest.fn() } }));

import { apiClient } from '../services/api/client';
import { login } from '../services/auth.service';

const mockPost = apiClient.post as jest.Mock;

// Corpo medido contra a API Java real (POST /api/v1/auth/login).
describe('login — contrato real do backend-tutor-java', () => {
  it('manda {email, senha} e traduz a resposta para o shape do app', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        accessToken: 'jwt', refreshToken: 'r', tokenType: 'Bearer',
        expiresIn: 900, idConta: 1, nmTutor: 'Tutor Demo Luna WhatsApp',
      },
    });

    const res = await login({ dsEmail: 'tutor@kura.local', dsSenha: 'segredo' });

    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'tutor@kura.local',
      senha: 'segredo',
    });
    expect(res.accessToken).toBe('jwt');
    expect(new Date(res.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(res.tutor.nmTutor).toBe('Tutor Demo Luna WhatsApp');
    expect(res.tutor.dsEmail).toBe('tutor@kura.local');
  });
});
