// BR-TUT-T11 fix wave (G2 I-1, m-3..m-6): o que antes era regex no fonte agora é RENDER (ou service) — comentário/código morto não passa.
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';
import { ToastProvider } from '../components/feedback/Toast';
import { KChip } from '../components/primitives/KChip';
import { KIcon } from '../components/primitives/KIcon';
import { VacinaItem } from '../components/domain/VacinaItem';
import { useAuthStore } from '../store/authStore';

import RegisterScreen from '../app/register';
import PerfilScreen from '../app/(tabs)/perfil/index';
import ConsentimentosScreen from '../app/(tabs)/perfil/consentimentos';
import MeusPetsScreen from '../app/(tabs)/pets/index';
import { getVacinas } from '../services/vacinas.service';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
  Redirect: () => null,
}));
jest.mock('../services/notifications.service', () => ({
  getPermissionStatus: () => Promise.resolve(false),
  requestPermission: jest.fn(), getDeviceToken: jest.fn(), registerDeviceToken: jest.fn(),
}));
let mockConsentimentos: any[] = [];
jest.mock('../hooks/useConsentimentos', () => ({
  useConsentimentos: () => ({ data: mockConsentimentos, isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 0 }),
  useAssinar: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRevogar: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
let mockPets: any[] = [];
jest.mock('../hooks/usePets', () => ({
  usePets: () => ({ data: mockPets, isLoading: false, isError: false, refetch: jest.fn() }),
}));
const mockGet = jest.fn();
jest.mock('../services/api/client', () => ({ apiClient: { get: (...a: unknown[]) => mockGet(...a) } }));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const W = ({ children }: any) => (
  <QueryClientProvider client={client}>
    <ThemeProvider><KDialogProvider><ToastProvider>{children}</ToastProvider></KDialogProvider></ThemeProvider>
  </QueryClientProvider>
);

describe('I-1 — cadastro: cabeçalho próprio, sem passo fictício (render)', () => {
  it('o header diz CADASTRO, não "NOVO · 1 DE 2"; o subtítulo é o do cadastro', () => {
    const r = render(<RegisterScreen />, { wrapper: W });
    expect(r.getByText('CADASTRO')).toBeTruthy();
    expect(r.queryByText(/DE 2/)).toBeNull();
    expect(r.queryByText(/NOVO/)).toBeNull();
    expect(r.getByText('Com a conta você acompanha as vacinas e os horários dos seus pets.')).toBeTruthy();
    expect(r.queryByText(/Quanto mais detalhes/)).toBeNull();
  });
});

describe('m-3 — consentimento revogado aparece como chip neutro (render)', () => {
  it('"Revogado em …" é um KChip tone=mute', () => {
    mockConsentimentos = [{ idConsentimento: 1, tipo: 'DADOS_ANONIMOS', versaoTermo: 'v1.0', aceito: false, ativo: false, dtAceite: '2026-01-05T10:00:00', dtRevogacao: '2026-02-03T10:00:00' }];
    const r = render(<ConsentimentosScreen />, { wrapper: W });
    const chip = r.UNSAFE_getAllByType(KChip).find(c => String(c.props.children).startsWith('Revogado em'));
    expect(chip).toBeTruthy();
    expect(chip!.props.tone).toBe('mute');
    expect(r.getByText('Revogado em 03/02/2026')).toBeTruthy();
  });
});

describe('m-4 — vacinas.service não inventa data de aplicação (service → tela)', () => {
  it('a view só tem a próxima dose: dtAplicacao fica ausente e a tela não diz "Aplicada em"', async () => {
    mockGet.mockResolvedValueOnce({ data: [{ idPet: 1, nmPet: 'Bóbi', nmVacina: 'V10', dtProximaDose: '2026-11-01', nmClinica: 'KURA' }] });
    const v = (await getVacinas(1))[0]!;
    expect(v.dtAplicacao).toBeUndefined();
    const r = render(<VacinaItem vacina={v} />, { wrapper: W });
    expect(r.queryByText(/Aplicada em/)).toBeNull();
  });
});

describe('m-5 — plural da contagem na lista de pets (render, 2 ramos)', () => {
  const pet = (id: number, extra: any = {}) => ({
    id, nome: `Pet${id}`, especie: 'Cão', raca: 'SRD', nascimento: new Date('2021-03-10'), sexo: 'M', porte: 'M',
    nmClinica: 'KURA', statusGeral: 'OK', nrConsultas: 1, idadeAnos: 3, chips: [], ...extra,
  });
  it('alertas conhecidos: 1 pet ⇒ "1 PET · 0 ALERTAS"; 1 alerta ⇒ "1 ALERTA"; 2 pets ⇒ "2 PETS · 2 ALERTAS"', () => {
    mockPets = [pet(1, { alertasAtivos: 0 })];
    expect(render(<MeusPetsScreen />, { wrapper: W }).getByText('1 PET · 0 ALERTAS')).toBeTruthy();
    mockPets = [pet(1, { alertasAtivos: 1 })];
    expect(render(<MeusPetsScreen />, { wrapper: W }).getByText('1 PET · 1 ALERTA')).toBeTruthy();
    mockPets = [pet(1, { alertasAtivos: 1 }), pet(2, { alertasAtivos: 1 })];
    expect(render(<MeusPetsScreen />, { wrapper: W }).getByText('2 PETS · 2 ALERTAS')).toBeTruthy();
  });
  it('alertas desconhecidos (API real): "1 PET" e "2 PETS", sem "ALERTA"', () => {
    mockPets = [pet(1)];
    const a = render(<MeusPetsScreen />, { wrapper: W });
    expect(a.getByText('1 PET')).toBeTruthy();
    mockPets = [pet(1), pet(2)];
    const b = render(<MeusPetsScreen />, { wrapper: W });
    expect(b.getByText('2 PETS')).toBeTruthy();
    expect(b.queryByText(/ALERTA/)).toBeNull();
  });
});

describe('m-6 — Perfil: o ícone de cada linha é o que foi renderizado', () => {
  it('Nome=perfil, E-mail=mail, Telefone=phone, Modo escuro=moon', async () => {
    useAuthStore.setState({ token: 'jwt', expiresAt: new Date(Date.now() + 3600_000).toISOString(), tutor: { id: 1, nmTutor: 'Rex Tutor', dsEmail: 'a@b.com', dsTelefone: '11999999999', dtCadastro: '' } as any });
    const r = render(<PerfilScreen />, { wrapper: W });
    await waitFor(() => expect(r.getByText('E-MAIL')).toBeTruthy());
    const nomes = r.UNSAFE_getAllByType(KIcon).map(i => i.props.name);
    // a linha é identificada pelo texto do valor; sobe até o container que também contém o ícone
    const iconeDa = (valor: string) => {
      let n: any = r.getByText(valor);
      while (n && n.findAll((x: any) => x.type === KIcon).length === 0) n = n.parent;
      return n.findAll((x: any) => x.type === KIcon)[0].props.name;
    };
    expect(iconeDa('NOME')).toBe('perfil');
    expect(iconeDa('E-MAIL')).toBe('mail');
    expect(iconeDa('TELEFONE')).toBe('phone');
    expect(nomes).toContain('moon');
  });
});
