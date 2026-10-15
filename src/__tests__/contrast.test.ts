// BR-TUT-T01 — gate de contraste WCAG 2.x sobre os tokens REAIS do app do tutor.
// Valores de referência: Design System KURA (ds-tokens-2026-10-09.json). Limiar de texto = 4.5, sem "limítrofe".
//
// ÂNCORA (regra 11 do CLAUDE.md do workspace) — o desenho deste gate (ratio WCAG, truncamento sem
// arredondar a favor, tabela de pares + USOS com âncora de regex + varredura derivada do código) é
// cópia adaptada de mobile-clinica-rn/tests/contrast.test.ts, main@773ae66, linhas 1-35 (ratio/truncado),
// 38-95 (PARES) e 120-175 (USOS e varredura). Conferido em 2026-10-15.
// Reproduz: git -C ../mobile-clinica-rn show 773ae66:tests/contrast.test.ts | sed -n '1,35p;38,95p'
import fs from 'fs';
import path from 'path';
import { darkColors, lightColors } from '../theme/tokens';

type Cores = Record<string, string>;
type Tema = 'claro' | 'escuro';
const TEMA_NOMES: Tema[] = ['claro', 'escuro'];
const TEMAS: Record<Tema, Cores> = {
  claro: lightColors as unknown as Cores,
  escuro: darkColors as unknown as Cores,
};
const SRC_DIR = path.join(__dirname, '..');

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
const par = (texto: string, fundo: string, limiar = TEXTO): Par[] =>
  TEMA_NOMES.map(tema => ({ tema, texto, fundo, limiar }));

// Pares de TEMA (token de texto sobre fundos que o app realmente usa).
const PARES: Par[] = [
  // metadado (textMuteInk) só sobre os fundos neutros; sobre fundo tingido o app usa textSoft.
  ...par('textMuteInk', 'bg'),
  ...par('textMuteInk', 'surface'),
  ...par('textSoft', 'primarySoft'),
  ...par('textSoft', 'surface2'),
  ...par('textSoft', 'clayPale'),
  ...par('textSoft', 'oceanPale'),
  ...par('text', 'bg'),
  ...par('amberInk', 'amberPale'),
  ...par('amberInk', 'surface'),
  ...par('clayInk', 'clayPale'),
  ...par('clayInk', 'surface'),
  ...par('clayInk', 'bg'),
  ...par('primary', 'primarySoft'),
  ...par('textOnPrimary', 'primary'),
  ...par('textOnPrimary', 'danger'),
  ...par('danger', 'surface'),
  // borda de controle (campo, checkbox, trilho do switch desligado, botão secundário): 3:1
  ...par('borderControl', 'bg', BORDA),
  ...par('borderControl', 'surface', BORDA),
];

describe('ratio (sanidade WCAG)', () => {
  it('preto x branco = 21', () => {
    expect(ratio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });
  it('controle do DS: primary (sage) sobre bg claro = 5.55', () => {
    expect(ratio('#4A6944', '#F8F2E6')).toBeCloseTo(5.55, 2);
  });
  it('controle do DS: textMute canônico sobre bg claro < 4.5 (por isso texto usa textMuteInk)', () => {
    expect(truncado(ratio('#8A7458', '#F8F2E6'))).toBeLessThan(TEXTO);
  });
  it('truncamento não arredonda a favor (4.495 -> 4.49)', () => {
    expect(truncado(4.495)).toBe(4.49);
  });
});

describe('contraste dos tokens reais', () => {
  it.each(PARES)('$tema: $texto sobre $fundo >= $limiar', ({ tema, texto, fundo, limiar }) => {
    const t = TEMAS[tema];
    expect(t[texto]).toBeDefined();
    expect(t[fundo]).toBeDefined();
    expect(truncado(ratio(t[texto] as string, t[fundo] as string))).toBeGreaterThanOrEqual(limiar);
  });
});

// ---------- varredura DERIVADA do código (não depende de lista escrita à mão) ----------
function arquivosFonte(dir: string, acc: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'theme') continue;
      arquivosFonte(p, acc);
    } else if (/\.tsx$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}
const rel = (p: string) => path.relative(SRC_DIR, p).split(path.sep).join('/');
const TSX = arquivosFonte(SRC_DIR);
const tokens = (expr: string) => [...expr.matchAll(/(?:\bc|colors|theme\.colors)\.(\w+)/g)].map(m => m[1] as string);

type Uso = { arq: string; linha: number; trecho: string };
function usosDeCor(prop: RegExp, soTexto: boolean): { token: string; uso: Uso }[] {
  const out: { token: string; uso: Uso }[] = [];
  for (const f of TSX) {
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((linha, i) => {
      if (soTexto && /<KIcon/.test(linha)) return; // ícone é não-texto (3:1), fora desta checagem
      for (const m of linha.matchAll(prop)) {
        for (const tk of tokens(m[1] as string)) {
          out.push({ token: tk, uso: { arq: rel(f), linha: i + 1, trecho: linha.trim().slice(0, 90) } });
        }
      }
    });
  }
  return out;
}

// Tokens de TEXTO proibidos, derivados de tokens.ts: todo token que tem um gêmeo `<nome>Ink` só serve a
// preenchimento/grafismo; mais `warning` (alias de amber).
const PROIBIDOS_COMO_TEXTO = [...Object.keys(lightColors).filter(k => `${k}Ink` in lightColors), 'warning'];
// Exceções verificadas à mão (texto grande >= 24px: limiar 3:1, e a razão passa).
const EXCECOES_TEXTO: { arq: string; token: string; motivo: string }[] = [
  { arq: 'app/_layout.tsx', token: 'amber', motivo: 'ponto do wordmark da abertura, 76px (texto grande, 3:1)' },
];

describe('varredura: nenhum texto usa token que só serve a preenchimento', () => {
  it('a lista de proibidos é derivada dos tokens (controle: contém textMute, amber, clay)', () => {
    expect(PROIBIDOS_COMO_TEXTO).toEqual(expect.arrayContaining(['textMute', 'amber', 'clay']));
  });
  it('0 usos de color: <proibido> fora das exceções', () => {
    const achados = usosDeCor(/(?<![A-Za-z])color[:=]\s*\{?([^,}]*)/g, true)
      .filter(({ token }) => PROIBIDOS_COMO_TEXTO.includes(token))
      .filter(({ token, uso }) => !EXCECOES_TEXTO.some(e => e.arq === uso.arq && e.token === token))
      .map(({ token, uso }) => `${uso.arq}:${uso.linha} color usa ${token}: ${uso.trecho}`);
    expect(achados).toEqual([]);
  });
  it('0 placeholderTextColor com token proibido', () => {
    const achados = usosDeCor(/placeholderTextColor=\{([^}]*)\}/g, false)
      .filter(({ token }) => PROIBIDOS_COMO_TEXTO.includes(token))
      .map(({ token, uso }) => `${uso.arq}:${uso.linha} placeholder usa ${token}`);
    expect(achados).toEqual([]);
  });
});

describe('varredura: texto sobre fundo tingido', () => {
  // Texto "de metadado" cruzado com os fundos tingidos que o MESMO arquivo declara. Superconjunto por
  // construção (o arquivo pode usar o fundo em outro elemento), então cada par que reprova precisa estar
  // em ESPURIOS, verificado à mão como cruzamento sem elemento real, com o motivo.
  const TEXTOS = ['textMuteInk', 'amberInk', 'clayInk', 'danger', 'info'];
  const TINGIDOS = ['primarySoft', 'surface2', 'oceanPale', 'amberPale', 'clayPale', 'bgSunk', 'successBg', 'warningBg', 'dangerBg', 'infoBg'];
  const ESPURIOS: Record<string, string> = {
    'app/(tabs)/agenda/novo.tsx|claro|textMuteInk|oceanPale': 'metadado do tipo selecionado usa textSoft (USOS); o resto de textMuteInk está em cartão não selecionado (surface)',
    'app/(tabs)/agenda/novo.tsx|claro|textMuteInk|primarySoft': 'idem; resumoCard (primarySoft) só tem texto primary/text',
    'app/(tabs)/pets/novo.tsx|claro|textMuteInk|primarySoft': 'primarySoft só no ícone da foto e na espécie ativa (texto primary 5.06)',
    'app/(tabs)/pets/novo.tsx|claro|textMuteInk|surface2': 'segmento de sexo (surface2) usa textSoft/textOnPrimary',
    'app/(tabs)/pets/[id]/index.tsx|claro|textMuteInk|primarySoft': 'hero (primarySoft) usa textSoft (USOS); textMuteInk restante está sobre surface/bg',
    'app/(tabs)/pets/[id]/index.tsx|claro|textMuteInk|surface2': 'vitalBox (surface2) usa textSoft (USOS)',
    'app/(tabs)/saude/index.tsx|claro|textMuteInk|primarySoft': 'primarySoft só no círculo do ícone de tudo em dia; cabeçalhos em bg',
    'app/notificacoes.tsx|claro|textMuteInk|surface2': 'não lida (surface2) usa textSoft (USOS); textMuteInk só na lida (surface)',
    'app/register.tsx|claro|textMuteInk|primarySoft': 'inviteBanner (primarySoft) só tem texto primary',
    'app/register.tsx|claro|danger|primarySoft': 'danger é erro de campo em bg; inviteBanner só tem texto primary',
    'components/domain/ConsultasTab.tsx|claro|textMuteInk|surface2': 'vitalBox (surface2) usa textSoft (USOS)',
    'components/domain/ConsultasTab.tsx|claro|textMuteInk|primarySoft': 'primarySoft só no ponto da timeline e no chip de retorno (texto primary)',
    'components/domain/VacinaItem.tsx|claro|textMuteInk|primarySoft': 'primarySoft só no iconBox (ícone) e no botão Agendar (texto primary)',
    'components/domain/VacinasTab.tsx|claro|textMuteInk|primarySoft': 'banner (bg tingido) usa textSoft/ink; textMuteInk só em cabeçalhos sobre bg',
    'components/domain/VacinasTab.tsx|claro|textMuteInk|clayPale': 'idem',
    'components/domain/VacinasTab.tsx|escuro|textMuteInk|amberPale': 'idem',
    'components/primitives/KChip.tsx|claro|amberInk|primarySoft': 'toneMap: bg e cor pareados por tom (amber só com amberPale, USOS)',
    'components/primitives/KChip.tsx|claro|amberInk|clayPale': 'idem',
    'components/primitives/KChip.tsx|claro|amberInk|oceanPale': 'idem',
    'components/primitives/KChip.tsx|claro|amberInk|surface2': 'idem',
    'components/primitives/KConditionChip.tsx|claro|amberInk|clayPale': 'toneMap: amber só com amberPale (4.63)',
  };

  const achados: string[] = [];
  for (const f of TSX) {
    const src = fs.readFileSync(f, 'utf8');
    const txt = new Set<string>();
    const fundos = new Set<string>();
    src.split(/\r?\n/).forEach(l => {
      if (!/<KIcon/.test(l)) {
        for (const m of l.matchAll(/(?<![A-Za-z])color[:=]\s*\{?([^,}]*)/g)) tokens(m[1] as string).forEach(t => txt.add(t));
      }
      for (const m of l.matchAll(/backgroundColor:\s*([^,}]*)/g)) tokens(m[1] as string).forEach(t => fundos.add(t));
      for (const m of l.matchAll(/\bbg:\s*([^,}]*)/g)) tokens(m[1] as string).forEach(t => fundos.add(t));
    });
    for (const tema of TEMA_NOMES) {
      for (const a of txt) {
        if (!TEXTOS.includes(a)) continue;
        for (const b of fundos) {
          if (!TINGIDOS.includes(b)) continue;
          const A = TEMAS[tema][a];
          const B = TEMAS[tema][b];
          if (!A || !B) continue;
          if (truncado(ratio(A, B)) < TEXTO) achados.push(`${rel(f)}|${tema}|${a}|${b}`);
        }
      }
    }
  }
  it('todo cruzamento texto x fundo tingido < 4.5 está justificado como espúrio', () => {
    expect(achados.filter(k => !(k in ESPURIOS))).toEqual([]);
  });
  it('as justificativas não apodrecem (cada espúrio ainda é um cruzamento real)', () => {
    expect(Object.keys(ESPURIOS).filter(k => !achados.includes(k))).toEqual([]);
  });
});

// ---------- USOS: pares de uso real, com âncora de regex no arquivo ----------
const ler = (arq: string) => fs.readFileSync(path.join(SRC_DIR, arq), 'utf8');
type UsoAncorado = { arq: string; ancora: RegExp; texto: string; fundo: string; limiar?: number };
const USOS: UsoAncorado[] = [
  { arq: 'components/primitives/KChip.tsx', ancora: /mute:\s*\{ bg: colors\.surface2,\s*color: colors\.textSoft/, texto: 'textSoft', fundo: 'surface2' },
  { arq: 'components/primitives/KChip.tsx', ancora: /amber: \{ bg: colors\.amberPale,\s*color: colors\.amberInk/, texto: 'amberInk', fundo: 'amberPale' },
  { arq: 'components/primitives/KChip.tsx', ancora: /clay:\s*\{ bg: colors\.clayPale,\s*color: colors\.clayInk/, texto: 'clayInk', fundo: 'clayPale' },
  { arq: 'components/primitives/KNextActionCard.tsx', ancora: /bg = action\.urgent \? colors\.clayPale : colors\.surface2/, texto: 'textSoft', fundo: 'surface2' },
  { arq: 'components/primitives/KNextActionCard.tsx', ancora: /bg = action\.urgent \? colors\.clayPale : colors\.surface2/, texto: 'textSoft', fundo: 'clayPale' },
  { arq: 'components/domain/AlertaBanner.tsx', ancora: /backgroundColor: colors\.clayPale/, texto: 'clayInk', fundo: 'clayPale' },
  { arq: 'app/(tabs)/pets/[id]/index.tsx', ancora: /backgroundColor: colors\.primarySoft \}\]\}>\s*<KPetPortrait/, texto: 'textSoft', fundo: 'primarySoft' },
  { arq: 'app/(tabs)/pets/[id]/index.tsx', ancora: /vitalBox, \{ backgroundColor: colors\.surface2/, texto: 'textSoft', fundo: 'surface2' },
  { arq: 'components/domain/ConsultasTab.tsx', ancora: /vitalBox, \{ backgroundColor: colors\.surface2 \}/, texto: 'textSoft', fundo: 'surface2' },
  { arq: 'app/(tabs)/agenda/novo.tsx', ancora: /active \? colors\.textSoft : colors\.textMuteInk, fontSize: fontSize\.xs \}\}>\{t\.sub\}/, texto: 'textSoft', fundo: 'primarySoft' },
  { arq: 'app/notificacoes.tsx', ancora: /n\.flLida \? colors\.surface : colors\.surface2/, texto: 'textSoft', fundo: 'surface2' },
  // bordas de controle (não-texto, 3:1)
  { arq: 'components/primitives/KTextField.tsx', ancora: /: theme\.colors\.borderControl;/, texto: 'borderControl', fundo: 'surface', limiar: BORDA },
  { arq: 'components/primitives/KButton.tsx', ancora: /secondary:.*borderColor: theme\.colors\.borderControl/, texto: 'borderControl', fundo: 'bg', limiar: BORDA },
  { arq: 'app/(tabs)/perfil/consentimentos.tsx', ancora: /trackColor=\{\{ false: colors\.borderControl/, texto: 'borderControl', fundo: 'surface', limiar: BORDA },
  { arq: 'app/(tabs)/perfil/index.tsx', ancora: /trackColor=\{\{ false: colors\.borderControl/, texto: 'borderControl', fundo: 'bg', limiar: BORDA },
  { arq: 'app/register.tsx', ancora: /: c\.borderControl, backgroundColor: value/, texto: 'borderControl', fundo: 'bg', limiar: BORDA },
  { arq: 'app/(tabs)/pets/novo.tsx', ancora: /borderColor: colors\.borderControl, borderRadius: radius\.md/, texto: 'borderControl', fundo: 'surface', limiar: BORDA },
  { arq: 'app/(tabs)/agenda/novo.tsx', ancora: /borderColor: colors\.borderControl, borderRadius: radius\.md/, texto: 'borderControl', fundo: 'surface', limiar: BORDA },
];

describe('pares de uso real (âncora no arquivo)', () => {
  const casos = USOS.flatMap(u => TEMA_NOMES.map(tema => ({ ...u, tema, nome: `${u.arq} ${u.texto}/${u.fundo}` })));
  it.each(casos)('$tema: $nome', ({ arq, ancora, texto, fundo, tema, limiar }) => {
    expect(ler(arq)).toMatch(ancora); // se alguém trocar o token no componente, a âncora deixa de casar
    const t = TEMAS[tema];
    expect(truncado(ratio(t[texto] as string, t[fundo] as string))).toBeGreaterThanOrEqual(limiar ?? TEXTO);
  });
});

describe('controles: a borda de controle é usada onde há controle', () => {
  it('trilho de Switch desligado nunca usa border/borderStrong', () => {
    const achados = usosDeCor(/trackColor=\{\{\s*false:\s*([^,}]*)/g, false)
      .filter(({ token }) => token !== 'borderControl')
      .map(({ token, uso }) => `${uso.arq}:${uso.linha} Switch off usa ${token}`);
    expect(achados).toEqual([]);
  });
});
