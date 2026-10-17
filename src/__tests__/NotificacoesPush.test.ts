// BR-TUT-T10 fix wave (M-6): o listener de push em primeiro plano compara o tipo que o PRODUTOR grava (LEMBRETE_VACINA,
// notificacao_repo.py da Luna), nao o literal antigo VACINA_VENCENDO. Sem remetente de push hoje (0 nos 3 backends):
// o teste trava o valor para quando o push existir.
import { setupHandlers } from '../services/notifications.service';

const mockRecebida: { cb?: (n: any) => void } = {};
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: (cb: any) => { mockRecebida.cb = cb; return { remove: jest.fn() }; },
  addNotificationResponseReceivedListener: () => ({ remove: jest.fn() }),
}));

const chegou = (dsTipo: string, idPet: number) =>
  mockRecebida.cb!({ request: { content: { data: { dsTipo, idPet } } } });

describe('setupHandlers — push em primeiro plano', () => {
  const qc = { invalidateQueries: jest.fn() } as any;
  beforeEach(() => { qc.invalidateQueries.mockClear(); setupHandlers(qc, { push: jest.fn() } as any); });

  it('LEMBRETE_VACINA com idPet invalida as vacinas daquele pet', () => {
    chegou('LEMBRETE_VACINA', 5);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['pets', 5, 'vacinas'] });
  });

  it('o literal antigo VACINA_VENCENDO não invalida nada (ninguém grava esse tipo)', () => {
    chegou('VACINA_VENCENDO', 5);
    expect(qc.invalidateQueries).not.toHaveBeenCalled();
  });
});
