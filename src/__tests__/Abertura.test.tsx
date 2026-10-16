// BR-TUT-T02. ÂNCORA (regra 11): adaptado de mobile-clinica-rn `tests/Abertura.test.tsx` linhas 1-161, commit 773ae66,
// conferido em 2026-10-15 (git -C mobile-clinica-rn show 773ae66:tests/Abertura.test.tsx | sed -n '1,161p').
// Diferenças: imports do tutor, `primarySoft` no lugar de `primaryPale`, sem a variante sobreOcean.
import React from 'react';
import * as RN from 'react-native';
import { Animated, Text } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { spawnSync } from 'child_process';
import { join } from 'path';
import { Path, Circle } from 'react-native-svg';
import { act, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { lightColors, darkColors } from '../theme/tokens';
import { Abertura, PLANO_ABERTURA } from '../components/brand/Abertura';
import { KuraMark } from '../components/brand/KuraMark';

let mockReduzir = false;
const mockHideAsync = jest.fn(() => Promise.resolve());

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => mockReduzir,
}));
jest.mock('expo-router', () => ({
  SplashScreen: { hideAsync: () => mockHideAsync(), preventAutoHideAsync: jest.fn() },
}));

function montar() {
  return render(
    <ThemeProvider>
      <Abertura />
    </ThemeProvider>,
  );
}

const patas = (r: ReturnType<typeof montar>) => r.UNSAFE_getByType(KuraMark).props.patas as [string, string, string];
const avancar = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

describe('Abertura', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReduzir = false;
    mockHideAsync.mockClear();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('plano: teto duro de 600 ms e fade reduzido de no máximo 150 ms', () => {
    expect(PLANO_ABERTURA.fimMs).toBeLessThanOrEqual(600);
    expect(PLANO_ABERTURA.fadeReduzidoMs).toBeLessThanOrEqual(150);
  });

  it('termina sozinha em no máximo 600 ms: nenhum passo agendado além do teto', () => {
    const r = montar();
    const base = lightColors.primary;
    avancar(PLANO_ABERTURA.fimMs);
    expect(jest.getTimerCount()).toBe(0);
    expect(patas(r)).toEqual([base, base, base]);
  });

  // F4-2 (G2): `getTimerCount()` não vê animação com `useNativeDriver: true` (não agenda timer JS no Jest).
  // Então a duração é medida na fonte: toda animação criada pelo caminho normal (Animated.timing/delay,
  // withTiming/withDelay do Reanimated), com `delay` + `duration` somados, tem de caber no teto — qualquer
  // que seja a forma (constante, variável importada, literal).
  it('caminho normal: a soma de delay + duration de toda animação criada cabe em 600 ms', () => {
    const timing = jest.spyOn(Animated, 'timing');
    const delay = jest.spyOn(Animated, 'delay');
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    const withDelay = jest.spyOn(Reanimated, 'withDelay');
    montar();
    avancar(PLANO_ABERTURA.fimMs);
    const total =
      timing.mock.calls.reduce((a, [, c]) => a + (c.delay ?? 0) + c.duration!, 0) +
      delay.mock.calls.reduce((a, [ms]) => a + ms, 0) +
      withTiming.mock.calls.reduce((a, [, c]) => a + (c?.duration ?? 300), 0) +
      withDelay.mock.calls.reduce((a, [ms]) => a + ms, 0);
    expect(total).toBeLessThanOrEqual(PLANO_ABERTURA.fimMs);
  });

  it('as 3 patas acendem em sequência (meio, depois laterais) e voltam à cor do símbolo', () => {
    const r = montar();
    const base = lightColors.primary;
    const ambar = lightColors.amberInk; // tinta de ícone do DS (M5): amber puro dá 2,5:1 sobre o corpo
    expect(patas(r)).toEqual([base, base, base]); // primeiro quadro = splash
    avancar(PLANO_ABERTURA.pataCentralMs);
    expect(patas(r)).toEqual([ambar, base, base]);
    avancar(PLANO_ABERTURA.pataLateraisMs - PLANO_ABERTURA.pataCentralMs);
    expect(patas(r)).toEqual([ambar, ambar, ambar]);
    avancar(PLANO_ABERTURA.voltaMs - PLANO_ABERTURA.pataLateraisMs);
    expect(patas(r)).toEqual([base, base, base]);
  });

  it('o primeiro quadro tem o símbolo de 100 dp sobre o bg do tema (o mesmo do splash)', () => {
    const r = montar();
    expect(r.UNSAFE_getByType(KuraMark).props.size).toBe(100);
    const estilo = r.getByTestId('abertura', { includeHiddenElements: true }).props.style;
    expect(estilo).toEqual(expect.arrayContaining([{ backgroundColor: lightColors.bg }]));
  });

  it('esconde o splash nativo quando o primeiro quadro é montado (onLayout)', () => {
    const r = montar();
    expect(mockHideAsync).not.toHaveBeenCalled();
    act(() => r.getByTestId('abertura', { includeHiddenElements: true }).props.onLayout({ nativeEvent: { layout: {} } }));
    expect(mockHideAsync).toHaveBeenCalledTimes(1);
  });

  it('Reduce Motion: as patas nunca acendem; só a opacidade anima e acaba em no máximo 150 ms', () => {
    mockReduzir = true;
    const timing = jest.spyOn(Animated, 'timing');
    const r = montar();
    const base = lightColors.primary;
    // Única animação: opacidade, com duração <= 150 ms, e nenhuma etapa de pata agendada.
    expect(timing).toHaveBeenCalledTimes(1);
    const cfg = timing.mock.calls[0]![1];
    expect(cfg.toValue).toBe(1);
    expect(cfg.duration).toBeLessThanOrEqual(150);
    expect(Object.keys(cfg).sort()).toEqual(['duration', 'toValue', 'useNativeDriver']);
    avancar(PLANO_ABERTURA.fadeReduzidoMs);
    expect(mockHideAsync).toHaveBeenCalledTimes(1); // o splash sai ao fim do fade
    // passado o teto da abertura normal, nenhuma pata acendeu
    avancar(PLANO_ABERTURA.fimMs);
    expect(patas(r)).toEqual([base, base, base]);
  });

  it('desmontar antes do fim cancela todos os timers (o teste do index.tsx prova a fiação)', () => {
    const r = montar();
    avancar(PLANO_ABERTURA.pataCentralMs);
    r.unmount();
    avancar(2000); // se sobrasse timer da abertura, ele dispararia aqui
    expect(jest.getTimerCount()).toBe(0);
  });

  it('não contém nenhum <Text> (sem texto, porcentagem ou dica)', () => {
    const r = montar();
    expect(r.UNSAFE_queryAllByType(Text)).toHaveLength(0);
    avancar(PLANO_ABERTURA.fimMs);
    expect(r.UNSAFE_queryAllByType(Text)).toHaveLength(0);
  });
});

// I2 (G2 da BR-CLI-T04): o 1º quadro em JS tem de ser IDÊNTICO ao splash nativo, e o splash vem do
// gerador. Aqui o que a Abertura DESENHA (fills/strokes/opacidades do SVG) é comparado, por tema,
// com as cores que o gerador resolve (`gerar-assets.mjs --cores`, leitura própria do json e do
// tokens.ts) — não com constantes copiadas. Antes só o tamanho/bg/patas eram conferidos e a
// haste do tema Noite divergiu em silêncio (#6FA8C8 no splash x #4A8AAB na abertura).
describe('Abertura: o símbolo do 1º quadro tem as cores do splash gerado', () => {
  const gerador = JSON.parse(
    spawnSync(process.execPath, [join(__dirname, '..', '..', 'scripts', 'gerar-assets.mjs'), '--cores'], { encoding: 'utf8' }).stdout,
  ) as Record<'claro' | 'escuro', Record<'sobreNeutro', Record<string, string | number>>>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockReduzir = false;
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it.each([
    ['claro', 'light', lightColors],
    ['escuro', 'dark', darkColors],
  ] as const)('tema %s', (tema, esquema, tokens) => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue(esquema);
    const r = montar();
    const esperado = gerador[tema].sobreNeutro;
    // O tutor não mocka react-native-svg: lê os props direto dos componentes Path/Circle do símbolo.
    const [corpo, haste, contorno] = r.UNSAFE_getAllByType(Path);
    const circulos = r.UNSAFE_getAllByType(Circle);
    expect(corpo!.props.fill).toBe(esperado.corpo);
    expect(corpo!.props.fillOpacity).toBe(esperado.corpoOpac);
    expect(haste!.props.stroke).toBe(esperado.haste);
    expect(haste!.props.opacity).toBe(esperado.hasteOpac);
    expect(contorno!.props.stroke).toBe(esperado.contorno);
    expect(contorno!.props.opacity).toBe(esperado.contornoOpac);
    circulos.forEach((c) => expect(c.props.fill).toBe(esperado.patas));
    expect(circulos[1]!.props.opacity).toBe(esperado.lateraisOpac);
    // pré-condição: o tema renderizado é mesmo o pedido (senão a comparação seria sempre claro x claro)
    expect(esperado.corpo).toBe(tokens.primarySoft);
    // patas acesas: a cor vem do json (amberInk), não de um token escolhido na Abertura
    avancar(PLANO_ABERTURA.voltaMs - 1);
    r.UNSAFE_getAllByType(Circle).forEach((c) => expect(c.props.fill).toBe(gerador[tema].sobreNeutro.pataAcesa));
  });
});
