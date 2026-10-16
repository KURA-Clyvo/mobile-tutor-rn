// BR-TUT-T02 — a abertura cobre o arranque (fontes + sessão) no `_layout.tsx` REAL, e sai quando as duas
// coisas ficam prontas (não espera a animação de 600 ms). Também trava o texto "Kura." fora do código: o
// símbolo KuraMark o substituiu e uma regressão para <Text>Kura.</Text> tem que falhar aqui.
import React from 'react';
import fs from 'fs';
import path from 'path';
import { act, render } from '@testing-library/react-native';

let mockFontsLoaded = false;
let mockFontError: Error | null = null;

jest.mock('@expo-google-fonts/cormorant', () => ({ useFonts: () => [mockFontsLoaded, mockFontError], Cormorant_500Medium: 'c' }));
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
  beforeEach(() => {
    jest.useFakeTimers();
    mockFontError = null;
  });
  afterEach(() => jest.useRealTimers());

  it('fontes não prontas: a abertura continua mesmo depois dos 600 ms da animação', async () => {
    mockFontsLoaded = false;
    const r = render(<RootLayout />);
    await act(async () => void jest.advanceTimersByTime(1000));
    expect(r.queryByTestId('abertura', { includeHiddenElements: true })).not.toBeNull();
    expect(r.queryByTestId('stack')).toBeNull();
  });

  it('erro ao carregar fonte: a abertura sai e o app aparece (fonte do sistema), sem prender o arranque', async () => {
    mockFontsLoaded = false;
    mockFontError = new Error('falha de rede ao baixar a fonte');
    const r = render(<RootLayout />);
    await act(async () => void jest.advanceTimersByTime(1000));
    expect(r.queryByTestId('abertura', { includeHiddenElements: true })).toBeNull();
    expect(r.queryByTestId('stack')).not.toBeNull();
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
  // Normaliza o fonte para enxergar o texto que o JSX de fato desenha: tira comentários, desembrulha
  // literais em chaves (`{'Kura.'}`, `{"Kura"}`, `{`Kura`}`) e trata as quebras de linha do Prettier como
  // espaço. Depois procura `Kura` seguido de `.` com, no máximo, tags JSX no meio (`Kura<Text>.</Text>`),
  // sempre como TEXTO de JSX (entre `>` e `<`). `demo@kura.local`, imports e identificadores não têm `>`
  // antes do `Kura` nem `<` depois do ponto, e não casam.
  const desembrulhar = (t: string) =>
    t
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '$1')
      .replace(/\{\s*(['"`])([^'"`{}]*)\1\s*\}/g, '$2');
  const TEXTO_MARCA = />\s*Kura\s*(?:<[^<>]*>\s*)*\.\s*(?:<[^<>]*>\s*)*</;
  const desenhaKura = (t: string) => TEXTO_MARCA.test(desembrulhar(t));
  const varrer = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' ? [] : varrer(p);
      if (!/\.tsx$/.test(e.name)) return [];
      return desenhaKura(fs.readFileSync(p, 'utf8')) ? [path.relative(SRC, p)] : [];
    });

  it.each([
    ['texto simples', '<Text style={s}>Kura.</Text>'],
    ['forma do Prettier, em linhas separadas', '<Text style={s}>\n  Kura.\n</Text>'],
    ['literal entre aspas simples em chaves', "<Text>{'Kura.'}</Text>"],
    ['literal entre aspas duplas em chaves', '<Text>{"Kura."}</Text>'],
    ['template literal em chaves', '<Text>{`Kura.`}</Text>'],
    ['ponto em Text aninhado, em linhas separadas', '<Text>\n  Kura<Text>.</Text>\n</Text>'],
    ['forma do splash antigo', "<Text>{'Kura'}<Text style={s}>.</Text></Text>"],
    ['ponto em literal separado', "<Text>{'Kura'}{'.'}</Text>"],
  ])('controle positivo: o detector pega %s', (_nome, fonte) => {
    expect(desenhaKura(fonte)).toBe(true);
  });

  it.each([
    ['e-mail demo', "const e = 'demo@kura.local';"],
    ['import de módulo', "import { KuraMark } from '@/components/brand/KuraMark';\nimport k from './kura.config';"],
    ['símbolo no JSX', '<View><KuraMark size={44} /></View>'],
    ['comentário', '// o texto "Kura." foi trocado pelo símbolo\n<View />'],
    ['rótulo de acessibilidade', '<View accessibilityLabel="KURA" />'],
  ])('controle negativo: o detector ignora %s', (_nome, fonte) => {
    expect(desenhaKura(fonte)).toBe(false);
  });

  it('nenhum .tsx de src/ desenha "Kura." como texto', () => {
    expect(varrer(SRC)).toEqual([]);
  });
});
