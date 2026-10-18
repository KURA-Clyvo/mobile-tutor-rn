// S4-LOJA-05 — a vitrine da Loja nos 4 estados, com o aviso de pré-lançamento (D-S4-6) e o selo "Exemplo" (D-LOJA-10).
// O texto do aviso é escrito AQUI, literal, de propósito: o teste não importa a constante do app para não validar a constante
// contra ela mesma (se alguém editar a constante e o mock juntos, este arquivo reprova).
import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import LojaScreen from '../app/(tabs)/loja/index';
import { AVISO_LOJA_PRE_LANCAMENTO } from '../types/loja';
import { catalogo as catalogoMock } from '../mocks/loja.mock';
import { KChip } from '../components/primitives/KChip';

const AVISO_LITERAL =
  'Pré-lançamento: pagamento e entrega serão ativados quando os parceiros logísticos concluírem a integração. Nenhuma cobrança é feita.';

let mockCatalogo: any;
jest.mock('../hooks/useCatalogo', () => ({ useCatalogo: () => mockCatalogo }));

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;
const CINCO_MIN = Date.now() - 5 * 60_000;

const base = { isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 0 };
// mock inteiro de um `useQuery` com os campos coerentes por estado (mesmo padrão de TelasDadoEstados.test.tsx)
const rq = (e: Record<string, unknown> = {}) => {
  const q: any = { ...base, ...e };
  const erro = q.isError ? new Error('503') : null;
  return {
    ...q,
    status: q.isError ? 'error' : q.isLoading ? 'pending' : 'success',
    isFetched: !q.isLoading,
    isFetching: q.fetchStatus === 'fetching',
    isRefetchError: !!q.isError && q.data !== undefined,
    error: erro,
    failureReason: erro,
  };
};

let DADO: any;
let AVISO_DA_API: string;
beforeAll(async () => {
  DADO = await catalogoMock({});
  AVISO_DA_API = DADO.aviso;
});

const VAZIO = () => ({ aviso: AVISO_LITERAL, content: [], page: 0, size: 20, hasNext: false });
const FRASE_VAZIO = /Ainda não há produtos de exemplo/;
const TITULO_ERRO = /Não foi possível carregar a loja/;

describe('Loja — constante e mock carregam o aviso literal (D-S4-6)', () => {
  it('a constante do app é idêntica ao literal escrito neste teste', () => {
    expect(AVISO_LOJA_PRE_LANCAMENTO).toBe(AVISO_LITERAL);
  });
  it('o aviso do mock (shape cru da API) é idêntico ao literal', () => {
    expect(AVISO_DA_API).toBe(AVISO_LITERAL);
  });
});

describe('Loja — os 4 estados, com o aviso visível nos 4', () => {
  it('carregando => skeleton em grade + aviso (constante) + chips; sem ErrorState, sem frase de vazio, sem selo', () => {
    mockCatalogo = rq({ data: undefined, isLoading: true, fetchStatus: 'fetching' });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(within(r.getByTestId('loja-aviso')).getByText(AVISO_LITERAL)).toBeTruthy();
    expect(r.getByTestId('loja-chips')).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.queryByText(FRASE_VAZIO)).toBeNull();
    expect(r.queryByText('Exemplo')).toBeNull();
  });

  it('erro SEM dado => ErrorState + "Tentar de novo" + aviso (constante); NENHUMA frase de vazio e nenhum produto', () => {
    const refetch = jest.fn();
    mockCatalogo = rq({ data: undefined, isError: true, refetch });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(r.getByTestId('error-state')).toBeTruthy();
    expect(r.getByText(TITULO_ERRO)).toBeTruthy();
    expect(r.getByText('Tentar de novo')).toBeTruthy();
    expect(within(r.getByTestId('loja-aviso')).getByText(AVISO_LITERAL)).toBeTruthy();
    expect(r.queryByText(FRASE_VAZIO)).toBeNull();
    expect(r.queryByTestId('loja-grade')).toBeNull();
    expect(r.queryByText('Exemplo')).toBeNull();
    fireEvent.press(r.getByTestId('error-state-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('erro COM dado salvo => grade + faixa "Mostrando dados salvos" + aviso + selo; sem ErrorState', () => {
    mockCatalogo = rq({ data: DADO, isError: true, dataUpdatedAt: CINCO_MIN });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.getByText(/Mostrando dados salvos, atualizados há 5min/)).toBeTruthy();
    expect(r.getByTestId('loja-grade')).toBeTruthy();
    expect(within(r.getByTestId('loja-aviso')).getByText(AVISO_LITERAL)).toBeTruthy();
    expect(r.getAllByText('Exemplo')).toHaveLength(DADO.content.length);
    expect(r.queryByTestId('error-state')).toBeNull();
  });

  it('vazio verdadeiro => frase de vazio + aviso (o que a API mandou); sem ErrorState e sem faixa', () => {
    mockCatalogo = rq({ data: VAZIO() });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(r.getByText(FRASE_VAZIO)).toBeTruthy();
    expect(within(r.getByTestId('loja-aviso')).getByText(AVISO_LITERAL)).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.queryByTestId('query-state-salvos')).toBeNull();
  });

  it('sucesso => um card por produto, cada um com selo "Exemplo", "Preço de referência" e ação "Em breve"; aviso no topo', () => {
    mockCatalogo = rq({ data: DADO });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(within(r.getByTestId('loja-aviso')).getByText(AVISO_LITERAL)).toBeTruthy();
    for (const item of DADO.content) {
      const card = within(r.getByTestId(`loja-card-${item.slug}`));
      expect(card.getByText('Exemplo')).toBeTruthy();
      expect(card.getByText('Preço de referência')).toBeTruthy();
      expect(card.getByText('Em breve')).toBeTruthy();
      expect(card.getByText(item.nome)).toBeTruthy();
    }
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(r.queryByTestId('query-state-salvos')).toBeNull();
  });

  it('o aviso mostrado é o que a API mandou quando há resposta (não a constante local)', () => {
    mockCatalogo = rq({ data: { ...DADO, aviso: 'Texto vindo da API para este teste.' } });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(within(r.getByTestId('loja-aviso')).getByText('Texto vindo da API para este teste.')).toBeTruthy();
    expect(r.queryByText(AVISO_LITERAL)).toBeNull();
  });
});

// ÂNCORA (regra 11): nomes dos 10 itens do seed real — backend-tutor-java@98fb53e, src/main/resources/mongo/catalogo_loja.seed.json
// (campo "nome" das 10 linhas), conferido em 2026-10-17. Reproduz:
//   git -C D:/FIAP/KURA/backend-tutor-java show 98fb53e:src/main/resources/mongo/catalogo_loja.seed.json | grep '"nome"'
// Escritos AQUI, literais, de propósito (o mock do app poderia mudar junto com o componente).
const NOMES_DO_SEED = [
  'Alimento seco para cães adultos 1 kg',
  'Alimento úmido para gatos adultos 85 g',
  'Petisco macio para filhotes 100 g',
  'Shampoo neutro 500 ml',
  'Escova de cerdas macias',
  'Tapete higiênico 30 unidades',
  'Coleira ajustável tamanho M',
  'Comedouro de inox tamanho P',
  'Bolinha de borracha tamanho M',
  'Mordedor de corda tamanho G',
];

describe('Loja — nome do produto sem corte (G2 I-1)', () => {
  it('os 10 nomes do seed real aparecem por inteiro e nenhum Text de nome limita as linhas', () => {
    const itens = NOMES_DO_SEED.map((nome, i) => ({ ...DADO.content[0], slug: `seed-${i}`, nome }));
    mockCatalogo = rq({ data: { ...DADO, content: itens } });
    const r = render(<LojaScreen />, { wrapper: W });
    for (const [i, nome] of NOMES_DO_SEED.entries()) {
      const no = within(r.getByTestId(`loja-card-seed-${i}`)).getByText(nome);
      expect(no.props.children).toBe(nome);
      // sem `numberOfLines` (ou 0 = sem limite): a quantidade ("1 kg", "85 g", "M") não pode ser cortada
      expect(no.props.numberOfLines === undefined || no.props.numberOfLines === 0).toBe(true);
    }
  });
});

describe('Loja — preço, ação e selo', () => {
  it('preço em centavos vira BRL: 4990 => "R$ 49,90", 690 => "R$ 6,90"', () => {
    mockCatalogo = rq({ data: DADO });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(within(r.getByTestId('loja-card-alimento-seco-adulto-caes-1kg')).getByText('R$ 49,90')).toBeTruthy();
    expect(within(r.getByTestId('loja-card-alimento-umido-gatos-adultos-85g')).getByText('R$ 6,90')).toBeTruthy();
  });

  it('a ação "Em breve" está desabilitada, não dispara nada e explica o motivo no hint', () => {
    mockCatalogo = rq({ data: DADO });
    const r = render(<LojaScreen />, { wrapper: W });
    const acao = r.getByTestId('loja-em-breve-coleira-ajustavel-m');
    expect(acao.props.accessibilityState.disabled).toBe(true);
    expect(acao.props.accessibilityHint).toBe('Pagamento e entrega ainda não estão ativos');
  });

  it('item que a API NÃO marca como exemplo não ganha o selo (o selo reflete o dado, não é decoração)', () => {
    const item = { ...DADO.content[0], slug: 'real', exemplo: false };
    mockCatalogo = rq({ data: { ...DADO, content: [item] } });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(within(r.getByTestId('loja-card-real')).queryByText('Exemplo')).toBeNull();
  });

  it('o selo "Exemplo" é um KChip (tone mute), um por produto de demonstração — não texto solto (G2 m-g)', () => {
    mockCatalogo = rq({ data: DADO });
    const r = render(<LojaScreen />, { wrapper: W });
    const chips = r.UNSAFE_getAllByType(KChip).filter(c => c.props.children === 'Exemplo');
    expect(chips).toHaveLength(DADO.content.length);
    for (const c of chips) expect(c.props.tone).toBe('mute');
    for (const item of DADO.content) {
      const card = r.getByTestId(`loja-card-${item.slug}`);
      expect(within(card).UNSAFE_getAllByType(KChip).some((c: any) => c.props.children === 'Exemplo')).toBe(true);
    }
  });
});

describe('Loja — filtro por categoria', () => {
  it('"Tudo" começa selecionado e os chips têm accessibilityState.selected', () => {
    mockCatalogo = rq({ data: DADO });
    const r = render(<LojaScreen />, { wrapper: W });
    expect(r.getByTestId('loja-chip-tudo').props.accessibilityState.selected).toBe(true);
    expect(r.getByTestId('loja-chip-HIGIENE').props.accessibilityState.selected).toBe(false);
  });

  it('tocar em "Higiene" mostra só os itens dela, na ordem da API, e o aviso continua lá', () => {
    mockCatalogo = rq({ data: DADO });
    const r = render(<LojaScreen />, { wrapper: W });
    fireEvent.press(r.getByTestId('loja-chip-HIGIENE'));
    expect(r.getByTestId('loja-chip-HIGIENE').props.accessibilityState.selected).toBe(true);
    expect(r.getByTestId('loja-chip-tudo').props.accessibilityState.selected).toBe(false);
    const esperados = DADO.content.filter((i: any) => i.categoria === 'HIGIENE').map((i: any) => i.slug);
    const grade = r.getByTestId('loja-grade');
    const mostrados = within(grade).queryAllByTestId(/^loja-card-/).map(n => String(n.props.testID).replace('loja-card-', ''));
    expect(mostrados).toEqual(esperados);
    expect(esperados.length).toBeGreaterThan(0);
    expect(within(r.getByTestId('loja-aviso')).getByText(AVISO_LITERAL)).toBeTruthy();
  });

  it('categoria sem item => frase com a categoria + "Ver todos os produtos", que limpa o filtro', () => {
    const soAlimentacao = { ...DADO, content: DADO.content.filter((i: any) => i.categoria === 'ALIMENTACAO') };
    mockCatalogo = rq({ data: soAlimentacao });
    const r = render(<LojaScreen />, { wrapper: W });
    fireEvent.press(r.getByTestId('loja-chip-BRINQUEDOS'));
    expect(r.getByText('Nenhum produto de exemplo em Brinquedos.')).toBeTruthy();
    fireEvent.press(r.getByText('Ver todos os produtos'));
    expect(r.getByTestId('loja-grade')).toBeTruthy();
    expect(r.getByTestId('loja-chip-tudo').props.accessibilityState.selected).toBe(true);
  });
});

describe('Loja — alvos de toque >= 44 (provado por estilo renderizado, não por leitura)', () => {
  const minHeight = (el: any) => (StyleSheet.flatten(el.props.style) as any).minHeight as number;

  it('cada chip (Tudo + 4 categorias) tem minHeight >= 44', () => {
    mockCatalogo = rq({ data: DADO });
    const r = render(<LojaScreen />, { wrapper: W });
    const ids = ['loja-chip-tudo', 'loja-chip-ALIMENTACAO', 'loja-chip-HIGIENE', 'loja-chip-ACESSORIOS', 'loja-chip-BRINQUEDOS'];
    for (const id of ids) expect(minHeight(r.getByTestId(id))).toBeGreaterThanOrEqual(44);
  });

  it('a ação "Em breve" de todo card tem minHeight >= 44', () => {
    mockCatalogo = rq({ data: DADO });
    const r = render(<LojaScreen />, { wrapper: W });
    for (const item of DADO.content) expect(minHeight(r.getByTestId(`loja-em-breve-${item.slug}`))).toBeGreaterThanOrEqual(44);
  });
});
