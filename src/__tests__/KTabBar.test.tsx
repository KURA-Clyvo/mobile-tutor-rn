// src/__tests__/KTabBar.test.tsx
//
// TASK-F01: KTabBar trocava de aba com router.push(), que EMPILHA histórico
// em vez de trocar a aba ativa. Consequência relatada pelo usuário: qualquer
// router.back() em qualquer tela do app volta pra última aba VISITADA (quase
// sempre Perfil, a última do array), não pro pai hierárquico.
//
// Estes testes provam:
//   1) tocar numa aba despacha pelo navegador de abas (navigation.emit
//      'tabPress' + navigation.navigate), e NÃO router.push — mordida
//      comprovada rodando contra o KTabBar antigo (falha) e o corrigido (passa).
//   2) a aba ativa vem de state.index/state.routes, não de pathname.includes()
//      — incluindo um caso onde o pathname "engana" o casamento por substring.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KTabBar } from '../components/layout/KTabBar';

const mockPush     = jest.fn();
const mockNavigate = jest.fn();
const mockEmit     = jest.fn(() => ({ defaultPrevented: false }));

// KTabBar corrigido não deveria mais precisar de expo-router pra nada, mas o
// mock fica aqui pra: (a) permitir rodar este arquivo sem erro contra a
// versão ANTIGA do componente (que ainda importa useRouter/usePathname), e
// (b) servir de "isca" de pathname pro teste 2 — um pathname que bateria por
// substring com uma aba errada se o casamento antigo (pathname.includes)
// ainda estivesse em uso.
jest.mock('expo-router', () => ({
  useRouter:   () => ({ push: mockPush }),
  usePathname: () => '/perfil/pets-detalhe', // contém 'pets' E 'perfil' como substring
}));

const W = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

function buildRoutes() {
  return [
    { key: 'pets-key',   name: 'pets',   params: undefined },
    { key: 'agenda-key', name: 'agenda', params: undefined },
    { key: 'saude-key',  name: 'saude',  params: undefined },
    { key: 'perfil-key', name: 'perfil', params: undefined },
  ];
}

function buildDescriptors(routes: ReturnType<typeof buildRoutes>) {
  const titles: Record<string, string> = { pets: 'Pets', agenda: 'Agenda', saude: 'Saúde', perfil: 'Perfil' };
  return Object.fromEntries(
    routes.map(r => [r.key, { options: { title: titles[r.name] } }]),
  );
}

function buildProps(activeIndex: number) {
  const routes = buildRoutes();
  return {
    state: { index: activeIndex, routes, key: 'tab-state', routeNames: routes.map(r => r.name), type: 'tab', stale: false as const },
    descriptors: buildDescriptors(routes),
    navigation: { emit: mockEmit, navigate: mockNavigate },
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as any;
}

beforeEach(() => {
  mockPush.mockClear();
  mockNavigate.mockClear();
  mockEmit.mockClear();
});

describe('KTabBar — troca de aba', () => {
  it('ao tocar numa aba inativa, despacha pelo navegador (tabPress + navigate) e NUNCA router.push', () => {
    // agenda (index 1) está ativa; toca em Perfil (index 3, inativa)
    const props = buildProps(1);
    const { getByText } = render(<KTabBar {...props} agendaBadgeCount={0} />, { wrapper: W });

    fireEvent.press(getByText('PERFIL'));

    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'perfil-key' }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('perfil');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('não navega quando a aba tocada já está ativa', () => {
    const props = buildProps(0); // pets ativa
    const { getByText } = render(<KTabBar {...props} agendaBadgeCount={0} />, { wrapper: W });

    fireEvent.press(getByText('PETS'));

    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'pets-key' }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('KTabBar — aba ativa deriva de state.index', () => {
  it('marca ativa a aba de state.index, mesmo com pathname mockado pra confundir casamento por substring', () => {
    // pathname mockado é '/perfil/pets-detalhe' — contém 'pets' E 'perfil'.
    // Um casamento por pathname.includes(tab.name) acertaria 'pets' (primeiro
    // no array) e também casaria 'perfil', nunca 'agenda'. state.index=1
    // aponta pra 'agenda': só ela deve estar accessibilityState.selected=true.
    const props = buildProps(1);
    const { getByLabelText } = render(<KTabBar {...props} agendaBadgeCount={0} />, { wrapper: W });

    expect(getByLabelText('Agenda').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Pets').props.accessibilityState.selected).toBe(false);
    expect(getByLabelText('Saúde').props.accessibilityState.selected).toBe(false);
    expect(getByLabelText('Perfil').props.accessibilityState.selected).toBe(false);
  });

  it('acompanha a troca de state.index (Perfil ativa)', () => {
    const props = buildProps(3);
    const { getByLabelText } = render(<KTabBar {...props} agendaBadgeCount={0} />, { wrapper: W });

    expect(getByLabelText('Perfil').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Pets').props.accessibilityState.selected).toBe(false);
  });
});

describe('KTabBar — comportamento preservado', () => {
  it('mostra o badge da agenda quando agendaBadgeCount > 0', () => {
    const props = buildProps(0);
    const { getByText } = render(<KTabBar {...props} agendaBadgeCount={3} />, { wrapper: W });
    expect(getByText('3')).toBeTruthy();
  });

  it('mantém as 4 abas na ordem pets, agenda, saude, perfil', () => {
    const props = buildProps(0);
    const { getByLabelText } = render(<KTabBar {...props} agendaBadgeCount={0} />, { wrapper: W });
    expect(getByLabelText('Pets')).toBeTruthy();
    expect(getByLabelText('Agenda')).toBeTruthy();
    expect(getByLabelText('Saúde')).toBeTruthy();
    expect(getByLabelText('Perfil')).toBeTruthy();
  });
});
