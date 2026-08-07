import type { InternalAxiosRequestConfig } from 'axios';
import * as authMock from '../../mocks/auth.mock';
import * as petsMock from '../../mocks/pets.mock';
import * as vacinasMock from '../../mocks/vacinas.mock';
import * as agendaMock from '../../mocks/agendamentos.mock';
import * as consentMock from '../../mocks/consentimentos.mock';
import * as notifMock from '../../mocks/notifications.mock';

const ROUTES: [RegExp, (c: InternalAxiosRequestConfig) => Promise<unknown>][] = [
  [/\/auth\/login$/,                        () => authMock.login()],
  [/\/auth\/register-invite$/,              () => authMock.registerTutor()],
  // TASK-65 (FIX_5): rota de detalhe tem que vir ANTES da de lista e anchorada com
  // `$` — a regex antiga de lista (`/timeline`, sem `$`) casava com QUALQUER url
  // que contivesse "timeline", inclusive `/timeline/:idEvento` (detalhe), e devolvia
  // a lista inteira onde getEventDetail() esperava um item único (ver B0.4: "regex
  // ampla que sequestra rota de outra").
  [/\/tutor\/pets\/\d+\/timeline\/\d+$/,    (c) => petsMock.timelineDetail(c)],
  [/\/tutor\/pets\/\d+\/timeline$/,         (c) => petsMock.timeline(c)],
  [/\/tutor\/pets\/\d+\/vacinas\/status$/,  (c) => vacinasMock.status(c)],
  [/\/tutor\/pets\/\d+\/vacinas$/,          (c) => vacinasMock.list(c)],
  [/\/tutor\/pets\/\d+$/,                   (c) => petsMock.byId(c)],
  [/\/tutor\/pets$/,                        () => petsMock.list()],
  // TASK-65 (FIX_5): a rota antiga era cega a método — GET e POST em /agendamentos
  // caíam os dois em `agendaMock.list()`, então `solicitarAgendamento()` (POST)
  // recebia de volta um ARRAY (a listagem) em vez do objeto único que
  // `SolicitarAgendamentoResponse`/`agendaMock.criar()` produzem. `criar()` já
  // existia no mock desde sempre, mas nunca era chamado pelo adapter.
  [/\/tutor\/agendamentos$/,                (c) => c.method === 'post' ? agendaMock.criar() : agendaMock.list()],
  [/\/tutor\/consentimentos\/\d+$/,          () => Promise.resolve({ id: 1, sgStatus: 'REVOGADO', dtRevogacao: new Date().toISOString() })],
  [/\/tutor\/consentimentos$/,              (c) => {
    if (c.method === 'post') {
      // TASK-65 (FIX_5): assinar() e revogar() batem no MESMO endpoint (revogação é
      // insert-only — POST com dsAceite:'NAO', ver consentimentos.service.ts:15-18) —
      // e este handler devolvia sgStatus:'ATIVO' fixo pra QUALQUER POST, ignorando o
      // corpo. `revogar()` (que espera RevogarConsentimentoResponse.sgStatus ===
      // 'REVOGADO') recebia de volta um objeto dizendo 'ATIVO' — o oposto do que foi
      // pedido. Não lançava (os dois tipos de resposta têm o mesmo formato de campos),
      // mas corrompia silenciosamente o resultado. `config.data` pode chegar como
      // string JSON ou objeto já desserializado, dependendo do ponto do pipeline do
      // axios em que o interceptor de mock intercepta — tratamos os dois.
      const body = typeof c.data === 'string' ? JSON.parse(c.data || '{}') : (c.data ?? {});
      const isRevogacao = body.dsAceite === 'NAO';
      if (isRevogacao) {
        return Promise.resolve({ id: Math.floor(Math.random() * 9000 + 1000), sgStatus: 'REVOGADO', dtRevogacao: new Date().toISOString() });
      }
      return Promise.resolve({ id: Math.floor(Math.random() * 9000 + 1000), sgStatus: 'ATIVO', dtConsentimento: new Date().toISOString(), dsIdempotencyKey: 'mock-key' });
    }
    return consentMock.list();
  }],
  [/\/tutor\/notificacoes\/\d+\/lida/,      () => Promise.resolve({ id: 1, flLida: true })],
  [/\/tutor\/notificacoes\/lidas/,          () => Promise.resolve({ count: 3 })],
  [/\/tutor\/notificacoes$/,                () => notifMock.list()],
];

export async function resolveMock(config: InternalAxiosRequestConfig) {
  const url = config.url ?? '';
  for (const [pattern, handler] of ROUTES) {
    if (pattern.test(url)) {
      await new Promise(r => setTimeout(r, 300));
      return { data: await handler(config), status: 200, config };
    }
  }
  throw new Error(`[MockAdapter] No mock for ${config.method?.toUpperCase()} ${url}`);
}
