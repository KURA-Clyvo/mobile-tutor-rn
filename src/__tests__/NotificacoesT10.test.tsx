// BR-TUT-T10 (B-20) — notificações: data junto da hora, tipo opcional (só LEMBRETE_VACINA é reconhecido),
// "Aviso" neutro sem link para todo o resto. Fuso: o jest fixa America/Sao_Paulo (jest.global-setup.js); o
// `dtCriacao` do Java vem SEM fuso (LocalDateTime) e é lido como relógio de parede do aparelho. SUPOSIÇÃO DECLARADA:
// quem escreve a linha define o fuso (a Luna, DEFAULT CURRENT_TIMESTAMP; o TZ do kura-tutor não muda isso) — ver BE-09.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';
import NotificacoesScreen from '../app/notificacoes';
import { StyleSheet } from 'react-native';
import { lightColors } from '../theme/tokens';
import { KChip } from '../components/primitives/KChip';
import { KIcon } from '../components/primitives/KIcon';
import { formatQuandoBR } from '../utils/date';
import { mapNotificacaoDto } from '../utils/mappers';
import { getNotificacoes } from '../services/notifications.service';
import { apiClient } from '../services/api/client';
import type { NotificacaoRaw } from '../types/api';

const mockPush = jest.fn();
const mockMarcarLida = jest.fn();
let mockRaw: any[] = [];
let mockDireto: any[] | null = null; // dado já no formato do app, sem passar pelo mapper
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) }) }));
jest.mock('../services/api/client', () => ({ apiClient: { get: jest.fn() } }));
jest.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({ data: mockDireto ?? mockRaw.map(r => jest.requireActual('../utils/mappers').mapNotificacaoDto(r)), isLoading: false }),
  useMarcarLida:       () => ({ mutate: mockMarcarLida }),
  useMarcarTodasLidas: () => ({ mutate: jest.fn(), isPending: false }),
}));

const W = ({ children }: any) => <QueryClientProvider client={new QueryClient()}><ThemeProvider>{children}</ThemeProvider></QueryClientProvider>;

// Resposta LITERAL do Java de hoje (NotificacaoResponse.java: 5 campos, sem dsTipo/idPet).
const JAVA_HOJE: NotificacaoRaw[] = [
  { idNotificacao: 1, dsTitulo: 'Vacina vencendo', dsMensagem: 'A Gripe Canina vence em 20 dias.', dtCriacao: '2026-10-17T06:23:45.123456', flLida: false },
  { idNotificacao: 2, dsTitulo: 'Agendamento confirmado', dsMensagem: 'Check-up da Luna confirmado.', dtCriacao: '2026-10-16T08:23:00', flLida: true },
  { idNotificacao: 3, dsTitulo: 'Retorno', dsMensagem: 'Retorno do Bóbi.', dtCriacao: '2026-10-12T14:32:00', flLida: true },
];

describe('formatQuandoBR', () => {
  const agora = new Date(2026, 9, 17, 12, 0);
  it('Hoje / Ontem / dia e mês, sempre com a hora', () => {
    expect(formatQuandoBR('2026-10-17T06:23:00', agora)).toBe('Hoje · 06:23');
    expect(formatQuandoBR('2026-10-16T08:23:00', agora)).toBe('Ontem · 08:23');
    expect(formatQuandoBR('2026-10-12T14:32:00', agora)).toBe('12 out · 14:32');
  });
  it('perto da meia-noite: 00:10 de hoje enxerga 23:50 de ontem e 23:59 de anteontem', () => {
    const meiaNoite = new Date(2026, 9, 17, 0, 10);
    expect(formatQuandoBR('2026-10-17T00:05:00', meiaNoite)).toBe('Hoje · 00:05');
    expect(formatQuandoBR('2026-10-16T23:50:00', meiaNoite)).toBe('Ontem · 23:50');
    expect(formatQuandoBR('2026-10-15T23:59:00', meiaNoite)).toBe('15 out · 23:59');
    const quaseMeiaNoite = new Date(2026, 9, 16, 23, 59);
    expect(formatQuandoBR('2026-10-16T23:58:00', quaseMeiaNoite)).toBe('Hoje · 23:58');
  });
  it('fração de 6 dígitos (o que o Java manda, Oracle TIMESTAMP): hora e dia não mudam, inclusive na meia-noite', () => {
    expect(formatQuandoBR('2026-10-17T06:23:45.123456', agora)).toBe('Hoje · 06:23');
    expect(formatQuandoBR('2026-10-16T08:23:05.120000', agora)).toBe('Ontem · 08:23');
    const meiaNoite = new Date(2026, 9, 17, 0, 10);
    expect(formatQuandoBR('2026-10-16T23:59:59.999999', meiaNoite)).toBe('Ontem · 23:59');
    expect(formatQuandoBR('2026-10-17T00:00:00.000001', meiaNoite)).toBe('Hoje · 00:00');
  });
  it('ontem na virada de mês e de ano', () => {
    expect(formatQuandoBR('2026-09-30T10:00:00', new Date(2026, 9, 1, 9, 0))).toBe('Ontem · 10:00');
    expect(formatQuandoBR('2025-12-31T10:00:00', new Date(2026, 0, 1, 9, 0))).toBe('Ontem · 10:00');
  });
  it('outro ano mostra o ano', () => {
    expect(formatQuandoBR('2025-12-30T10:00:00', agora)).toBe('30 dez 2025 · 10:00');
  });
  it('sem fuso = relógio de parede (06:23 continua 06:23); com Z converte para o fuso do aparelho (SP)', () => {
    expect(formatQuandoBR('2026-10-17T06:23:00', agora)).toBe('Hoje · 06:23');
    expect(formatQuandoBR('2026-10-17T09:23:00Z', agora)).toBe('Hoje · 06:23');
  });
  it('data inválida não vira "NaN"', () => {
    expect(formatQuandoBR('lixo', agora)).toBe('');
  });
});

describe('mapNotificacaoDto — tipo opcional, só LEMBRETE_VACINA é reconhecido', () => {
  const base = JAVA_HOJE[0]!;
  it('resposta literal do Java de hoje (sem dsTipo/idPet) ⇒ AVISO, sem idPet', () => {
    for (const r of JAVA_HOJE) {
      const n = mapNotificacaoDto(r);
      expect(n.dsTipo).toBe('AVISO');
      expect(n.idPet).toBeUndefined();
      expect(n.dtEnvio).toBe(r.dtCriacao);
    }
  });
  it('LEMBRETE_VACINA com idPet ⇒ LEMBRETE_VACINA + idPet; sem idPet ⇒ sem idPet', () => {
    expect(mapNotificacaoDto({ ...base, dsTipo: 'LEMBRETE_VACINA', idPet: 7 })).toMatchObject({ dsTipo: 'LEMBRETE_VACINA', idPet: 7 });
    expect(mapNotificacaoDto({ ...base, dsTipo: 'LEMBRETE_VACINA' }).idPet).toBeUndefined();
    expect(mapNotificacaoDto({ ...base, dsTipo: 'LEMBRETE_VACINA', idPet: null }).idPet).toBeUndefined();
  });
  it.each(['COMUNICADO_CLINICA', 'VACINA_VENCENDO', 'AGENDAMENTO_CONFIRMADO', 'lembrete_vacina', 'LEMBRETE_VACINA_X', 'XLEMBRETE_VACINA', ' LEMBRETE_VACINA', '', null])(
    'tipo %p ⇒ AVISO e o idPet é ignorado',
    (t) => {
      const n = mapNotificacaoDto({ ...base, dsTipo: t as any, idPet: 9 });
      expect(n.dsTipo).toBe('AVISO');
      expect(n.idPet).toBeUndefined();
    },
  );
});

describe('getNotificacoes — resposta literal do Java', () => {
  it('toda notificação sai como AVISO, com data', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { content: JAVA_HOJE } });
    const res = await getNotificacoes();
    expect(res.map(n => n.dsTipo)).toEqual(['AVISO', 'AVISO', 'AVISO']);
    expect(res.every(n => !!n.dtEnvio)).toBe(true);
  });
});

describe('NotificacoesScreen (T10)', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 17, 12, 0) });
    mockPush.mockClear(); mockMarcarLida.mockClear(); mockDireto = null;
  });
  afterEach(() => jest.useRealTimers());

  it('resposta de hoje do Java: todo item é "Aviso", mostra data+hora e tocar não navega', () => {
    mockRaw = JAVA_HOJE;
    const u = render(<NotificacoesScreen />, { wrapper: W });
    expect(u.getAllByText('Aviso')).toHaveLength(3);
    expect(u.queryByText('Vacina')).toBeNull();
    expect(u.queryByText(/VER SAÚDE/)).toBeNull();
    expect(u.getByText('Hoje · 06:23')).toBeTruthy();
    expect(u.getByText('Ontem · 08:23')).toBeTruthy();
    expect(u.getByText('12 out · 14:32')).toBeTruthy();
    fireEvent.press(u.getByText('Vacina vencendo'));
    fireEvent.press(u.getByText('Retorno'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('tocar numa não lida continua marcando como lida (e numa lida não chama)', () => {
    mockRaw = JAVA_HOJE;
    const u = render(<NotificacoesScreen />, { wrapper: W });
    fireEvent.press(u.getByText('Vacina vencendo'));
    expect(mockMarcarLida).toHaveBeenCalledWith(1);
    mockMarcarLida.mockClear();
    fireEvent.press(u.getByText('Agendamento confirmado'));
    expect(mockMarcarLida).not.toHaveBeenCalled();
  });

  it('LEMBRETE_VACINA com idPet: chip "Vacina", "VER SAÚDE" e vai ao pet', () => {
    mockRaw = [{ ...JAVA_HOJE[0]!, dsTipo: 'LEMBRETE_VACINA', idPet: 5 }];
    const u = render(<NotificacoesScreen />, { wrapper: W });
    expect(u.getByText('Vacina')).toBeTruthy();
    expect(u.queryByText('Aviso')).toBeNull();
    expect(u.getByText(/VER SAÚDE/)).toBeTruthy();
    fireEvent.press(u.getByText('Vacina vencendo'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/pets/5');
  });

  it('LEMBRETE_VACINA sem idPet: vai à aba Saúde', () => {
    mockRaw = [{ ...JAVA_HOJE[0]!, dsTipo: 'LEMBRETE_VACINA' }];
    const u = render(<NotificacoesScreen />, { wrapper: W });
    fireEvent.press(u.getByText('Vacina vencendo'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/saude');
  });

  it('defesa na tela: um AVISO que chegue com idPet (sem passar pelo mapper) também não navega', () => {
    mockDireto = [{ id: 1, dsTipo: 'AVISO', dsTitulo: 'Aviso direto', dsMensagem: 'x', dtEnvio: '2026-10-17T06:23:00', flLida: false, idPet: 5 }];
    const u = render(<NotificacoesScreen />, { wrapper: W });
    fireEvent.press(u.getByText('Aviso direto'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('tipo desconhecido com idPet: "Aviso", sem link, sem navegação', () => {
    mockRaw = [{ ...JAVA_HOJE[0]!, dsTipo: 'COMUNICADO_CLINICA', idPet: 5 }];
    const u = render(<NotificacoesScreen />, { wrapper: W });
    expect(u.getByText('Aviso')).toBeTruthy();
    expect(u.queryByText(/VER SAÚDE/)).toBeNull();
    fireEvent.press(u.getByText('Vacina vencendo'));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// BR-TUT-T10 fix wave (I-2): "Aviso" != "Vacina" em tom, icone e rotulo de acessibilidade (B-20: neutro, sem link).
describe('NotificacoesScreen — Aviso é neutro, Vacina é âmbar com link (I-2)', () => {
  beforeEach(() => { jest.useFakeTimers({ now: new Date(2026, 9, 17, 12, 0) }); });
  afterEach(() => jest.useRealTimers());

  const um = (extra: object) => { mockRaw = [{ ...JAVA_HOJE[0]!, ...extra }]; return render(<NotificacoesScreen />, { wrapper: W }); };
  const iconesDoItem = (u: ReturnType<typeof render>) => u.UNSAFE_getAllByType(KIcon).map(i => i.props.name).filter(n => n !== 'back');
  const fundoDoChip = (u: ReturnType<typeof render>, rotulo: string) => {
    let n: any = u.getByText(rotulo);
    while (n && !StyleSheet.flatten(n.props.style)?.backgroundColor) n = n.parent;
    return StyleSheet.flatten(n.props.style).backgroundColor;
  };

  it('tom: Aviso usa o chip neutro (surface2), Vacina o âmbar', () => {
    const aviso = um({});
    expect(aviso.UNSAFE_getByType(KChip).props.tone).toBe('mute');
    expect(fundoDoChip(aviso, 'Aviso')).toBe(lightColors.surface2);
    expect(fundoDoChip(aviso, 'Aviso')).not.toBe(lightColors.amberPale);
    const vacina = um({ dsTipo: 'LEMBRETE_VACINA', idPet: 5 });
    expect(vacina.UNSAFE_getByType(KChip).props.tone).toBe('amber');
    expect(fundoDoChip(vacina, 'Vacina')).toBe(lightColors.amberPale);
  });

  it('ícone: Aviso é o sino (cor neutra), Vacina é a seringa (âmbar)', () => {
    const aviso = um({});
    expect(iconesDoItem(aviso)).toEqual(['bell']);
    expect(aviso.UNSAFE_getAllByType(KIcon).find(i => i.props.name === 'bell')!.props.color).toBe(lightColors.textSoft);
    const vacina = um({ dsTipo: 'LEMBRETE_VACINA', idPet: 5 });
    expect(iconesDoItem(vacina)).toEqual(['vaccine']);
    expect(vacina.UNSAFE_getAllByType(KIcon).find(i => i.props.name === 'vaccine')!.props.color).toBe(lightColors.amberInk);
  });

  it('forma (M-4): Aviso NÃO LIDO tem contorno do chip e anel do sino com cor própria (≠ borda do cartão = surface2 no escuro); lido volta à borda comum', () => {
    const borda = (u: ReturnType<typeof render>, n: any) => { while (n && !StyleSheet.flatten(n.props.style)?.borderColor) n = n.parent; return StyleSheet.flatten(n.props.style).borderColor; };
    const naoLido = um({});
    expect(borda(naoLido, naoLido.getByText('Aviso'))).toBe(lightColors.textMuteInk);
    const anel = naoLido.UNSAFE_getAllByType(KIcon).find(i => i.props.name === 'bell')!.parent!.parent;
    expect(borda(naoLido, anel)).toBe(lightColors.textMuteInk);
    const lido = um({ flLida: true });
    expect(borda(lido, lido.getByText('Aviso'))).toBe(lightColors.border);
  });

  it('leitor de tela: só a Vacina anuncia "Ver saúde"; o Aviso não promete link', () => {
    const aviso = um({});
    const rAviso = aviso.getByRole('button', { name: /Vacina vencendo/ }).props.accessibilityLabel as string;
    expect(rAviso).toMatch(/^Não lida: Vacina vencendo\./);
    expect(rAviso).not.toMatch(/ver saúde/i);
    const vacina = um({ dsTipo: 'LEMBRETE_VACINA', idPet: 5 });
    const rVac = vacina.getAllByRole('button', { name: /Vacina vencendo/ })[0]!.props.accessibilityLabel as string;
    expect(rVac).toMatch(/\. Ver saúde$/);
  });
});
