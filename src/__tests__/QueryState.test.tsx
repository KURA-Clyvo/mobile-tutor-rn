// BR-TUT-T03 — kit de estados copiado da clínica (QueryState / ErrorState / Skeleton / formatRelativeTime).
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { QueryState, TEXTO_DADOS_SALVOS, type QueryLike } from '../components/feedback/QueryState';
import { formatRelativeTime } from '../utils/date';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;
const q = (p: Partial<QueryLike<string[]>>): QueryLike<string[]> => ({
  data: undefined, isLoading: false, isError: false, refetch: jest.fn(), ...p,
});
const ui = (query: QueryLike<string[]>) => (
  <QueryState query={query} empty={<Text>Nada por aqui</Text>}>
    {(d) => <Text>{`itens: ${d.join(',')}`}</Text>}
  </QueryState>
);

describe('QueryState', () => {
  it('isLoading vence tudo: skeleton, nem vazio nem conteúdo', () => {
    const r = render(ui(q({ isLoading: true, data: [] })), { wrapper: W });
    expect(r.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(r.queryByText('Nada por aqui')).toBeNull();
  });
  it('isError sem dado => ErrorState; "Tentar de novo" chama refetch', () => {
    const refetch = jest.fn();
    const r = render(ui(q({ isError: true, refetch })), { wrapper: W });
    expect(r.getByTestId('error-state')).toBeTruthy();
    expect(r.queryByText('Nada por aqui')).toBeNull();
    fireEvent.press(r.getByTestId('error-state-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
  it('isError COM dado => conteúdo + faixa, sem ErrorState e SEM opacity no conteúdo (V2-I1)', () => {
    const r = render(ui(q({ isError: true, data: ['a', 'b'] })), { wrapper: W });
    expect(r.getByText('itens: a,b')).toBeTruthy();
    expect(r.getByTestId('query-state-salvos')).toBeTruthy();
    expect(r.getByText(new RegExp(`^${TEXTO_DADOS_SALVOS}`))).toBeTruthy();
    expect(r.queryByTestId('error-state')).toBeNull();
    expect(JSON.stringify(r.toJSON())).not.toContain('"opacity"');
  });
  it('sucesso vazio => o `empty` fornecido; sucesso com dado => conteúdo sem faixa', () => {
    const vazio = render(ui(q({ data: [] })), { wrapper: W });
    expect(vazio.getByText('Nada por aqui')).toBeTruthy();
    expect(vazio.queryByTestId('query-state-salvos')).toBeNull();
    const cheio = render(ui(q({ data: ['x'] })), { wrapper: W });
    expect(cheio.getByText('itens: x')).toBeTruthy();
  });
  it('query desabilitada (idle, sem dado, sem erro) não desenha skeleton eterno nem "vazio"', () => {
    const r = render(ui(q({ fetchStatus: 'idle' })), { wrapper: W });
    expect(r.queryByTestId('skeleton')).toBeNull();
    expect(r.queryByText('Nada por aqui')).toBeNull();
  });
  it('a faixa diz há quanto tempo o dado foi atualizado quando há dataUpdatedAt', () => {
    const r = render(ui(q({ isError: true, data: ['a'], dataUpdatedAt: Date.now() - 3 * 3_600_000 })), { wrapper: W });
    expect(r.getByText(/atualizados há 3h/)).toBeTruthy();
  });
  it('alvo de toque: o botão da faixa e o do erro têm minHeight >= 44', () => {
    const faixa = render(ui(q({ isError: true, data: ['a'] })), { wrapper: W });
    const flat = (n: any) => Object.assign({}, ...[].concat(n.props.style).flat(3).filter(Boolean));
    expect(flat(faixa.getByTestId('query-state-salvos-retry')).minHeight).toBeGreaterThanOrEqual(44);
    const erro = render(ui(q({ isError: true })), { wrapper: W });
    expect(flat(erro.getByTestId('error-state-retry')).minHeight).toBeGreaterThanOrEqual(44);
  });
});

describe('formatRelativeTime (copiada da clínica)', () => {
  const now = new Date('2026-10-15T12:00:00Z');
  it('aceita Date e string ISO (cache persistido devolve string)', () => {
    expect(formatRelativeTime(new Date('2026-10-15T11:55:00Z'), now)).toBe('há 5min');
    expect(formatRelativeTime('2026-10-15T11:55:00Z', now)).toBe('há 5min');
    expect(formatRelativeTime('2026-10-15T09:00:00Z', now)).toBe('há 3h');
    expect(formatRelativeTime('2026-10-12T12:00:00Z', now)).toBe('há 3d');
  });
  it('futuro e inválido não lançam', () => {
    expect(formatRelativeTime('2026-10-15T12:05:00Z', now)).toBe('agora');
    expect(formatRelativeTime('lixo', now)).toBe('');
  });
});
