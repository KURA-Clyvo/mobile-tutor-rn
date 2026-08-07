// TASK-64 (FIX_5): G4b — contrato de modo mock. `register()` tem DOIS consumidores de
// resposta: o BFF Java real e `mock-adapter.ts`/`auth.mock.ts` quando
// EXPO_PUBLIC_USE_MOCKS=true. A TASK-55/TASK-61 corrigiram e validaram só o consumidor 1;
// `auth.mock.ts` ficou parado no shape app-facing (RegisterTutorResponse), que é o tipo
// de SAÍDA de register(), não o de ENTRADA (RegisterInviteApiResponse, shape cru do BFF).
//
// Este teste EXERCITA a função de verdade — register() -> apiClient (interceptor real,
// sem jest.mock) -> mock-adapter -> auth.mock — em vez de mockar apiClient.post e ler o
// mock por inspeção. É essa distinção que faz o G4b (KURA_BACKLOG_FIX_5.md §2) valer
// alguma coisa: leitura de diff já tinha "confirmado" esse mock duas vezes antes
// (TASK-55, TASK-61) e nas duas vezes o bug sobreviveu.
//
// O interceptor de EXPO_PUBLIC_USE_MOCKS (client.ts:21) lê process.env a cada request,
// não no import do módulo — não precisamos de jest.resetModules()/require() dinâmico,
// só de setar a env var antes de chamar register().
import { register } from '../services/auth.service';

describe('register() em modo mock (EXPO_PUBLIC_USE_MOCKS=true) — G4b', () => {
  const originalUseMocks = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalUseMocks;
  });

  it('executa sem lançar e devolve um RegisterTutorResponse válido', async () => {
    const res = await register({
      inviteToken: 'invite-mock-1',
      nmTutor: 'Guilherme',
      dsSenha: 'Senha1234',
      dsTelefone: '11999990001',
      aceiteLembretes: true,
      aceiteTeleorientacao: true,
    });

    expect(typeof res.idTutor).toBe('number');
    expect(typeof res.accessToken).toBe('string');
    expect(res.accessToken.length).toBeGreaterThan(0);

    // expiresAt precisa ser um ISO válido e FUTURO — Date.now() + expiresIn * 1000 não
    // pode produzir Invalid Date (ex.: se o mock não tiver `expiresIn` e o cálculo virar
    // Date.now() + undefined * 1000 = NaN).
    const expiresAtMs = Date.parse(res.expiresAt);
    expect(Number.isNaN(expiresAtMs)).toBe(false);
    expect(expiresAtMs).toBeGreaterThan(Date.now());
  });

  it('devolve exatamente o mock de demonstração documentado (idTutor: 42)', async () => {
    const res = await register({
      inviteToken: 'invite-mock-2',
      nmTutor: 'Guilherme',
      dsSenha: 'Senha1234',
      dsTelefone: '11999990001',
      aceiteLembretes: true,
      aceiteTeleorientacao: false,
    });

    expect(res.idTutor).toBe(42);
  });
});
