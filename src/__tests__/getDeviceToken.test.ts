// `getDeviceToken()` embrulhava `getExpoPushTokenAsync()` num `catch { return null }`
// cego. Duas falhas MUITO diferentes caíam nesse mesmo silêncio:
//
//  1. rede indisponível — esperada, e a própria doc do expo-notifications manda tratar
//     assim ("implement retry logic to attempt to get the push token later");
//  2. `ERR_NOTIFICATIONS_NO_EXPERIENCE_ID` — o SDK não achou `extra.eas.projectId`
//     em lugar nenhum (getExpoPushTokenAsync.js:49-53). Não é transitório: é config
//     faltando, nunca se resolve sozinha, e some com o push em TODO build de produção.
//     `app.json` não tem `extra.eas` — então hoje é este o caminho que roda.
//
// Engolir (2) junto com (1) é o motivo de isso ter sobrevivido: `usePushTokenSync`
// roda em todo boot, chama isto, recebe `null` e desiste sem deixar rastro.
import { getDeviceToken } from '../services/notifications.service';

const mockGetExpoPushTokenAsync = jest.fn();
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync:   (...args: unknown[]) => mockGetExpoPushTokenAsync(...args),
  getPermissionsAsync:     jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler:  jest.fn(),
  addNotificationReceivedListener:         jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

/** Reproduz o CodedError que o expo-notifications lança quando não acha o projectId. */
function erroDeConfig() {
  const e: Error & { code?: string } = new Error('No "projectId" found.');
  e.code = 'ERR_NOTIFICATIONS_NO_EXPERIENCE_ID';
  return e;
}

let erro: jest.SpyInstance;
beforeEach(() => {
  mockGetExpoPushTokenAsync.mockReset();
  erro = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => erro.mockRestore());

describe('getDeviceToken()', () => {
  it('devolve o token quando o SDK resolve', async () => {
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    await expect(getDeviceToken()).resolves.toBe('ExponentPushToken[abc]');
    expect(erro).not.toHaveBeenCalled();
  });

  it('config faltando: reporta o que fazer, em vez de sumir em silêncio', async () => {
    mockGetExpoPushTokenAsync.mockRejectedValue(erroDeConfig());

    await expect(getDeviceToken()).resolves.toBeNull();

    expect(erro).toHaveBeenCalled();
    // A mensagem tem que nomear a chave que falta e o comando que a cria — um
    // "[Push] erro" genérico manda o dev de volta pro mesmo lugar onde o bug morava.
    const mensagem = erro.mock.calls.flat().join(' ');
    expect(mensagem).toContain('extra.eas.projectId');
    expect(mensagem).toContain('eas init');
  });

  it('falha de rede: continua silenciosa (é transitória, e roda em todo boot)', async () => {
    mockGetExpoPushTokenAsync.mockRejectedValue(new Error('Network request failed'));

    await expect(getDeviceToken()).resolves.toBeNull();

    expect(erro).not.toHaveBeenCalled();
  });

  // LGPD: o serviço exige que o valor do token nunca seja logado.
  it('nunca imprime o valor do token', async () => {
    mockGetExpoPushTokenAsync.mockRejectedValue(erroDeConfig());
    await getDeviceToken();
    expect(erro.mock.calls.flat().join(' ')).not.toContain('ExponentPushToken');
  });
});
