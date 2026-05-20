import type { InternalAxiosRequestConfig } from 'axios';
import * as authMock from '../../mocks/auth.mock';
import * as petsMock from '../../mocks/pets.mock';
import * as vacinasMock from '../../mocks/vacinas.mock';
import * as agendaMock from '../../mocks/agendamentos.mock';
import * as consentMock from '../../mocks/consentimentos.mock';
import * as notifMock from '../../mocks/notifications.mock';

const ROUTES: Array<[RegExp, (c: InternalAxiosRequestConfig) => Promise<unknown>]> = [
  [/\/auth\/login$/,                        () => authMock.login()],
  [/\/auth\/register$/,                     () => authMock.registerTutor()],
  [/\/tutor\/pets\/\d+\/timeline/,          () => petsMock.timeline()],
  [/\/tutor\/pets\/\d+\/vacinas\/status/,   () => vacinasMock.status()],
  [/\/tutor\/pets\/\d+\/vacinas/,           () => vacinasMock.list()],
  [/\/tutor\/pets\/\d+$/,                   (c) => petsMock.byId(c)],
  [/\/tutor\/pets$/,                        () => petsMock.list()],
  [/\/tutor\/agendamentos$/,                () => agendaMock.list()],
  [/\/tutor\/consentimentos$/,              () => consentMock.list()],
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
