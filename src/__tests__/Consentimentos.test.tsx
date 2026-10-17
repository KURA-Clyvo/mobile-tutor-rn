import React from 'react';
import { StyleSheet, Switch } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';

import { LGPD_CONSENTIMENTOS, CONSEQUENCIA_REVOGAR } from '../constants/lgpd';
import ConsentimentosScreen from '../app/(tabs)/perfil/consentimentos';

// TASK-F02 (rodada de fix 1): useVoltar() (usado por ConsentimentosScreen
// desde a migração) chama router.canGoBack() — mock antigo só declarava
// `back`, e um teste que pressionasse "Voltar" quebrava com
// "router.canGoBack is not a function". mockBack/mockReplace/mockCanGoBack
// no escopo do módulo pra serem controláveis pelo describe de baixo.
const mockBack      = jest.fn();
const mockReplace   = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: mockCanGoBack }),
}));
// TASK-73 (FIX_7): shape real do Java (ConsentimentoResponse: idConsentimento/tipo/
// versaoTermo/aceito/ativo/dtAceite/dtRevogacao) — antes usava campos que não
// existem no backend (id/dsTipoConsentimento/sgStatus/dtConsentimento), com os 3
// tipos inventados (COMUNICACAO_WHATSAPP/DADOS_CLINICOS_IA/
// COMPARTILHAMENTO_LABORATORIO) que também não existem. Cobre os 5 tipos reais:
// LEMBRETES ativo, DADOS_ANONIMOS revogado, os outros 3 pendentes (ausentes da
// lista).
const mockRevogar = jest.fn(() => Promise.resolve());
jest.mock('../hooks/useConsentimentos', () => ({
  useConsentimentos: () => ({
    data: [
      { idConsentimento: 1, tipo: 'LEMBRETES', versaoTermo: 'v1.0', aceito: true, ativo: true, dtAceite: new Date().toISOString(), dtRevogacao: null },
      { idConsentimento: 2, tipo: 'DADOS_ANONIMOS', versaoTermo: 'v1.0', aceito: false, ativo: false, dtAceite: '2026-09-01T10:00:00', dtRevogacao: '2026-10-01T10:00:00' },
      { idConsentimento: 3, tipo: 'TELEORIENTACAO', versaoTermo: 'v1.0', aceito: true, ativo: true, dtAceite: new Date().toISOString(), dtRevogacao: null },
    ],
  }),
  useAssinar:  () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRevogar:  () => ({ mutateAsync: mockRevogar, isPending: false }),
}));

const W = ({ children }: any) => {
  const qc = new QueryClient();
  // TASK-F06: KDialogProvider é obrigatório — a tela usa `useDialog()` para a
  // confirmação de revogação de consentimento (LGPD).
  return <QueryClientProvider client={qc}><ThemeProvider><KDialogProvider>{children}</KDialogProvider></ThemeProvider></QueryClientProvider>;
};

describe('ConsentimentosScreen (BR-TUT-T08)', () => {
  it('os 4 opcionais ficam em linhas com o nome do canvas; Lembretes NÃO é uma linha', async () => {
    const { getByText, queryByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(getByText('Teleorientação por vídeo')).toBeTruthy());
    expect(getByText('Dados anonimizados para pesquisa')).toBeTruthy();
    expect(getByText('Compartilhar com seguradora')).toBeTruthy();
    expect(getByText('Novidades e ofertas')).toBeTruthy();
    expect(queryByText('Lembretes e comunicados da clínica')).toBeNull();
  });

  it('seção "Necessário para o serviço" com Lembretes, sem Revogar/Autorizar/chave para ele', async () => {
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    await u.findByText('Necessário para o serviço');
    expect(u.getByText(/Lembretes de vacina e de horário/)).toBeTruthy();
    expect(u.queryByLabelText(/Lembretes/)).toBeNull();
    expect(u.UNSAFE_queryAllByType(Switch)).toHaveLength(0);
    // 1 Revogar (Teleorientação ativa) + 3 Autorizar (anonimizados revogado, seguradora e novidades pendentes)
    expect(u.getAllByLabelText(/^Revogar /)).toHaveLength(1);
    expect(u.getAllByLabelText(/^Autorizar /)).toHaveLength(3);
  });

  it('texto de estado por linha: Autorizado hoje / Revogado em data / Não autorizado', async () => {
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    await u.findByText('Autorizado hoje');
    expect(u.getByText('Revogado em 01/10/2026')).toBeTruthy();
    expect(u.getAllByText('Não autorizado')).toHaveLength(2);
    expect(u.queryByText('Pendente')).toBeNull();
  });

  it('alvos de toque >= 44 nos botões de cada linha', async () => {
    const u = render(<ConsentimentosScreen />, { wrapper: W });
    await u.findByText('Autorizado hoje');
    for (const b of [...u.getAllByLabelText(/^Revogar /), ...u.getAllByLabelText(/^Autorizar /)]) {
      const st = StyleSheet.flatten(typeof b.props.style === 'function' ? b.props.style({ pressed: false }) : b.props.style);
      expect(st.minHeight).toBeGreaterThanOrEqual(44);
    }
  });

  it('Autorizar abre o texto completo com Aceitar', async () => {
    const { getAllByLabelText, getByText } = render(<ConsentimentosScreen />, { wrapper: W });
    fireEvent.press(getAllByLabelText(/^Autorizar /)[0]!);
    await waitFor(() => expect(getByText('Aceitar')).toBeTruthy());
  });
});

describe('Consentimentos — contrato e cópia (BR-TUT-T08, m9)', () => {
  it('as chaves são exatamente os 5 valores do enum Java TipoConsentimento (d1522ee)', () => {
    expect(Object.keys(LGPD_CONSENTIMENTOS).sort())
      .toEqual(['COMPARTILHAR_SEGURADORA', 'DADOS_ANONIMOS', 'LEMBRETES', 'MARKETING', 'TELEORIENTACAO']);
  });

  // Âncora: nenhum código dos 3 backends consome estes 3 tipos (grep em dotnet/luna => 0, ver br-tut-t08-report.md).
  it.each(['DADOS_ANONIMOS', 'COMPARTILHAR_SEGURADORA', 'MARKETING'] as const)(
    '%s: a cópia não promete processamento que nenhum backend faz', (tipo) => {
      const meta = LGPD_CONSENTIMENTOS[tipo];
      const tudo = `${meta.resumo} ${meta.textoCompleto} ${CONSEQUENCIA_REVOGAR[tipo]}`;
      expect(tudo).not.toMatch(/TLS|criptograf|canal seguro|algoritmos|Luna|via WhatsApp|deixa de receber|deixam de ser/i);
      expect(meta.textoCompleto).toMatch(/ainda não/i);
    });

  it('a consequência de TELEORIENTACAO é real (o .NET recusa a sala sem o consentimento)', () => {
    expect(CONSEQUENCIA_REVOGAR.TELEORIENTACAO).toMatch(/deixa de poder fazer teleorientação/);
  });

  it('LEMBRETES não tem consequência de revogação (não é revogável na tela)', () => {
    expect(Object.keys(CONSEQUENCIA_REVOGAR)).not.toContain('LEMBRETES');
  });
});

// TASK-F02 (rodada de fix 1): segunda mordida real de call site migrado
// (a primeira é em RegisterScreen.test.tsx, cenário "sem histórico"). Este
// cobre o cenário "com histórico" numa tela diferente — chegada normal por
// navegação (perfil -> consentimentos), não deep link.
describe('ConsentimentosScreen — botão Voltar (TASK-F02)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack.mockReset();
  });

  it('com histórico (canGoBack=true): back() puro, replace NUNCA chamado — comportamento preservado', async () => {
    mockCanGoBack.mockReturnValue(true);
    const { getByLabelText, findByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await findByText('Teleorientação por vídeo');
    fireEvent.press(getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('sem histórico (canGoBack=false): replace("/(tabs)/perfil"), back() NUNCA chamado', async () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByLabelText, findByText } = render(<ConsentimentosScreen />, { wrapper: W });
    await findByText('Teleorientação por vídeo');
    fireEvent.press(getByLabelText('Voltar'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/perfil');
    expect(mockBack).not.toHaveBeenCalled();
  });
});

// TASK-F06: fluxo DESTRUTIVO e de LGPD — revogar consentimento NÃO pode virar
// ação direta na migração de Alert.alert para KDialog. Revogar sem confirmar é
// regressão de produto, não de estilo. Não existia teste desta confirmação
// antes desta task.
describe('ConsentimentosScreen — revogação exige confirmação (TASK-F06)', () => {
  beforeEach(() => mockRevogar.mockClear());

  // TELEORIENTACAO é o único opcional ativo no fixture: o único botão "Revogar".
  const desligarOAtivo = (utils: ReturnType<typeof render>) => {
    fireEvent.press(utils.getByLabelText('Revogar Teleorientação por vídeo'));
  };

  it('abre o diálogo e NÃO revoga enquanto o tutor não confirmar', async () => {
    const utils = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(utils.getByText('Teleorientação por vídeo')).toBeTruthy());

    desligarOAtivo(utils);

    await waitFor(() => expect(utils.getByTestId('kdialog-titulo').props.children)
      .toBe('Revogar consentimento?'));
    expect(mockRevogar).not.toHaveBeenCalled();

    fireEvent.press(utils.getByTestId('kdialog-acao-__cancelar__'));
    await waitFor(() => expect(utils.queryByTestId('kdialog-card')).toBeNull());
    expect(mockRevogar).not.toHaveBeenCalled();
  });

  it('revoga quando o botão destrutivo é tocado', async () => {
    const utils = render(<ConsentimentosScreen />, { wrapper: W });
    await waitFor(() => expect(utils.getByText('Teleorientação por vídeo')).toBeTruthy());

    desligarOAtivo(utils);
    const destrutivo = await waitFor(() => utils.getByTestId('kdialog-acao-__confirmar__'));
    expect(destrutivo.props.accessibilityHint).toBe('Ação destrutiva. Não pode ser desfeita.');
    fireEvent.press(destrutivo);

    await waitFor(() => expect(mockRevogar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'TELEORIENTACAO' }),
    ));
  });
});
