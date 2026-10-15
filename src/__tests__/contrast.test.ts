// BR-TUT-T01 — gate de contraste WCAG 2.x sobre os tokens REAIS do app do tutor.
// Etapa 1 (vermelho): os pares que a auditoria F5 (f0-tut-auditoria.md) reprova, com os tokens de hoje.
import { darkColors, lightColors } from '../theme/tokens';

type Cores = Record<string, string>;
type Tema = 'claro' | 'escuro';
const TEMAS: Record<Tema, Cores> = {
  claro: lightColors as unknown as Cores,
  escuro: darkColors as unknown as Cores,
};

function canal(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminancia(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}
export function ratio(a: string, b: string): number {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
// Trunca a 2 casas — nunca arredonda a favor: 4.495 NÃO vira 4.50.
const truncado = (r: number) => Math.floor(r * 100) / 100;

const TEXTO = 4.5;
const BORDA = 3;
type Par = { tema: Tema; texto: string; fundo: string; limiar: number };
const PARES: Par[] = [
  { tema: 'claro', texto: 'textMute', fundo: 'primarySoft', limiar: TEXTO },
  { tema: 'claro', texto: 'textMute', fundo: 'surface2', limiar: TEXTO },
  { tema: 'escuro', texto: 'textMute', fundo: 'primarySoft', limiar: TEXTO },
  { tema: 'escuro', texto: 'textMute', fundo: 'surface2', limiar: TEXTO },
  { tema: 'escuro', texto: 'textMute', fundo: 'surface', limiar: TEXTO },
  { tema: 'claro', texto: 'borderStrong', fundo: 'surface', limiar: BORDA },
  { tema: 'escuro', texto: 'border', fundo: 'surface', limiar: BORDA },
];

describe('contraste dos tokens reais', () => {
  it.each(PARES)('$tema: $texto sobre $fundo >= $limiar', ({ tema, texto, fundo, limiar }) => {
    const t = TEMAS[tema];
    expect(truncado(ratio(t[texto] as string, t[fundo] as string))).toBeGreaterThanOrEqual(limiar);
  });
});
