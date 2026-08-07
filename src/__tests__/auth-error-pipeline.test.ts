import { apiClient } from '../services/api/client';
import { register, isVersaoTermoDesatualizadaError } from '../services/auth.service';

// TASK-61 (fix round 2 — achado da re-revisão): prova que o pipeline INTEIRO
// funciona contra o corpo HTTP real do Java — {codigo, mensagem}, não
// {code, message} — passando de fato pelo adapter do axios e pelo interceptor de
// resposta real de `client.ts` (que chama `normalizeError`). Nem `apiClient.post`
// nem `register()` são mockados aqui (ao contrário de `auth.service.test.ts`, que
// mocka `apiClient.post` direto — bypassa `normalizeError` por completo) — só o
// adapter de transporte do axios é substituído, simulando exatamente a resposta
// HTTP que o `kura_java_tutor` real devolve (confirmado por `curl` na seção de
// validação do relatório).
describe('register() — pipeline de erro real (Java {codigo,mensagem} -> axios -> normalizeError)', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  // Simula o adapter do axios rejeitando do jeito que a implementação real (http/xhr)
  // rejeita para status fora de 2xx: erro com `.response.data` = corpo JSON exato
  // que o Java serializa (ApiError record: timestamp/status/codigo/mensagem/path/detalhes).
  function mockJavaErrorResponse(status: number, codigo: string, mensagem: string) {
    apiClient.defaults.adapter = jest.fn((config: any) => {
      const response = {
        data: { timestamp: new Date().toISOString(), status, codigo, mensagem, path: config.url, detalhes: null },
        status, statusText: 'Error', headers: {}, config,
      };
      return Promise.reject(Object.assign(new Error(`Request failed with status code ${status}`), {
        isAxiosError: true, response, config, toJSON: () => ({}),
      }));
    }) as any;
  }

  const req = {
    inviteToken: 'tok', nmTutor: 'Tutor', dsSenha: 'Senha1234', dsTelefone: '11999990000',
    aceiteLembretes: true, aceiteTeleorientacao: false,
  };

  it('propaga code/message reais do Java — não cai em UNKNOWN_ERROR/Erro desconhecido', async () => {
    mockJavaErrorResponse(422, 'REGRA_DE_NEGOCIO',
      'Versão do termo desatualizada. Versão vigente: v1.1. Recarregue o aplicativo e tente novamente.');

    await expect(register(req)).rejects.toMatchObject({
      status:  422,
      code:    'REGRA_DE_NEGOCIO',
      message: 'Versão do termo desatualizada. Versão vigente: v1.1. Recarregue o aplicativo e tente novamente.',
    });
  });

  it('isVersaoTermoDesatualizadaError reconhece o erro depois de passar pelo pipeline real', async () => {
    mockJavaErrorResponse(422, 'REGRA_DE_NEGOCIO',
      'Versão do termo desatualizada. Versão vigente: v1.1. Recarregue o aplicativo e tente novamente.');

    let caught: unknown;
    try {
      await register(req);
    } catch (err) {
      caught = err;
    }
    expect(isVersaoTermoDesatualizadaError(caught)).toBe(true);
  });

  it('não confunde outro 422 REGRA_DE_NEGOCIO real (aviso de privacidade) depois do pipeline real', async () => {
    mockJavaErrorResponse(422, 'REGRA_DE_NEGOCIO',
      'Tutor não recebeu o aviso de privacidade. Entre em contato com a clínica para regularizar.');

    let caught: unknown;
    try {
      await register(req);
    } catch (err) {
      caught = err;
    }
    expect(isVersaoTermoDesatualizadaError(caught)).toBe(false);
  });

  it('outro erro real do Java (404, convite não encontrado) também chega com o texto real, não o fallback genérico', async () => {
    mockJavaErrorResponse(404, 'NAO_ENCONTRADO', 'Convite não encontrado para o token informado.');

    await expect(register(req)).rejects.toMatchObject({
      status:  404,
      code:    'NAO_ENCONTRADO',
      message: 'Convite não encontrado para o token informado.',
    });
  });
});
