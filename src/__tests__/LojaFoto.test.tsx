// NX-04 — foto do produto no card da Loja. O texto do `alt` e o caminho são escritos AQUI, literais, de propósito (o teste não
// importa a constante do mock para não validar o mock contra ele mesmo).
import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { ProdutoCard } from '../components/loja/ProdutoCard';
import { urlImagemLoja } from '../utils/loja';
import type { ItemCatalogoRaw } from '../types/loja';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

const ALT = 'Foto ilustrativa: frasco de shampoo';
const COM_FOTO: ItemCatalogoRaw = {
  slug: 'shampoo-neutro-500ml', nome: 'Shampoo neutro 500 ml', categoria: 'HIGIENE', preco: 2990, moeda: 'BRL', exemplo: true,
  dados: { tipoHigiene: 'SHAMPOO' },
  imagem: { url: '/api/loja/imagens/shampoo-neutro-500ml.webp', urlThumb: '/api/loja/imagens/shampoo-neutro-500ml_256.webp', alt: ALT },
};
const SEM_FOTO: ItemCatalogoRaw = { ...COM_FOTO, slug: 'sem-foto-teste', imagem: undefined };

const ORIGINAL_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
beforeEach(() => { process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8081'; });
afterAll(() => { process.env.EXPO_PUBLIC_API_BASE_URL = ORIGINAL_BASE; });

describe('ProdutoCard — foto do produto (NX-04)', () => {
  it('com imagem: renderiza a foto (thumb com a base da API) com o alt como accessibilityLabel, e não o placeholder', () => {
    const r = render(<ProdutoCard item={COM_FOTO} />, { wrapper: W });
    const foto = r.getByTestId('loja-foto-shampoo-neutro-500ml');
    expect(foto.props.accessibilityLabel).toBe(ALT);
    expect(foto.props.source[0].uri).toBe('http://localhost:8081/api/loja/imagens/shampoo-neutro-500ml_256.webp');
    expect(r.queryByTestId('loja-arte-HIGIENE', { includeHiddenElements: true })).toBeNull();
  });

  it('erro de carga da foto => cai no placeholder da categoria', () => {
    const r = render(<ProdutoCard item={COM_FOTO} />, { wrapper: W });
    fireEvent(r.getByTestId('loja-foto-shampoo-neutro-500ml'), 'error', { nativeEvent: { error: '404' } } as never);
    expect(r.queryByTestId('loja-foto-shampoo-neutro-500ml')).toBeNull();
    expect(r.getByTestId('loja-arte-HIGIENE', { includeHiddenElements: true })).toBeTruthy();
  });

  it('sem imagem => placeholder, nenhuma foto', () => {
    const r = render(<ProdutoCard item={SEM_FOTO} />, { wrapper: W });
    expect(r.queryByTestId('loja-foto-sem-foto-teste')).toBeNull();
    expect(r.getByTestId('loja-arte-HIGIENE', { includeHiddenElements: true })).toBeTruthy();
  });

  it('a foto tem a mesma altura do placeholder (o card não pula se a foto falhar)', () => {
    const r = render(<ProdutoCard item={COM_FOTO} />, { wrapper: W });
    const estilo = StyleSheet.flatten(r.getByTestId('loja-foto-shampoo-neutro-500ml').props.style);
    expect(estilo.height).toBe(104);
  });

  it('os gates do card seguem: selo "Exemplo", preço de referência, "Em breve" desabilitado e nome SEM numberOfLines', () => {
    const r = render(<ProdutoCard item={COM_FOTO} />, { wrapper: W });
    expect(r.getByText('Exemplo')).toBeTruthy();
    expect(r.getByText('Preço de referência')).toBeTruthy();
    expect(r.getByText('Em breve')).toBeTruthy();
    expect(r.getByText('Shampoo neutro 500 ml').props.numberOfLines).toBeUndefined();
  });
});

describe('urlImagemLoja', () => {
  it('junta base e caminho sem barra dupla; base com barra final e caminho sem barra inicial', () => {
    expect(urlImagemLoja('/api/loja/imagens/a.webp', 'http://h:8081')).toBe('http://h:8081/api/loja/imagens/a.webp');
    expect(urlImagemLoja('/api/loja/imagens/a.webp', 'https://x.trycloudflare.com/tutor/')).toBe('https://x.trycloudflare.com/tutor/api/loja/imagens/a.webp');
    expect(urlImagemLoja('api/loja/imagens/a.webp', 'http://h')).toBe('http://h/api/loja/imagens/a.webp');
  });
  it('sem base devolve o caminho cru (a carga falha e o card usa o placeholder)', () => {
    expect(urlImagemLoja('/api/loja/imagens/a.webp', '')).toBe('/api/loja/imagens/a.webp');
  });
});
