import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KDialogProvider } from '../components/primitives/KDialog';

import RegisterScreen from '../app/register';
import { register } from '../services/auth.service';

// TASK-F02 (rodada de fix 1): useVoltar() chama router.canGoBack(), então
// qualquer mock de expo-router usado por uma tela migrada precisa declarar
// canGoBack — sem isso, o botão Voltar quebra com "router.canGoBack is not
// a function" no primeiro teste que de fato pressioná-lo. mockBack/
// mockReplace/mockCanGoBack ficam no escopo do módulo (prefixo "mock",
// permitido pelo hoist do jest) para serem controláveis por teste — ver
// describe('RegisterScreen — botão Voltar (TASK-F02)') mais abaixo.
const mockBack      = jest.fn();
const mockReplace   = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter:            () => ({ replace: mockReplace, push: jest.fn(), back: mockBack, canGoBack: mockCanGoBack }),
  useLocalSearchParams: () => ({ token: 'mock-invite-token-123', clinicaId: '1' }),
}));
// isVersaoTermoDesatualizadaError fica com a implementação REAL (jest.requireActual)
// — só login/register são mockados. O ponto do teste de 422 abaixo é exercitar a
// integração real entre register.tsx e o helper, não um dublê dele.
jest.mock('../services/auth.service', () => ({
  ...jest.requireActual('../services/auth.service'),
  login:    jest.fn(),
  register: jest.fn(),
}));
jest.mock('../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({
    setSession:       jest.fn(),
    themeOverride:    null,
    setThemeOverride: jest.fn(),
  }),
}));

// TASK-F06: RegisterScreen deixou de chamar Alert.alert e passou a usar
// `useDialog()`. Wrapper com o KDialogProvider REAL, na ordem da raiz.
const W = ({ children }: any) => (
  <ThemeProvider>
    <KDialogProvider>{children}</KDialogProvider>
  </ThemeProvider>
);

describe('RegisterScreen', () => {
  beforeEach(() => {
    (register as jest.Mock).mockClear();
  });

  it('renders invite banner when token present', () => {
    const { getByText } = render(<RegisterScreen />, { wrapper: W });
    expect(getByText(/Convidado pela clínica/)).toBeTruthy();
  });

  it('shows validation error when passwords do not match', async () => {
    const { getByLabelText, getByText, findByText } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.changeText(getByLabelText('Seu nome'),        'Guilherme Sola');
    fireEvent.changeText(getByLabelText('E-mail'),          'gui@kura.com');
    fireEvent.changeText(getByLabelText('Telefone'),        '11999990001');
    fireEvent.changeText(getByLabelText('Senha'),           'senha123');
    fireEvent.changeText(getByLabelText('Confirmar senha'), 'senha456');
    fireEvent.press(getByText('Criar conta'));
    expect(await findByText('As senhas não coincidem')).toBeTruthy();
  });

  const preencher = (u: ReturnType<typeof render>) => {
    fireEvent.changeText(u.getByLabelText('Seu nome'),        'Guilherme Sola');
    fireEvent.changeText(u.getByLabelText('E-mail'),          'gui@kura.com');
    fireEvent.changeText(u.getByLabelText('Telefone'),        '11999990001');
    fireEvent.changeText(u.getByLabelText('Senha'),           'senha1234');
    fireEvent.changeText(u.getByLabelText('Confirmar senha'), 'senha1234');
  };
  const sessao = (id: number) => ({ idTutor: id, accessToken: 'tok', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });

  // BR-TUT-T08 (T2): só o necessário ao serviço (lembretes) é parte do cadastro; nenhum opcional condiciona a conta.
  it('cadastro conclui SEM marcar nenhum opcional (teleorientação desmarcada, lembretes é o necessário ao serviço)', async () => {
    (register as jest.Mock).mockResolvedValueOnce(sessao(42));
    const u = render(<RegisterScreen />, { wrapper: W });
    preencher(u);
    fireEvent.press(u.getByText('Criar conta'));
    await waitFor(() => expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ inviteToken: 'mock-invite-token-123', aceiteLembretes: true, aceiteTeleorientacao: false })
    ));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/pets');
  });

  it('lembretes aparece como aviso "Necessário para o serviço", sem checkbox; só a teleorientação é caixa, e vem desmarcada', () => {
    const u = render(<RegisterScreen />, { wrapper: W });
    expect(u.getByText('Necessário para o serviço')).toBeTruthy();
    expect(u.queryByLabelText(/lembretes/i)).toBeNull();
    const caixas = u.getAllByRole('checkbox');
    expect(caixas).toHaveLength(1);
    expect(caixas[0]!.props.accessibilityState.checked).toBe(false);
    expect(u.queryByText(/Obrigatório/i)).toBeNull();
  });

  it('marcar a teleorientação opcional é enviado como aceite', async () => {
    (register as jest.Mock).mockResolvedValueOnce(sessao(43));
    const u = render(<RegisterScreen />, { wrapper: W });
    preencher(u);
    fireEvent.press(u.getByLabelText('Autorizo o uso de teleorientação por chamada de vídeo (opcional)'));
    fireEvent.press(u.getByText('Criar conta'));
    await waitFor(() => expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ aceiteLembretes: true, aceiteTeleorientacao: true })
    ));
  });

  it('mostra mensagem de "atualize o app" quando o backend recusa por versão de termo desatualizada (422)', async () => {
    // Mensagem real que ValidadorConsentimento.validarVersaoTermo produz
    // (backend-tutor-java) — status 422, code REGRA_DE_NEGOCIO.
    (register as jest.Mock).mockRejectedValueOnce({
      status: 422,
      code: 'REGRA_DE_NEGOCIO',
      message: 'Versão do termo desatualizada. Versão vigente: v1.1. Recarregue o aplicativo e tente novamente.',
    });
    const { getByLabelText, getByText, getByTestId } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.changeText(getByLabelText('Seu nome'),        'Guilherme Sola');
    fireEvent.changeText(getByLabelText('E-mail'),          'gui@kura.com');
    fireEvent.changeText(getByLabelText('Telefone'),        '11999990001');
    fireEvent.changeText(getByLabelText('Senha'),           'senha1234');
    fireEvent.changeText(getByLabelText('Confirmar senha'), 'senha1234');
    fireEvent.press(getByText('Criar conta'));
    // Antes: toHaveBeenCalledWith('Atenção', <mensagem exata>). Agora as MESMAS
    // duas strings são conferidas, só que lidas do diálogo renderizado.
    await waitFor(() => expect(getByTestId('kdialog-titulo').props.children).toBe('Atenção'));
    expect(getByTestId('kdialog-mensagem').props.children).toBe(
      'Uma nova versão do aplicativo é necessária para concluir o cadastro. Atualize o app na loja e tente novamente.'
    );
  });

  it('mantém a mensagem genérica para outro 422 REGRA_DE_NEGOCIO sem relação com versão de termo', async () => {
    // Mesmo status/code do caso acima (RegraDeNegocioException também cobre "tutor sem
    // aviso de privacidade" — OnboardingService.registrarPorInvite passo 6), mas
    // mensagem diferente. Prova que a distinção é pelo texto, não só status+code.
    (register as jest.Mock).mockRejectedValueOnce({
      status: 422,
      code: 'REGRA_DE_NEGOCIO',
      message: 'Tutor não recebeu o aviso de privacidade. Entre em contato com a clínica.',
    });
    const { getByLabelText, getByText, getByTestId } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.changeText(getByLabelText('Seu nome'),        'Guilherme Sola');
    fireEvent.changeText(getByLabelText('E-mail'),          'gui@kura.com');
    fireEvent.changeText(getByLabelText('Telefone'),        '11999990001');
    fireEvent.changeText(getByLabelText('Senha'),           'senha1234');
    fireEvent.changeText(getByLabelText('Confirmar senha'), 'senha1234');
    fireEvent.press(getByText('Criar conta'));
    // Antes: toHaveBeenCalledWith('Atenção', 'Erro ao criar conta. Tente
    // novamente.'). Agora as MESMAS duas strings, lidas do diálogo renderizado.
    await waitFor(() => expect(getByTestId('kdialog-titulo').props.children).toBe('Atenção'));
    expect(getByTestId('kdialog-mensagem').props.children).toBe('Erro ao criar conta. Tente novamente.');
  });

  it('renders LGPD footer', () => {
    const { getByText } = render(<RegisterScreen />, { wrapper: W });
    expect(getByText(/DADOS CIFRADOS/)).toBeTruthy();
  });
});

// TASK-F02 (rodada de fix 1): esta é a mordida real da migração — não do
// hook isolado (já coberto em useVoltar.test.tsx), mas do call site de
// register.tsx:97 de fato. register.tsx é o caso canônico do brief: é o
// destino do deep link de convite (_layout.tsx), então "sem histórico" não
// é um cenário hipotético aqui, é o caminho de entrada mais comum da tela.
describe('RegisterScreen — botão Voltar (TASK-F02)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack.mockReset();
  });

  it('com histórico (canGoBack=true): back() puro, replace NUNCA chamado — comportamento preservado', () => {
    mockCanGoBack.mockReturnValue(true);
    const { getByLabelText } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.press(getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('sem histórico (canGoBack=false, caso canônico de deep link): replace("/login"), back() NUNCA chamado', () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByLabelText } = render(<RegisterScreen />, { wrapper: W });
    fireEvent.press(getByLabelText('Voltar'));
    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
