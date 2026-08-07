import { register, isVersaoTermoDesatualizadaError } from '../services/auth.service';
import { apiClient } from '../services/api/client';

jest.mock('../services/api/client', () => ({
  apiClient: { post: jest.fn() },
}));

// TASK-61: register() não deve mais mandar `aceites: []` fixo — o array precisa
// refletir o que o usuário marcou no formulário, no shape real do Java
// (AceiteRequest: tipo/versaoTermo/aceito, ver backend-tutor-java/.../onboarding/api/dto).
describe('auth.service register()', () => {
  const mockResponse = {
    data: {
      accessToken: 'tok', refreshToken: 'ref', tokenType: 'Bearer', expiresIn: 900,
      tutor: { idTutor: 7, nmTutor: 'Guilherme Sola' },
    },
  };

  beforeEach(() => {
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);
  });

  it('monta aceites com LEMBRETES e TELEORIENTACAO quando ambos marcados', async () => {
    await register({
      inviteToken: 'invite-1', nmTutor: 'Guilherme', dsSenha: 'Senha1234', dsTelefone: '11999990001',
      aceiteLembretes: true, aceiteTeleorientacao: true,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/register-invite', {
      token: 'invite-1',
      senha: 'Senha1234',
      aceites: [
        { tipo: 'LEMBRETES', versaoTermo: 'v1.0', aceito: true },
        { tipo: 'TELEORIENTACAO', versaoTermo: 'v1.0', aceito: true },
      ],
    });
  });

  it('não inclui item de aceite não marcado — nunca manda aceito:false para tipo nunca aceito', async () => {
    await register({
      inviteToken: 'invite-1', nmTutor: 'Guilherme', dsSenha: 'Senha1234', dsTelefone: '11999990001',
      aceiteLembretes: true, aceiteTeleorientacao: false,
    });
    const body = (apiClient.post as jest.Mock).mock.calls[0][1];
    expect(body.aceites).toEqual([{ tipo: 'LEMBRETES', versaoTermo: 'v1.0', aceito: true }]);
  });

  it('mapeia a resposta do BFF Java para o contrato app-facing RegisterTutorResponse', async () => {
    const res = await register({
      inviteToken: 'invite-1', nmTutor: 'Guilherme', dsSenha: 'Senha1234', dsTelefone: '11999990001',
      aceiteLembretes: true, aceiteTeleorientacao: false,
    });
    expect(res.idTutor).toBe(7);
    expect(res.accessToken).toBe('tok');
    expect(typeof res.expiresAt).toBe('string');
  });
});

// TASK-61 (rodada de fix — achado Important da revisão): fixar VERSAO_TERMO_ATUAL no
// cliente acopla a versão do app à versão vigente no servidor — risco novo introduzido
// por esta task (antes `aceites` sempre era [], então validarVersaoTermo nunca rodava).
// Ver nota completa em auth.service.ts, isVersaoTermoDesatualizadaError.
describe('isVersaoTermoDesatualizadaError', () => {
  it('reconhece o 422 real de ValidadorConsentimento.validarVersaoTermo', () => {
    expect(isVersaoTermoDesatualizadaError({
      status: 422, code: 'REGRA_DE_NEGOCIO',
      message: 'Versão do termo desatualizada. Versão vigente: v1.1. Recarregue o aplicativo e tente novamente.',
    })).toBe(true);
  });

  it('não confunde com outro 422 REGRA_DE_NEGOCIO (aviso de privacidade) — mesmo status/code, mensagem diferente', () => {
    expect(isVersaoTermoDesatualizadaError({
      status: 422, code: 'REGRA_DE_NEGOCIO',
      message: 'Tutor não recebeu o aviso de privacidade. Entre em contato com a clínica.',
    })).toBe(false);
  });

  it('não confunde com 400/409/401 — status precisa ser 422', () => {
    expect(isVersaoTermoDesatualizadaError({
      status: 400, code: 'VALIDACAO_INVALIDA', message: 'Versão do termo desatualizada.',
    })).toBe(false);
  });

  it('não quebra com erro sem status/message (rede, undefined, etc.)', () => {
    expect(isVersaoTermoDesatualizadaError(undefined)).toBe(false);
    expect(isVersaoTermoDesatualizadaError(new Error('network'))).toBe(false);
    expect(isVersaoTermoDesatualizadaError({})).toBe(false);
  });
});
