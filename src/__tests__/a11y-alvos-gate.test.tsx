// BR-TUT-T09 — gate de alvo de toque (>= 44), role e Dynamic Type. O detector é `src/a11y/escanearAlvos.ts` (pontos cegos
// declarados no cabeçalho dele). Padrão: clínica `tests/touch-target-area.test.ts` (BR-CLI-T05).
// Cada regra tem ISCA sintética (controle positivo): um "0 achados" na árvore real só vale porque o detector enxerga a isca.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { touchTarget } from '../theme/tokens';
import { KButton } from '../components/primitives/KButton';
import { escanear, MIN } from '../a11y/escanearAlvos';

const SRC = path.join(__dirname, '..');
function arquivos(dir: string, acc: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'a11y') continue;
      arquivos(p, acc);
    } else if (/\.tsx$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const regras = (codigo: string, nome = 'Isca.tsx') => escanear(codigo, nome).map((a) => a.regra);
const comp = (jsx: string, extra = '') =>
  `import { Pressable, View, Text, Switch, TouchableOpacity } from 'react-native';\n${extra}\nexport function C(){ return (${jsx}); }`;

describe('a11y-alvos — token', () => {
  it('touchTarget.min é 44', () => {
    expect(touchTarget.min).toBe(44);
    expect(MIN).toBe(44);
  });
});

describe('a11y-alvos — iscas (o detector enxerga cada defeito)', () => {
  const BOM = `<Pressable accessibilityRole="button" style={{ minHeight: touchTarget.min, minWidth: touchTarget.min }} />`;
  it('controle negativo: tocável correto não gera achado', () => {
    expect(regras(comp(BOM))).toEqual([]);
    expect(regras(comp(`<Pressable accessibilityRole="tab" style={[styles.a, { flex: 1 }]} />`, `const styles = StyleSheet.create({ a: { minHeight: 44 } });`))).toEqual([]);
  });
  it('literal 40 no style', () => {
    expect(regras(comp(`<Pressable accessibilityRole="button" style={{ width: 40, height: 40 }} />`))).toContain('alvo-pequeno');
  });
  it('dimensão pequena em UM ramo do ternário / função de pressed', () => {
    expect(regras(comp(`<Pressable accessibilityRole="button" style={c ? { minHeight: 44, minWidth: 44 } : { minHeight: 40 }} />`))).toContain('alvo-pequeno');
    expect(regras(comp(`<Pressable accessibilityRole="button" style={({ pressed }) => [{ minHeight: 44, minWidth: 44 }, pressed && { height: 30 }]} />`))).toContain('alvo-pequeno');
  });
  it('tamanho em StyleSheet referenciado por styles.x', () => {
    expect(regras(comp(`<Pressable accessibilityRole="button" style={styles.btn} />`, `const styles = StyleSheet.create({ btn: { minHeight: 36, minWidth: 44 } });`))).toContain('alvo-pequeno');
  });
  it('sem tamanho declarado (padding define o tamanho) reprova', () => {
    const r = regras(comp(`<Pressable accessibilityRole="button" style={{ padding: 8 }} />`));
    expect(r).toContain('sem-altura');
    expect(r).toContain('sem-largura');
  });
  it('hitSlop não completa o alvo', () => {
    expect(regras(comp(`<Pressable accessibilityRole="button" hitSlop={12} style={{ padding: 8 }} />`))).toContain('sem-altura');
  });
  it('sem role / role none', () => {
    expect(regras(comp(`<Pressable style={{ minHeight: 44, minWidth: 44 }} />`))).toContain('sem-role');
    expect(regras(comp(`<Pressable accessibilityRole="none" style={{ minHeight: 44, minWidth: 44 }} />`))).toContain('sem-role');
    expect(regras(comp(`<TouchableOpacity style={{ minHeight: 44, minWidth: 44 }} />`))).toContain('sem-role');
  });
  it('onPress em View/Text', () => {
    expect(regras(comp(`<Text onPress={f}>x</Text>`))).toContain('onpress-fora-de-tocavel');
  });
  it('Switch fora do KSwitchRow', () => {
    expect(regras(comp(`<Switch value={v} />`))).toContain('switch-solto');
    expect(escanear(comp(`<Switch value={v} />`), 'src/components/primitives/KSwitchRow.tsx').map((a) => a.regra)).toEqual([]);
  });
  it('allowFontScaling={false} (JSX, objeto, atribuição) e maxFontSizeMultiplier < 2', () => {
    expect(regras(comp(`<Text allowFontScaling={false}>x</Text>`))).toContain('font-scaling');
    expect(regras(comp(`<Text>x</Text>`, `const p = { allowFontScaling: false };`))).toContain('font-scaling');
    expect(regras(comp(`<Text>x</Text>`, `(Text as any).defaultProps.allowFontScaling = false;`))).toContain('font-scaling');
    expect(regras(comp(`<Text maxFontSizeMultiplier={1}>x</Text>`))).toContain('font-scaling');
    expect(regras(comp(`<Text allowFontScaling>x</Text>`))).toEqual([]);
  });
  it('accessible={false} (scrim decorativo) é isento', () => {
    expect(regras(comp(`<Pressable accessible={false} onPress={f} style={{ flex: 1 }} />`))).toEqual([]);
  });
  it('KButton com style < 44 no ponto de uso', () => {
    expect(regras(comp(`<KButton style={{ minHeight: 30 }}>x</KButton>`))).toContain('alvo-pequeno');
    expect(regras(comp(`<KButton style={{ flex: 1 }}>x</KButton>`))).toEqual([]);
  });
});

describe('a11y-alvos — fecha o barato (G2 I-1): role de controle, role undefined, rótulo vazio', () => {
  const T = `style={{ minHeight: 44, minWidth: 44 }}`;
  it('role fora do conjunto de controles reprova ("text" num tocável); controles passam', () => {
    expect(regras(comp(`<Pressable accessibilityRole="text" ${T} />`))).toContain('role-invalido');
    expect(regras(comp(`<Pressable accessibilityRole={'header'} ${T} />`))).toContain('role-invalido');
    for (const ok of ['button', 'link', 'switch', 'checkbox', 'radio', 'tab']) expect(regras(comp(`<Pressable accessibilityRole="${ok}" ${T} />`))).toEqual([]);
  });
  it('role undefined/null explícito (direto ou num ramo do ternário) reprova; ternário com dois roles passa', () => {
    expect(regras(comp(`<Pressable accessibilityRole={undefined} ${T} />`))).toContain('sem-role');
    expect(regras(comp(`<Pressable accessibilityRole={c ? 'button' : undefined} ${T} />`))).toContain('sem-role');
    expect(regras(comp(`<Pressable accessibilityRole={c ? 'button' : 'link'} ${T} />`))).toEqual([]);
  });
  it('accessibilityLabel vazio reprova; com texto passa', () => {
    expect(regras(comp(`<Pressable accessibilityRole="button" accessibilityLabel="" ${T} />`))).toContain('rotulo-vazio');
    expect(regras(comp(`<Pressable accessibilityRole="button" accessibilityLabel={''} ${T} />`))).toContain('rotulo-vazio');
    expect(regras(comp(`<Pressable accessibilityRole="button" accessibilityLabel="Fechar" ${T} />`))).toEqual([]);
  });
});

// ISCAS DE LIMITE (precedente: T04, `queryStateCoverage.test.ts`). Cada linha é um controle DEFEITUOSO que o gate APROVA.
// O `toEqual([])` abaixo trava a CEGUEIRA DECLARADA no cabeçalho de `escanearAlvos.ts` (G2 I-1, medida em R2). Se um dia o
// gate passar a enxergar uma delas, este teste falha DE PROPÓSITO: mova a linha para as iscas que reprovam e atualize o cabeçalho.
describe('a11y-alvos — iscas de LIMITE: o gate NÃO vê estas formas (cegueira declarada, não aprovação)', () => {
  const ok = `style={{ minHeight: 44, minWidth: 44 }}`;
  const R = `accessibilityRole="button"`;
  const casos: Array<[string, string, string]> = [
    ['piso + props.style (vence no render)', `<Pressable ${R} style={[{ minHeight: 44, minWidth: 44 }, props.style]} />`, ''],
    ['piso + estilo importado', `<Pressable ${R} style={[{ minHeight: 44, minWidth: 44 }, estilosExternos.pequeno]} />`, `import { estilosExternos } from './outro';`],
    ['piso + constante numérica', `<Pressable ${R} style={[{ minHeight: 44, minWidth: 44 }, { minHeight: PEQUENO }]} />`, `const PEQUENO = 20;`],
    ['piso + StyleSheet.flatten', `<Pressable ${R} style={[{ minHeight: 44, minWidth: 44 }, StyleSheet.flatten({ minHeight: 20 })]} />`, ''],
    ['return pequeno dentro de if na função de pressed', `<Pressable ${R} style={({ pressed }) => { if (pressed) { return { minHeight: 20 }; } return { minHeight: 44, minWidth: 44 }; }} />`, ''],
    ['touchTarget.min com aritmética (- 14)', `<Pressable ${R} style={{ minHeight: touchTarget.min - 14, minWidth: touchTarget.min - 14 }} />`, `import { touchTarget } from '../theme/tokens';`],
    ['touchTarget.min com aritmética (/ 2)', `<Pressable ${R} style={{ minHeight: touchTarget.min / 2, minWidth: touchTarget.min / 2 }} />`, `import { touchTarget } from '../theme/tokens';`],
    ['KButton com minHeight por aritmética de token', `<KButton style={{ minHeight: touchTarget.min - 14 }}>x</KButton>`, `import { touchTarget } from '../theme/tokens';`],
    ['flex: 0 contado como "preenche a largura"', `<Pressable ${R} style={{ minHeight: 44, flex: 0 }} />`, ''],
    ['Pressable por alias de import', `<P ${R} style={{ width: 30, height: 30 }} />`, `import { Pressable as P } from 'react-native';`],
    ['Pressable por alias de declaração', `<P style={{ width: 30, height: 30 }} />`, `const P = Pressable;`],
    ['Pressable por namespace', `<RN.Pressable style={{ width: 30, height: 30 }} />`, `import * as RN from 'react-native';`],
    ['createAnimatedComponent(Pressable)', `<AnimatedPressable style={{ width: 30, height: 30 }} />`, `const AnimatedPressable = Animated.createAnimatedComponent(Pressable);`],
    ['componente custom no ponto de uso', `<MeuBotao style={{ minHeight: 20, height: 20 }} onPress={f} />`, ''],
    ['KSwitchRow com style pequeno no ponto de uso', `<KSwitchRow style={{ minHeight: 20, height: 20 }} value={v} onValueChange={f} accessibilityLabel="x" testID="t">x</KSwitchRow>`, ''],
    ['KCard com style pequeno no ponto de uso', `<KCard onPress={f} style={{ minHeight: 20, height: 20 }}>x</KCard>`, ''],
    ['onPress em Animated.View', `<Animated.View onPress={f} />`, ''],
    ['onPress em KIcon', `<KIcon name="x" onPress={f} />`, ''],
    ['onLongPress em View', `<View onLongPress={f} />`, ''],
    ['onPressIn em View', `<View onPressIn={f} />`, ''],
    ['role por variável', `<Pressable accessibilityRole={papel} ${ok} />`, ''],
    ['accessible={false} num botão REAL de 20×20', `<Pressable accessible={false} onPress={salvar} style={{ width: 20, height: 20 }} />`, ''],
    ['maxFontSizeMultiplier por variável', `<Text maxFontSizeMultiplier={escala}>x</Text>`, ''],
  ];
  it.each(casos)('%s ⇒ gate APROVA (0 achados)', (_nome, jsx, extra) => {
    expect(regras(comp(jsx, extra))).toEqual([]);
  });
  it('CONTROLE: o mesmo harness enxerga um defeito literal (a lista acima não é cegueira do próprio teste)', () => {
    expect(regras(comp(`<Pressable ${R} style={{ width: 40, height: 40 }} />`))).toContain('alvo-pequeno');
  });
});

describe('a11y-alvos — a árvore real de src/', () => {
  const todos = arquivos(SRC);
  it('há arquivos para varrer (a varredura não está vazia)', () => {
    expect(todos.length).toBeGreaterThan(30);
  });
  it('0 tocável < 44, sem tamanho declarado, sem role; 0 Switch solto; 0 allowFontScaling={false}', () => {
    const achados = todos.flatMap((f) => escanear(fs.readFileSync(f, 'utf8'), path.relative(SRC, f)));
    const msg = achados.map((a) => `${a.arquivo}:${a.linha} [${a.regra}] ${a.detalhe}`);
    expect(msg).toEqual([]);
  });
});

describe('a11y-alvos — KButton renderizado', () => {
  const W = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;
  it.each(['sm', 'md', 'lg'] as const)('size=%s tem minHeight >= touchTarget.min', (size) => {
    const { getByRole } = render(<KButton size={size} onPress={jest.fn()}>OK</KButton>, { wrapper: W });
    const st = StyleSheet.flatten(getByRole('button').props.style);
    expect(st.minHeight).toBeGreaterThanOrEqual(touchTarget.min);
  });
});
