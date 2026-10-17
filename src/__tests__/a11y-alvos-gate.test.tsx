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
