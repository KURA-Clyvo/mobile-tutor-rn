// BR-TUT-T02 — a abertura cobre o arranque (fontes + sessão) no `_layout.tsx` REAL, e sai quando as duas
// coisas ficam prontas (não espera a animação de 600 ms). Também trava o texto "Kura." fora do código: o
// símbolo KuraMark o substituiu e uma regressão para <Text>Kura.</Text> tem que falhar aqui.
import React from 'react';
import fs from 'fs';
import path from 'path';
import { act, render } from '@testing-library/react-native';

let mockFontsLoaded = false;

jest.mock('@expo-google-fonts/cormorant', () => ({ useFonts: () => [mockFontsLoaded], Cormorant_500Medium: 'c' }));
jest.mock('@expo-google-fonts/lexend', () => ({ Lexend_400Regular: 'l4', Lexend_500Medium: 'l5' }));
jest.mock('@expo-google-fonts/jetbrains-mono', () => ({ JetBrainsMono_400Regular: 'j' }));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
jest.mock('expo-router', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SplashScreen: { hideAsync: jest.fn(() => Promise.resolve()), preventAutoHideAsync: jest.fn() },
    Stack: () => <View testID="stack" />,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  };
});
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-linking', () => ({
  getInitialURL: () => Promise.resolve(null),
  addEventListener: () => ({ remove: jest.fn() }),
}));
jest.mock('../services/notifications.service', () => ({ setupHandlers: () => () => undefined }));
jest.mock('../hooks/useNotifications', () => ({ usePushTokenSync: () => undefined }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RootLayout = require('../app/_layout').default;

describe('_layout: a abertura cobre fontes e sessão', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fontes não prontas: a abertura continua mesmo depois dos 600 ms da animação', async () => {
    mockFontsLoaded = false;
    const r = render(<RootLayout />);
    await act(async () => void jest.advanceTimersByTime(1000));
    expect(r.queryByTestId('abertura', { includeHiddenElements: true })).not.toBeNull();
    expect(r.queryByTestId('stack')).toBeNull();
  });

  it('fontes e sessão prontas: a abertura sai e o app aparece, sem esperar a animação', async () => {
    mockFontsLoaded = true;
    const r = render(<RootLayout />);
    await act(async () => void jest.advanceTimersByTime(50)); // bem antes dos 600 ms
    expect(r.queryByTestId('abertura', { includeHiddenElements: true })).toBeNull();
    expect(r.queryByTestId('stack')).not.toBeNull();
  });
});

describe('marca: o texto "Kura." não volta no lugar do símbolo', () => {
  const SRC = path.join(__dirname, '..');
  // `>Kura.<` (texto JSX) ou `{'Kura'}` (a forma que o splash antigo usava).
  const TEXTO_MARCA = />\s*Kura\.\s*</;
  const TEXTO_MARCA_EXPR = /\{\s*['"`]Kura['"`]\s*\}/;
  const varrer = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' ? [] : varrer(p);
      if (!/\.tsx$/.test(e.name)) return [];
      const t = fs.readFileSync(p, 'utf8');
      return TEXTO_MARCA.test(t) || TEXTO_MARCA_EXPR.test(t) ? [path.relative(SRC, p)] : [];
    });

  it('controle positivo: o detector enxerga as duas formas', () => {
    expect(TEXTO_MARCA.test('<Text style={s}>Kura.</Text>')).toBe(true);
    expect(TEXTO_MARCA_EXPR.test("{'Kura'}")).toBe(true);
  });

  it('nenhum .tsx de src/ desenha "Kura." como texto', () => {
    expect(varrer(SRC)).toEqual([]);
  });
});
