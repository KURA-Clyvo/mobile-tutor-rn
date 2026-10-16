import { AxiosError, CanceledError } from 'axios';
import { normalizeError } from '../services/api/errors';

// BR-TUT-T05 (m4): NETWORK_ERROR só com a requisição enviada, sem resposta e não cancelada.
describe('normalizeError — o que é rede', () => {
  it('sem resposta (request presente) => NETWORK_ERROR', () => {
    expect(normalizeError(new AxiosError('Network Error', 'ERR_NETWORK', undefined, {})).code).toBe('NETWORK_ERROR');
    expect(normalizeError(new AxiosError('timeout', 'ECONNABORTED', undefined, {})).code).toBe('NETWORK_ERROR');
  });
  it('cancelamento NÃO é rede', () => {
    expect(normalizeError(new CanceledError('canceled')).code).toBe('UNKNOWN_ERROR');
    expect(normalizeError(new AxiosError('canceled', 'ERR_CANCELED', undefined, {})).code).toBe('UNKNOWN_ERROR');
  });
  it('erro de configuração (sem request, nem saiu) NÃO é rede', () => {
    expect(normalizeError(new AxiosError('bad', 'ERR_BAD_OPTION_VALUE')).code).toBe('UNKNOWN_ERROR');
  });
  it('401 com resposta continua credencial (status 401, não rede)', () => {
    const e = new AxiosError('x', 'ERR_BAD_REQUEST', undefined, {}, { status: 401, data: { codigo: 'CREDENCIAIS', mensagem: 'm' } } as never);
    expect(normalizeError(e)).toMatchObject({ status: 401, code: 'CREDENCIAIS' });
  });
});
