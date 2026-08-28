// Android 8+ (API 26) exige que toda notificacao pertenca a um CANAL: sem canal
// registrado, o sistema descarta a notificacao em vez de exibi-la. `setupHandlers`
// registrava os listeners e o handler de apresentacao, mas nunca criava canal nenhum
// -- e o app declara `expo-notifications` com uma cor de acento no app.json, que so
// tem efeito atraves de um canal.
import { Platform } from 'react-native';
import { setupHandlers } from '../services/notifications.service';

const mockSetNotificationChannelAsync = jest.fn(async (..._a: unknown[]) => ({}));
jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync:  (...a: unknown[]) => mockSetNotificationChannelAsync(...a),
  setNotificationHandler:       jest.fn(),
  addNotificationReceivedListener:         jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getExpoPushTokenAsync:   jest.fn(),
  getPermissionsAsync:     jest.fn(),
  requestPermissionsAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
}));

const qc = { invalidateQueries: jest.fn() } as never;
const router = { push: jest.fn() } as never;

beforeEach(() => mockSetNotificationChannelAsync.mockClear());

describe('setupHandlers — canal de notificação', () => {
  it('registra um canal no Android', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

    setupHandlers(qc, router);
    await Promise.resolve();

    expect(mockSetNotificationChannelAsync).toHaveBeenCalled();
    const [id, config] = mockSetNotificationChannelAsync.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(typeof id).toBe('string');
    // A cor tem que ser a MESMA declarada no plugin expo-notifications do app.json;
    // duas fontes divergindo dariam acento diferente do que o build configura.
    expect(config.lightColor).toBe('#4A6944');
  });

  it('não registra canal no iOS (canais são conceito exclusivo do Android)', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

    setupHandlers(qc, router);
    await Promise.resolve();

    expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled();
  });
});
