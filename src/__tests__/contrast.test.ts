// BR-TUT-T01 — gate de contraste WCAG 2.x sobre os tokens REAIS do app do tutor.
// Valores de referência: Design System KURA (ds-tokens-2026-10-09.json). Limiar de texto = 4.5, sem "limítrofe".
//
// ÂNCORA (regra 11 do CLAUDE.md do workspace) — o desenho deste gate (ratio WCAG, truncamento sem
// arredondar a favor, tabela de pares + USOS com âncora de regex + varredura derivada do código) é
// cópia adaptada de mobile-clinica-rn/tests/contrast.test.ts, main@773ae66: ratio/truncado linhas 17-31,
// PARES 37-91, USOS 139-367, varredura derivada 402-444. Intervalos conferidos em 2026-10-15 (corrigidos
// após a G2, que mediu PARES 37-108, USOS 139-370, varredura 400-444 contando o `describe` seguinte).
// Reproduz: git -C ../mobile-clinica-rn show 773ae66:tests/contrast.test.ts | sed -n '17,31p;37,91p;139,367p;402,444p'
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
  ...par('textOnPrimary', 'clayInk'), // KBadge: contagem sobre clayInk (clay do DS reprovaria)
  ...par('danger', 'surface'),
  // borda de controle (campo, checkbox, trilho do switch desligado, botão secundário): 3:1
  // BR-TUT-T05 (m7): Toast.tsx pinta texto, ícone e borda sobre bgElev (sucesso, erro, info). AA de texto (4.5) nos três.
  ...par('text', 'bgElev'),
  ...par('success', 'bgElev'),
  ...par('danger', 'bgElev'),
  ...par('info', 'bgElev'),
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
const FONTES = new Map(TSX.map(f => [f, fs.readFileSync(f, 'utf8')] as const));
const tokens = (expr: string) => [
  ...[...expr.matchAll(/(?:\bc|colors|theme\.colors)\.(\w+)/g)].map(m => m[1] as string),
  ...[...expr.matchAll(/(?:\bc|colors|theme\.colors)\[['"](\w+)['"]\]/g)].map(m => m[1] as string),
];
const norm = (t: string) => t.replace(/\s+/g, ' ').trim();
const linhaDe = (src: string, idx: number) => src.slice(0, idx).split('\n').length;

// I-1: o texto é varrido INTEIRO (não linha a linha), então `color:\n colors.textMute` (formato do Prettier) é visto.
// E um identificador (`color: lineColor`, `color: bCfg.iconColor`) é resolvido pelas atribuições do MESMO arquivo.
function resolverIdent(src: string, ident: string): string[] {
  const out: string[] = [];
  const ultimo = ident.split('.').pop() as string;
  if (!ident.includes('.')) {
    for (const m of src.matchAll(new RegExp(`\\b(?:const|let|var)\\s+${ident}\\b[^=;]*=\\s*([^;]*?);`, 'g'))) out.push(...tokens(m[1] as string));
  }
  for (const m of src.matchAll(new RegExp(`\\b${ultimo}\\s*:\\s*([^,}]*)`, 'g'))) out.push(...tokens(m[1] as string));
  return out;
}
// `<KIcon ... color=...>` ainda aberto em `idx` (ícone é não-texto, 3:1; o tag pode estar em linha anterior).
function dentroDeKIcon(src: string, idx: number): boolean {
  const ini = src.lastIndexOf('<KIcon', idx);
  if (ini < 0 || idx - ini > 400) return false;
  const trecho = src.slice(ini, idx);
  return !trecho.includes('/>') && !trecho.includes('</');
}
type Sitio = { tokens: string[]; snippet: string; linha: number; naoResolvido?: string };
function sitios(src: string, prop: RegExp, soTexto: boolean): Sitio[] {
  const out: Sitio[] = [];
  for (const m of src.matchAll(prop)) {
    const idx = m.index as number;
    if (soTexto && dentroDeKIcon(src, idx)) continue;
    const valor = norm(m[1] as string);
    let tk = tokens(valor);
    let naoResolvido: string | undefined;
    if (tk.length === 0 && /^[A-Za-z_]\w*(?:\.\w+)*$/.test(valor) && !/^(string|number|boolean)$/.test(valor)) {
      tk = resolverIdent(src, valor);
      if (tk.length === 0) naoResolvido = valor;
    }
    out.push({ tokens: tk, snippet: norm(m[0]), linha: linhaDe(src, idx), naoResolvido });
  }
  return out;
}
const PROP_COR = /(?<![A-Za-z])color[:=]\s*\{?\s*([^,}]*)/g;
const PROP_FUNDO = /(?:backgroundColor|\bbg)\s*:\s*([^,}]*)/g;

type Uso = { arq: string; linha: number; trecho: string };
function usosDeCor(prop: RegExp, soTexto: boolean): { token: string; uso: Uso }[] {
  const out: { token: string; uso: Uso }[] = [];
  for (const f of TSX) {
    for (const s of sitios(FONTES.get(f) as string, prop, soTexto)) {
      for (const tk of s.tokens) out.push({ token: tk, uso: { arq: rel(f), linha: s.linha, trecho: s.snippet.slice(0, 90) } });
    }
  }
  return out;
}

// Tokens de TEXTO proibidos, derivados de tokens.ts: todo token que tem um gêmeo `<nome>Ink` só serve a
// preenchimento/grafismo; mais `warning` (alias de amber). Sem exceção por arquivo: o DS ganha, texto usa `*Ink`.
const PROIBIDOS_COMO_TEXTO = [...Object.keys(lightColors).filter(k => `${k}Ink` in lightColors), 'warning'];
// Identificadores de cor que NÃO vêm de token (parâmetro/propriedade de componente), verificados à mão.
const NAO_RESOLVIDOS_OK: RegExp[] = [];

describe('varredura: nenhum texto usa token que só serve a preenchimento', () => {
  it('a lista de proibidos é derivada dos tokens (controle: contém textMute, amber, clay)', () => {
    expect(PROIBIDOS_COMO_TEXTO).toEqual(expect.arrayContaining(['textMute', 'amber', 'clay']));
  });
  it('0 usos de color: <proibido> (nem em linha seguinte, nem por variável)', () => {
    const achados = usosDeCor(PROP_COR, true)
      .filter(({ token }) => PROIBIDOS_COMO_TEXTO.includes(token))
      .map(({ token, uso }) => `${uso.arq}:${uso.linha} color usa ${token}: ${uso.trecho}`);
    expect(achados).toEqual([]);
  });
  it('0 placeholderTextColor com token proibido', () => {
    const achados = usosDeCor(/placeholderTextColor=\{([^}]*)\}/g, false)
      .filter(({ token }) => PROIBIDOS_COMO_TEXTO.includes(token))
      .map(({ token, uso }) => `${uso.arq}:${uso.linha} placeholder usa ${token}`);
    expect(achados).toEqual([]);
  });
  it('todo `color: <identificador>` foi resolvido para tokens (senão a varredura estaria cega a ele)', () => {
    const nao: string[] = [];
    for (const f of TSX) for (const st of sitios(FONTES.get(f) as string, PROP_COR, true)) if (st.naoResolvido) nao.push(`${rel(f)}:${st.linha} ${st.snippet}`);
    expect(nao.filter(x => !NAO_RESOLVIDOS_OK.some(r => r.test(x)))).toEqual([]);
  });
});

// Controle positivo das cegueiras que a G2 achou (MB: valor na linha seguinte; MC: cor por variável),
// com a MESMA função e a MESMA regex da varredura real.
describe('controle positivo da varredura (I-1)', () => {
  const proibidos = (src: string) => sitios(src, PROP_COR, true).flatMap(x => x.tokens).filter(t => PROIBIDOS_COMO_TEXTO.includes(t));
  it('linha única (controle)', () => {
    expect(proibidos('<Text style={{ color: colors.textMute }} />')).toEqual(['textMute']);
  });
  it('MB: valor na linha seguinte (formato do Prettier)', () => {
    expect(proibidos('<Text style={[ {\n  color:\n    colors.textMute,\n} ]} />')).toEqual(['textMute']);
  });
  it('MC: cor por variável local', () => {
    expect(proibidos("const lineColor = tone === 'a' ? colors.primary : colors.textMute;\n<Text style={{ color: lineColor }} />")).toEqual(['textMute']);
  });
  it('MC2: cor por propriedade de objeto local', () => {
    expect(proibidos('const cfg = { a: { iconColor: colors.clay } };\n<Text style={{ color: cfg.a.iconColor }} />')).toEqual(['clay']);
  });
  it('KIcon multilinha continua fora (ícone é 3:1)', () => {
    expect(proibidos('<KIcon\n  name="x"\n  color={colors.amber}\n/>')).toEqual([]);
  });
  it('KIcon fechado antes não esconde o texto seguinte', () => {
    expect(proibidos('<KIcon name="x" color={colors.primary} />\n<Text style={{ color: colors.amber }} />')).toEqual(['amber']);
  });
});

describe('varredura: texto sobre fundo tingido', () => {
  // Texto "de metadado" cruzado com os fundos tingidos que o MESMO arquivo declara. Superconjunto por
  // construção (o arquivo pode usar o fundo em outro elemento), então cada cruzamento que reprova precisa de
  // isenção POR OCORRÊNCIA (I-2): para o par (arquivo, token de texto) a isenção fixa os SÍTIOS exatos
  // `color: <expr>` com a contagem de cada um — um uso novo, ou um uso trocado de lugar (`a ? x : y` invertido),
  // muda o conjunto de sítios e o teste falha. Cada fundo isento traz o motivo, verificado à mão na fonte.
  const TEXTOS = ['textMuteInk', 'amberInk', 'clayInk', 'danger', 'info'];
  const TINGIDOS = ['primarySoft', 'surface2', 'oceanPale', 'amberPale', 'clayPale', 'bgSunk', 'successBg', 'warningBg', 'dangerBg', 'infoBg'];
  type Isencao = { sitios: Record<string, number>; fundos: Record<string, string> };
  const ESPURIOS: Record<string, Isencao> = {
    'app/(tabs)/agenda/novo.tsx|textMuteInk': {
      sitios: {'color: colors.textMuteInk': 1, 'color: marcado ? colors.textSoft : colors.textMuteInk': 1},
      fundos: {
        'claro|primarySoft': 'opção marcada (primarySoft) usa textSoft no sítio ternário da raça do pet (par ancorado em USOS); os outros textMuteInk estão em bg',
      },
    },
    'app/(tabs)/pets/novo.tsx|textMuteInk': {
      sitios: {'color: colors.textMuteInk': 7, 'color: active ? colors.primary : colors.textMuteInk': 1},
      fundos: {
        'claro|primarySoft': 'primarySoft só no ícone da foto (KIcon) e na espécie ativa (texto primary); textMuteInk só no estado inativo (surface)',
        'claro|surface2': 'segmento de sexo (surface2) só tem texto textSoft/textOnPrimary',
      },
    },
    'app/(tabs)/pets/[id]/index.tsx|textMuteInk': {
      sitios: {'color: active ? colors.primary : colors.textMuteInk': 1, 'color: colors.textMuteInk': 7},
      fundos: {
        'claro|primarySoft': 'hero (primarySoft) não contém sítio de textMuteInk; os sítios estão em abas e seções sobre bg',
        'claro|surface2': 'vitalBox (surface2) só tem texto textSoft/text',
      },
    },
    'app/(tabs)/saude/index.tsx|textMuteInk': {
      sitios: {'color: colors.textMuteInk': 4},
      fundos: {
        'claro|primarySoft': 'primarySoft só no círculo do ícone de tudo em dia (KIcon); cabeçalhos em bg',
      },
    },
    'app/notificacoes.tsx|textMuteInk': {
      sitios: {'color: naoLidas > 0 ? colors.primary : colors.textMuteInk': 1, 'color: n.flLida ? colors.textMuteInk : colors.textSoft': 2, 'color: colors.textMuteInk': 1},
      fundos: {
        'claro|surface2': 'não lida (surface2) usa textSoft nos 2 sítios ternários (hora e pet); textMuteInk só na lida (surface) e no vazio (bg)',
      },
    },
    'app/register.tsx|textMuteInk': {
      sitios: {'color: c.textMuteInk': 4},
      fundos: {
        'claro|primarySoft': 'inviteBanner (primarySoft) só tem texto primary',
      },
    },
    'app/register.tsx|danger': {
      sitios: {'color: c.danger': 1},
      fundos: {
        'claro|primarySoft': 'danger é erro de campo em bg; inviteBanner só tem texto primary',
      },
    },
    'components/domain/ConsultasTab.tsx|textMuteInk': {
      sitios: {'color: colors.textMuteInk': 8},
      fundos: {
        'claro|primarySoft': 'primarySoft só no ponto da timeline (dotBg, sem texto) e no chip de retorno (texto primary)',
        'claro|surface2': 'vitalBox (surface2) só tem texto textSoft/text',
        'claro|oceanPale': 'oceanPale só no ponto da timeline (dotBg), sem texto',
      },
    },
    'components/domain/VacinaItem.tsx|textMuteInk': {
      sitios: {'color: colors.textMuteInk': 2},
      fundos: {
        'claro|primarySoft': 'primarySoft só no iconBox (KIcon) e no botão Agendar (texto primary); textMuteInk (clínica, lote) está sobre surface',
      },
    },
    'components/domain/VacinasTab.tsx|textMuteInk': {
      sitios: {'color: colors.textMuteInk': 5, 'color: bCfg.iconColor': 1},
      fundos: {
        'claro|primarySoft': 'banner (bg tingido) tem título iconColor e subtítulo textSoft; textMuteInk só em cabeçalhos/vazio sobre bg; o tom SEM_DATA usa textMuteInk como iconColor sobre o PRÓPRIO surface, nunca sobre um tingido',
        'claro|clayPale': 'idem',
        'escuro|amberPale': 'idem',
      },
    },
    'components/domain/VacinasTab.tsx|amberInk': {
      sitios: {'color: bCfg.iconColor': 1},
      fundos: {
        'claro|primarySoft': 'iconColor é pareado ao bg por status: amberInk só com amberPale (4.63), EM_DIA usa primary',
        'claro|clayPale': 'idem: VENCIDA usa clayInk, não amberInk',
      },
    },
    'components/domain/AlertaBanner.tsx|amberInk': {
      sitios: {'color: t.ink': 2},
      fundos: {
        'claro|clayPale': 'o tom (`tone`) escolhe bg e ink juntos: amberInk só com amberPale (USOS, 4.63); clayPale vai com clayInk',
      },
    },
    'components/primitives/KChip.tsx|amberInk': {
      sitios: {'color: colors.amberInk': 1},
      fundos: {
        'claro|primarySoft': 'toneMap pareia bg e cor por tom: amberInk só com amberPale (USOS)',
        'claro|surface2': 'idem',
        'claro|oceanPale': 'idem',
        'claro|clayPale': 'idem',
      },
    },
    'components/primitives/KConditionChip.tsx|amberInk': {
      sitios: {'color: colors.amberInk': 1},
      fundos: {
        'claro|clayPale': 'toneMap pareia bg e cor por tom: amberInk só com amberPale (4.63)',
      },
    },
  };

  const contagem = (src: string, texto: string) => {
    const c: Record<string, number> = {};
    for (const st of sitios(src, PROP_COR, true)) if (st.tokens.includes(texto)) c[st.snippet] = (c[st.snippet] ?? 0) + 1;
    return c;
  };
  const achados: string[] = []; // `arq|tema|texto|fundo`
  for (const f of TSX) {
    const src = FONTES.get(f) as string;
    const txt = new Set(sitios(src, PROP_COR, true).flatMap(x => x.tokens));
    const fundos = new Set(sitios(src, PROP_FUNDO, false).flatMap(x => x.tokens));
    for (const tema of TEMA_NOMES) {
      for (const a of TEXTOS) {
        if (!txt.has(a)) continue;
        for (const b of TINGIDOS) {
          if (!fundos.has(b)) continue;
          const A = TEMAS[tema][a];
          const B = TEMAS[tema][b];
          if (!A || !B) continue;
          if (truncado(ratio(A, B)) < TEXTO) achados.push(`${rel(f)}|${tema}|${a}|${b}`);
        }
      }
    }
  }
  const isento = (k: string) => {
    const [arq, tema, texto, fundo] = k.split('|') as [string, string, string, string];
    return ESPURIOS[`${arq}|${texto}`]?.fundos[`${tema}|${fundo}`] !== undefined;
  };
  it('todo cruzamento texto x fundo tingido < 4.5 está isento com motivo', () => {
    expect(achados.filter(k => !isento(k))).toEqual([]);
  });
  it('a isenção vale só para os sítios fixados (uso novo ou trocado de lugar falha)', () => {
    const divergentes: string[] = [];
    for (const [chave, iso] of Object.entries(ESPURIOS)) {
      const [arq, texto] = chave.split('|') as [string, string];
      const f = path.join(SRC_DIR, arq);
      if (!FONTES.has(f)) { divergentes.push(`${chave}: arquivo não existe`); continue; }
      const obs = contagem(FONTES.get(f) as string, texto);
      if (JSON.stringify(Object.entries(obs).sort()) !== JSON.stringify(Object.entries(iso.sitios).sort())) {
        divergentes.push(`${chave}: sítios observados ${JSON.stringify(obs)} != isentos ${JSON.stringify(iso.sitios)}`);
      }
    }
    expect(divergentes).toEqual([]);
  });
  it('as isenções não apodrecem (cada fundo isento ainda é um cruzamento real)', () => {
    const vivos = new Set(achados);
    const mortos: string[] = [];
    for (const [chave, iso] of Object.entries(ESPURIOS)) {
      const [arq, texto] = chave.split('|') as [string, string];
      for (const tf of Object.keys(iso.fundos)) {
        const [tema, fundo] = tf.split('|');
        if (!vivos.has(`${arq}|${tema}|${texto}|${fundo}`)) mortos.push(`${chave}|${tf}`);
      }
    }
    expect(mortos).toEqual([]);
  });
  // Isca (I-2): a MA da G2 — `notificacoes.tsx:93` com textMuteInk no lado que fica sobre surface2 — tem de falhar.
  it('isca: sítio de texto trocado de lugar dentro de um arquivo isento NÃO passa', () => {
    const orig = FONTES.get(path.join(SRC_DIR, 'app/notificacoes.tsx')) as string;
    const trocado = orig.replace(/n\.flLida \? colors\.textMuteInk : colors\.textSoft/, 'n.flLida ? colors.textSoft : colors.textMuteInk');
    expect(trocado).not.toBe(orig); // o alvo da isca existe
    const iso = ESPURIOS['app/notificacoes.tsx|textMuteInk'] as Isencao;
    expect(JSON.stringify(Object.entries(contagem(orig, 'textMuteInk')).sort())).toBe(JSON.stringify(Object.entries(iso.sitios).sort()));
    expect(JSON.stringify(Object.entries(contagem(trocado, 'textMuteInk')).sort())).not.toBe(JSON.stringify(Object.entries(iso.sitios).sort()));
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
  { arq: 'components/domain/AlertaBanner.tsx', ancora: /bg: colors\.clayPale/, texto: 'clayInk', fundo: 'clayPale' },
  // BR-TUT-T06: tom "atenção" do AlertaBanner (pet ALERTA): amberInk sobre amberPale, 4.63.
  { arq: 'components/domain/AlertaBanner.tsx', ancora: /bg: colors\.amberPale/, texto: 'amberInk', fundo: 'amberPale' },
  { arq: 'app/(tabs)/pets/[id]/index.tsx', ancora: /backgroundColor: colors\.primarySoft \}\]\}>\s*<KPetPortrait/, texto: 'textSoft', fundo: 'primarySoft' },
  { arq: 'app/(tabs)/pets/[id]/index.tsx', ancora: /vitalBox, \{ backgroundColor: colors\.surface2/, texto: 'textSoft', fundo: 'surface2' },
  { arq: 'components/domain/ConsultasTab.tsx', ancora: /vitalBox, \{ backgroundColor: colors\.surface2 \}/, texto: 'textSoft', fundo: 'surface2' },
  { arq: 'app/(tabs)/agenda/novo.tsx', ancora: /marcado \? colors\.textSoft : colors\.textMuteInk, fontSize: fontSize\.xs \}\}>\{p\.raca\}/, texto: 'textSoft', fundo: 'primarySoft' },
  { arq: 'app/notificacoes.tsx', ancora: /n\.flLida \? colors\.surface : colors\.surface2/, texto: 'textSoft', fundo: 'surface2' },
  // bordas de controle (não-texto, 3:1)
  { arq: 'components/primitives/KTextField.tsx', ancora: /: theme\.colors\.borderControl;/, texto: 'borderControl', fundo: 'surface', limiar: BORDA },
  { arq: 'components/primitives/KButton.tsx', ancora: /secondary:.*borderColor: theme\.colors\.borderControl/, texto: 'borderControl', fundo: 'bg', limiar: BORDA },
  { arq: 'app/(tabs)/perfil/consentimentos.tsx', ancora: /trackColor=\{\{ false: colors\.borderControl/, texto: 'borderControl', fundo: 'surface', limiar: BORDA },
  { arq: 'app/(tabs)/perfil/index.tsx', ancora: /trackColor=\{\{ false: colors\.borderControl/, texto: 'borderControl', fundo: 'bg', limiar: BORDA },
  { arq: 'app/register.tsx', ancora: /: c\.borderControl, backgroundColor: value/, texto: 'borderControl', fundo: 'bg', limiar: BORDA },
  { arq: 'app/(tabs)/pets/novo.tsx', ancora: /borderColor: colors\.borderControl, borderRadius: radius\.md/, texto: 'borderControl', fundo: 'surface', limiar: BORDA },
  // BR-TUT-T07 (I-6): borda da opção NÃO marcada do pedido de horário (1.5px, como o canvas v13) — era `border`, 1.25:1 / 1.12:1.
  { arq: 'app/(tabs)/agenda/novo.tsx', ancora: /marcado \? colors\.primary : colors\.borderControl,/, texto: 'borderControl', fundo: 'surface', limiar: BORDA },
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
