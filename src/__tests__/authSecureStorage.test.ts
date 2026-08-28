// O JWT ficava em AsyncStorage, que grava em claro (SharedPreferences no Android, um
// arquivo no sandbox do app no iOS). Passa a morar no SecureStore (Keystore/Keychain).
//
// Só o TOKEN vai para lá, não a sessão inteira: o SecureStore tem limite de 2048 bytes
// por valor (VALUE_BYTES_LIMIT em byteCounter.ts) e o resto do store — tutor,
// expiresAt, themeOverride — não é segredo e cresce sem teto previsível.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { criarAuthStorage, CHAVE_TOKEN } from '../store/authSecureStorage';

const mockSecure = { itens: new Map<string, string>(), disponivel: true };
jest.mock('expo-secure-store', () => ({
  isAvailableAsync: async () => mockSecure.disponivel,
  getItemAsync:     async (k: string) => mockSecure.itens.get(k) ?? null,
  setItemAsync:     async (k: string, v: string) => { mockSecure.itens.set(k, v); },
  deleteItemAsync:  async (k: string) => { mockSecure.itens.delete(k); },
}));

const NOME = 'KURA_TUTOR_AUTH_TOKEN';
const JWT  = 'eyJhbGciOiJIUzI1NiJ9.corpo.assinatura';
const blob = (token: string | null) => JSON.stringify({
  state: { token, expiresAt: '2030-01-01T00:00:00.000Z', tutor: { id: 1 }, themeOverride: 'dark' },
  version: 0,
});

let asyncStore: Map<string, string>;
beforeEach(() => {
  asyncStore = new Map();
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (k, v) => { asyncStore.set(k, v); });
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k) => asyncStore.get(k) ?? null);
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (k) => { asyncStore.delete(k); });
  mockSecure.itens.clear();
  mockSecure.disponivel = true;
});

describe('authSecureStorage', () => {
  it('grava o JWT no SecureStore e NUNCA em claro no AsyncStorage', async () => {
    const s = criarAuthStorage();
    await s.setItem(NOME, blob(JWT));

    expect(mockSecure.itens.get(CHAVE_TOKEN)).toBe(JWT);
    expect(asyncStore.get(NOME)).not.toContain(JWT);
  });

  it('remonta a sessão inteira na leitura (token do SecureStore + resto do AsyncStorage)', async () => {
    const s = criarAuthStorage();
    await s.setItem(NOME, blob(JWT));

    const lido = JSON.parse((await s.getItem(NOME))!);
    expect(lido.state.token).toBe(JWT);
    expect(lido.state.themeOverride).toBe('dark');
    expect(lido.state.tutor).toEqual({ id: 1 });
  });

  it('migra sessão antiga sem deslogar: token que estava no blob continua válido', async () => {
    // Estado de quem ja tem o app instalado: o token gravado em claro pelo formato antigo.
    asyncStore.set(NOME, blob(JWT));
    const s = criarAuthStorage();

    const lido = JSON.parse((await s.getItem(NOME))!);
    expect(lido.state.token).toBe(JWT);          // continua logado
    expect(mockSecure.itens.get(CHAVE_TOKEN)).toBe(JWT); // e ja foi movido
  });

  it('a migração apaga o token em claro do AsyncStorage', async () => {
    asyncStore.set(NOME, blob(JWT));
    const s = criarAuthStorage();

    await s.getItem(NOME);

    expect(asyncStore.get(NOME)).not.toContain(JWT);
  });

  it('sem SecureStore (web), degrada para AsyncStorage em vez de perder a sessão', async () => {
    mockSecure.disponivel = false;
    const s = criarAuthStorage();

    await s.setItem(NOME, blob(JWT));
    const lido = JSON.parse((await s.getItem(NOME))!);

    expect(lido.state.token).toBe(JWT);
  });

  it('removeItem limpa os dois lados', async () => {
    const s = criarAuthStorage();
    await s.setItem(NOME, blob(JWT));

    await s.removeItem(NOME);

    expect(mockSecure.itens.size).toBe(0);
    expect(asyncStore.size).toBe(0);
  });
});
