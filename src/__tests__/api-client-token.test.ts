import { extrairToken } from '../services/api/client';

// O valor em AsyncStorage['KURA_TUTOR_AUTH_TOKEN'] é o JSON do persist do zustand; o
// Bearer tem de ser só o token de dentro dele.
describe('extrairToken', () => {
  it('extrai state.token do JSON persistido pelo zustand', () => {
    const persistido = JSON.stringify({ state: { token: 'jwt-abc', expiresAt: 'x' }, version: 0 });
    expect(extrairToken(persistido)).toBe('jwt-abc');
  });

  it('sem sessão devolve null (não manda Bearer)', () => {
    expect(extrairToken(null)).toBeNull();
    expect(extrairToken(JSON.stringify({ state: { token: null }, version: 0 }))).toBeNull();
  });

  it('valor cru (não-JSON) é tratado como o próprio token', () => {
    expect(extrairToken('jwt-cru')).toBe('jwt-cru');
  });
});
