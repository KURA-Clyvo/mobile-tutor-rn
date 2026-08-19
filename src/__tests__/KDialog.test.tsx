import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Modal } from 'react-native';
import { ThemeProvider } from '../theme/index';
import { KDialog, KDialogProvider, useDialog, type KDialogApi } from '../components/primitives/KDialog';
import { lightColors, darkColors } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';

// Captura a API imperativa para poder chamá-la de fora, como um handler de tela faria.
let api: KDialogApi;
function Captor() {
  api = useDialog();
  return null;
}

function montar() {
  return render(
    <ThemeProvider>
      <KDialogProvider>
        <Captor />
      </KDialogProvider>
    </ThemeProvider>,
  );
}

function achatar(style: unknown): Record<string, unknown> {
  const arr = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...arr.filter(Boolean)) as Record<string, unknown>;
}

beforeEach(() => {
  useAuthStore.getState().setThemeOverride('light');
});

describe('KDialog — padrão 1: aviso simples (título + texto + OK)', () => {
  it('mostra título, mensagem e um botão OK, e resolve ao tocar', async () => {
    const tela = montar();
    let resolvida = false;
    let p!: Promise<void>;
    act(() => {
      p = api.alerta('Atenção', 'Digite o nome do pet.').then(() => { resolvida = true; });
    });

    expect(tela.getByText('Atenção')).toBeTruthy();
    expect(tela.getByText('Digite o nome do pet.')).toBeTruthy();
    expect(resolvida).toBe(false);

    fireEvent.press(tela.getByTestId('kdialog-acao-OK'));
    await act(async () => { await p; });
    expect(resolvida).toBe(true);
    expect(tela.queryByTestId('kdialog-card')).toBeNull();
  });

  it('sem mensagem, não renderiza o parágrafo (pets/novo.tsx:40 chama com texto vazio)', () => {
    const tela = montar();
    act(() => { void api.mostrar({ titulo: 'Permissão negada' }); });
    expect(tela.getByText('Permissão negada')).toBeTruthy();
    expect(tela.queryByTestId('kdialog-mensagem')).toBeNull();
  });
});

describe('KDialog — padrão 2: confirmação destrutiva', () => {
  it('devolve true na confirmação e marca o botão como destrutivo', async () => {
    const tela = montar();
    let r!: Promise<boolean>;
    act(() => {
      r = api.confirmar({
        titulo: 'Revogar consentimento?',
        mensagem: 'Você deixará de receber lembretes.',
        confirmar: 'Revogar',
        destrutivo: true,
      });
    });

    const botao = tela.getByTestId('kdialog-acao-__confirmar__');
    expect(botao.props.accessibilityHint).toBe('Ação destrutiva. Não pode ser desfeita.');
    expect(achatar(botao.props.style).backgroundColor).toBe(lightColors.danger);

    fireEvent.press(botao);
    await act(async () => { await expect(r).resolves.toBe(true); });
  });

  it('devolve false ao cancelar', async () => {
    const tela = montar();
    let r!: Promise<boolean>;
    act(() => { r = api.confirmar({ titulo: 'Sair da conta?', destrutivo: true }); });
    fireEvent.press(tela.getByTestId('kdialog-acao-__cancelar__'));
    await act(async () => { await expect(r).resolves.toBe(false); });
  });

  it('o botão de cancelar NÃO é anunciado como destrutivo', () => {
    const tela = montar();
    act(() => { void api.confirmar({ titulo: 'Cancelar agendamento?', destrutivo: true }); });
    expect(tela.getByTestId('kdialog-acao-__cancelar__').props.accessibilityHint).toBeUndefined();
  });
});

describe('KDialog — padrão 3: callback no OK roda DEPOIS do fechamento', () => {
  it('no instante em que a promise resolve, o diálogo já saiu da árvore', async () => {
    const tela = montar();
    // Sentinela: o que a tela veria no exato momento em que chamaria router.back().
    let cardNoMomentoDaResolucao: unknown = '__nunca-executou__';
    let voltouCom: string | null = null;
    let p!: Promise<void>;

    act(() => {
      p = api.alerta('Solicite à sua clínica', 'Peça à clínica para cadastrar Bolinha.').then(() => {
        cardNoMomentoDaResolucao = tela.queryByTestId('kdialog-card');
        voltouCom = 'voltar()';
      });
    });

    expect(tela.getByTestId('kdialog-card')).toBeTruthy();

    // 🔴 Prova de mordida — o toque é disparado FORA de `act` de propósito.
    // `fireEvent.press` embrulha o toque em `act`, que faz o commit acontecer
    // antes de qualquer microtask; com isso uma resolução síncrona ficaria
    // indistinguível da correta (medido: a mutação passava). Chamando o
    // `onPress` cru, o commit ainda não aconteceu quando o handler retorna:
    // se `resolver()` fosse chamado ali, o `.then` rodaria com o cartão ainda
    // montado e esta asserção falharia.
    const onPressCru = tela
      .UNSAFE_getAllByProps({ testID: 'kdialog-acao-OK' })
      .map(n => n.props.onPress)
      .find((fn: unknown): fn is () => void => typeof fn === 'function');
    onPressCru!();
    // Flush do commit + efeitos passivos; só depois disso a promise pode resolver.
    await act(async () => {});
    await p;

    expect(voltouCom).toBe('voltar()');
    expect(cardNoMomentoDaResolucao).toBeNull();
  });
});

describe('KDialog — padrão 4: action sheet de 3 opções', () => {
  const acoes = [
    { label: 'Câmera',   value: 'camera' },
    { label: 'Galeria',  value: 'galeria' },
    { label: 'Cancelar', value: 'cancelar', style: 'cancel' as const },
  ];

  it('renderiza as 3 opções e devolve a escolhida', async () => {
    const tela = montar();
    let r!: Promise<string | null>;
    act(() => { r = api.mostrar({ titulo: 'Foto do pet', mensagem: 'Como deseja adicionar a foto?', acoes }); });

    expect(tela.getByText('Câmera')).toBeTruthy();
    expect(tela.getByText('Galeria')).toBeTruthy();
    expect(tela.getByText('Cancelar')).toBeTruthy();

    fireEvent.press(tela.getByTestId('kdialog-acao-camera'));
    await act(async () => { await expect(r).resolves.toBe('camera'); });
  });

  it('com 2 opções não-canceláveis, nenhuma rouba a ênfase primária', () => {
    const tela = montar();
    act(() => { void api.mostrar({ titulo: 'Foto do pet', acoes }); });
    const camera  = achatar(tela.getByTestId('kdialog-acao-camera').props.style);
    const galeria = achatar(tela.getByTestId('kdialog-acao-galeria').props.style);
    expect(camera.backgroundColor).not.toBe(lightColors.primary);
    expect(galeria.backgroundColor).not.toBe(lightColors.primary);
  });

  it('o botão de voltar do Android (onRequestClose) devolve o valor de cancelar', async () => {
    const tela = montar();
    let r!: Promise<string | null>;
    act(() => { r = api.mostrar({ titulo: 'Foto do pet', acoes }); });
    const modal = tela.UNSAFE_getByType(Modal);
    act(() => { modal.props.onRequestClose(); });
    await act(async () => { await expect(r).resolves.toBe('cancelar'); });
    expect(tela.queryByTestId('kdialog-card')).toBeNull();
  });

  it('sem ação de cancelar, dispensar devolve null', async () => {
    const tela = montar();
    let r!: Promise<string | null>;
    act(() => { r = api.mostrar({ titulo: 'Permissão negada', acoes: [{ label: 'Abrir configurações', value: 'abrir' }] }); });
    act(() => { tela.UNSAFE_getByType(Modal).props.onRequestClose(); });
    await act(async () => { await expect(r).resolves.toBeNull(); });
  });
});

describe('KDialog — padrão 5: diálogo aninhado no callback de outro', () => {
  it('o segundo diálogo abre depois de o primeiro fechar e resolve sozinho', async () => {
    const tela = montar();
    const abriuConfiguracoes = jest.fn();

    // Este é literalmente o fluxo de pets/novo.tsx:35 → :40.
    let fluxo!: Promise<void>;
    act(() => {
      fluxo = (async () => {
        const escolha = await api.mostrar({
          titulo: 'Foto do pet',
          mensagem: 'Como deseja adicionar a foto?',
          acoes: [
            { label: 'Câmera',   value: 'camera' },
            { label: 'Galeria',  value: 'galeria' },
            { label: 'Cancelar', value: 'cancelar', style: 'cancel' },
          ],
        });
        if (escolha !== 'camera') return;
        const acao = await api.mostrar({
          titulo: 'Permissão negada',
          acoes: [
            { label: 'Agora não',           value: 'nao', style: 'cancel' },
            { label: 'Abrir configurações', value: 'abrir' },
          ],
        });
        if (acao === 'abrir') abriuConfiguracoes();
      })();
    });

    fireEvent.press(tela.getByTestId('kdialog-acao-camera'));
    await waitFor(() => expect(tela.getByText('Permissão negada')).toBeTruthy());
    expect(tela.queryByText('Galeria')).toBeNull();

    fireEvent.press(tela.getByTestId('kdialog-acao-abrir'));
    await act(async () => { await fluxo; });

    expect(abriuConfiguracoes).toHaveBeenCalledTimes(1);
    expect(tela.queryByTestId('kdialog-card')).toBeNull();
  });
});

describe('KDialog — tema claro e escuro', () => {
  it('usa surface/danger do tema claro', () => {
    useAuthStore.getState().setThemeOverride('light');
    const tela = montar();
    act(() => { void api.confirmar({ titulo: 'Sair?', destrutivo: true }); });
    expect(achatar(tela.getByTestId('kdialog-card').props.style).backgroundColor).toBe(lightColors.surface);
    expect(achatar(tela.getByTestId('kdialog-acao-__confirmar__').props.style).backgroundColor).toBe(lightColors.danger);
  });

  it('usa surface/danger do tema escuro', () => {
    useAuthStore.getState().setThemeOverride('dark');
    const tela = montar();
    act(() => { void api.confirmar({ titulo: 'Sair?', destrutivo: true }); });
    expect(achatar(tela.getByTestId('kdialog-card').props.style).backgroundColor).toBe(darkColors.surface);
    expect(achatar(tela.getByTestId('kdialog-acao-__confirmar__').props.style).backgroundColor).toBe(darkColors.danger);
    expect(darkColors.surface).not.toBe(lightColors.surface);
  });

  it('o overlay escurece mais no tema escuro', () => {
    act(() => { useAuthStore.getState().setThemeOverride('light'); });
    const claro = montar();
    act(() => { void api.alerta('X'); });
    const bgClaro = achatar(claro.getByTestId('kdialog-overlay').props.style).backgroundColor;

    act(() => { useAuthStore.getState().setThemeOverride('dark'); });
    const escuro = montar();
    act(() => { void api.alerta('X'); });
    const bgEscuro = achatar(escuro.getByTestId('kdialog-overlay').props.style).backgroundColor;

    expect(bgClaro).not.toBe(bgEscuro);
  });
});

describe('KDialog — acessibilidade', () => {
  it('o cartão é papel alert, modal e rotulado pelo título', () => {
    const tela = montar();
    act(() => { void api.alerta('Atenção', 'Selecione a espécie.'); });
    const card = tela.getByTestId('kdialog-card');
    expect(card.props.accessibilityRole).toBe('alert');
    expect(card.props.accessibilityViewIsModal).toBe(true);
    expect(card.props.accessibilityLabel).toBe('Atenção');
  });

  it('todo botão tem papel button e alvo de toque >= 44pt', () => {
    const tela = montar();
    act(() => {
      void api.mostrar({
        titulo: 'Foto do pet',
        acoes: [
          { label: 'Câmera',   value: 'camera' },
          { label: 'Galeria',  value: 'galeria' },
          { label: 'Cancelar', value: 'cancelar', style: 'cancel' },
        ],
      });
    });
    ['camera', 'galeria', 'cancelar'].forEach(v => {
      const b = tela.getByTestId(`kdialog-acao-${v}`);
      expect(b.props.accessibilityRole).toBe('button');
      expect(achatar(b.props.style).minHeight as number).toBeGreaterThanOrEqual(44);
    });
  });

  it('useDialog fora do provider falha alto em vez de virar no-op silencioso', () => {
    const Solto = () => { useDialog(); return null; };
    const erro = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeProvider><Solto /></ThemeProvider>)).toThrow(/KDialogProvider/);
    erro.mockRestore();
  });
});

// TASK-F06 (fecha M1 e M3 da revisão G2 da F05): duas props do <Modal> e a
// camada de apresentação standalone estavam corretas mas SEM teste versionado —
// o revisor as verificou com teste temporário, que ele apagou. Prop declarada
// sem teste é prop que some num refactor sem ninguém notar.
describe('KDialog — props do Modal e camada standalone (M1/M3 da F05)', () => {
  it('o Modal declara statusBarTranslucent, accessibilityViewIsModal e onRequestClose', () => {
    const tela = montar();
    act(() => { void api.alerta('Atenção', 'Mensagem.'); });
    const modal = tela.UNSAFE_getByType(Modal);
    expect(modal.props.statusBarTranslucent).toBe(true);
    expect(modal.props.accessibilityViewIsModal).toBe(true);
    expect(typeof modal.props.onRequestClose).toBe('function');
  });

  it('o KDialog de apresentação renderiza sozinho, sem provider, e devolve o valor da ação', () => {
    const onFechar = jest.fn();
    const tela = render(
      <ThemeProvider>
        <KDialog
          visivel
          opcoes={{ titulo: 'Permissão negada', acoes: [{ label: 'Abrir configurações', value: 'abrir' }] }}
          onFechar={onFechar}
        />
      </ThemeProvider>,
    );
    expect(tela.getByText('Permissão negada')).toBeTruthy();
    // Sem mensagem, o parágrafo não é renderizado (forma degenerada de pets/novo.tsx).
    expect(tela.queryByTestId('kdialog-mensagem')).toBeNull();
    fireEvent.press(tela.getByTestId('kdialog-acao-abrir'));
    expect(onFechar).toHaveBeenCalledWith('abrir');
  });
});
