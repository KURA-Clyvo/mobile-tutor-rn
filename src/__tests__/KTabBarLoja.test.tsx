// S4-LOJA-05 — a 5ª aba. O TAB_META do KTabBar é a única fonte do ícone da aba: sem a entrada `loja`, o KTabBar cai no
// fallback (ícone de pets), o que nenhum outro teste enxerga. Aqui o KIcon é trocado por um marcador para ler QUAL ícone foi pedido.
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KTabBar } from '../components/layout/KTabBar';

jest.mock('../components/primitives/KIcon', () => {
  const { Text: T } = require('react-native');
  return { KIcon: ({ name }: { name: string }) => <T>{`icone:${name}`}</T> };
});

const W = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;
const NOMES = ['pets', 'agenda', 'saude', 'loja', 'perfil'];
const TITULOS: Record<string, string> = { pets: 'Pets', agenda: 'Agenda', saude: 'Saúde', loja: 'Loja', perfil: 'Perfil' };

function props(index: number) {
  const routes = NOMES.map(n => ({ key: `${n}-key`, name: n, params: undefined }));
  return {
    state: { index, routes, key: 'tab-state', routeNames: NOMES, type: 'tab', stale: false as const },
    descriptors: Object.fromEntries(routes.map(r => [r.key, { options: { title: TITULOS[r.name] } }])),
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() },
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as any;
}

describe('KTabBar — aba Loja', () => {
  it('a aba "loja" usa o ícone próprio "loja" (TAB_META), não o fallback de pets', () => {
    const { getAllByText, getByLabelText } = render(<KTabBar {...props(0)} />, { wrapper: W });
    expect(getByLabelText('Loja')).toBeTruthy();
    expect(getAllByText(/^icone:/).map(n => (n.props.children as string))).toEqual([
      'icone:pets', 'icone:agenda', 'icone:saude', 'icone:loja', 'icone:perfil',
    ]);
  });

  it('a ordem das abas é pets, agenda, saúde, loja, perfil (Loja entre Saúde e Perfil, D-LOJA-6)', () => {
    const { getAllByRole } = render(<KTabBar {...props(3)} />, { wrapper: W });
    expect(getAllByRole('tab').map(t => t.props.accessibilityLabel)).toEqual(['Pets', 'Agenda', 'Saúde', 'Loja', 'Perfil']);
    expect(getAllByRole('tab')[3]!.props.accessibilityState.selected).toBe(true);
  });
});

describe('layout das abas — registro da rota', () => {
  it('Tabs.Screen "loja" existe e vem entre "saude" e "perfil"', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fonte = require('fs').readFileSync(require('path').join(__dirname, '..', 'app', '(tabs)', '_layout.tsx'), 'utf8') as string;
    const nomes = [...fonte.matchAll(/<Tabs\.Screen\s+name="([^"]+)"/g)].map(m => m[1]);
    expect(nomes).toEqual(['pets', 'agenda', 'saude', 'loja', 'perfil']);
  });
});
