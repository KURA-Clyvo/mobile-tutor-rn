// BR-TUT-T01 — gates de cor como teste Jest (substitui os greps de package.json).
//
// Por que não grep: `check:colors` e `check:no-ocean` (`! grep ...`) só pegavam `"#1A3A52"` entre ASPAS DUPLAS,
// em maiúsculas; falhavam em aspas simples, template literal, minúsculas e no nome do token `ocean`; e não rodam
// no Windows (`npm run` usa cmd.exe, que não entende o `!` inicial). Aqui rodam em qualquer SO, no `npm test`.
//
// Decisão sobre COMENTÁRIOS: comentário não conta (nem hex nem a palavra ocean). Código real documenta cores em
// comentário, e comentário não pinta pixel. O que conta é código executável.
import fs from 'fs';
import os from 'os';
import path from 'path';

const SRC_DIR = path.join(__dirname, '..');

// Remove comentários de linha inteira e de fim de linha (`// ...` precedido de espaço e fora de aspas
// simples) e blocos `/* ... */` (inclusive `{/* ... */}` do JSX).
export function semComentarios(texto: string): string {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map(l => (/^\s*\/\//.test(l) ? '' : l.replace(/(^|\s)\/\/[^'"`]*$/, '$1')))
    .join('\n');
}

const HEX_OCEAN = /#1a3a52/i; // qualquer aspas (simples, dupla, crase) ou sem aspas, qualquer caixa
const NOME_OCEAN = /\bocean[A-Za-z]*\b/; // colors.ocean, colors.oceanPale, `ocean:` (chave), 'ocean' (tom)
// Hex de 3, 4 (#RGBA), 6 ou 8 (#RRGGBBAA) digitos: alfa embutido tambem e cor fora do tema.
// `rgb(`/`rgba(`/`hsl(`/`hsla(` idem: scrim e bordas translucidas moram em tokens (`theme/`), nao no JSX.
const HEX_LITERAL = /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/;

type Achado = { arq: string; linha: number; trecho: string };
// Varre o TEXTO inteiro (sem comentarios), nao linha a linha: `colors\n  .ocean` ou um literal partido pelo
// Prettier em varias linhas continua achado. `linha` e a linha do inicio do casamento; `trecho` e essa linha.
function achar(rel: string, texto: string, regex: RegExp): Achado[] {
  const limpo = semComentarios(texto);
  const linhas = limpo.split('\n');
  const g = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  const out: Achado[] = [];
  for (const m of limpo.matchAll(g)) {
    const linha = limpo.slice(0, m.index).split('\n').length;
    out.push({ arq: rel, linha, trecho: (linhas[linha - 1] ?? '').trim() });
  }
  return out;
}
function varrer(dir: string, regex: RegExp, ignorar: (rel: string) => boolean): Achado[] {
  const achados: Achado[] = [];
  const anda = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      const rel = path.relative(dir, p).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (e.name === '__tests__' || e.name === 'node_modules') continue;
        anda(p);
      } else if (/\.(ts|tsx)$/.test(e.name) && !ignorar(rel)) {
        achados.push(...achar(rel, fs.readFileSync(p, 'utf8'), regex));
      }
    }
  };
  anda(dir);
  return achados;
}
const fmt = (a: Achado[]) => a.map(x => `${x.arq}:${x.linha}  ${x.trecho.slice(0, 100)}`);

// ---------- CONTROLE POSITIVO: o detector tem que ver a isca ----------
describe('controle positivo dos detectores', () => {
  let iscas: string;
  beforeAll(() => {
    iscas = fs.mkdtempSync(path.join(os.tmpdir(), 'cor-gates-isca-'));
    fs.writeFileSync(path.join(iscas, 'aspas-simples.ts'), "export const a = '#1a3a52';\n");
    fs.writeFileSync(path.join(iscas, 'aspas-duplas.ts'), 'export const b = "#1A3A52";\n');
    fs.writeFileSync(path.join(iscas, 'template.ts'), 'export const c = `#1A3A52`;\n');
    fs.writeFileSync(path.join(iscas, 'token.tsx'), 'const x = <View style={{ color: colors.ocean }} />;\n');
    fs.writeFileSync(path.join(iscas, 'chave.ts'), "export const d = { ocean: 'x' };\n");
    fs.writeFileSync(path.join(iscas, 'comentario.ts'), "// cor antiga #1A3A52 (ocean)\n/* ocean #1a3a52 */\nexport const e = 1; // ocean\n");
    fs.writeFileSync(path.join(iscas, 'hex-qualquer.tsx'), "const f = { base: '#8B6F45' };\n");
    fs.writeFileSync(path.join(iscas, 'hex-alfa8.ts'), "export const g = '#4A694480';\n");
    fs.writeFileSync(path.join(iscas, 'hex-alfa4.ts'), "export const h = '#4A68';\n");
    fs.writeFileSync(path.join(iscas, 'rgba.ts'), "export const i = 'rgba(26,58,82,0.1)';\n");
    fs.writeFileSync(path.join(iscas, 'rgb-espaco.ts'), 'export const j = `rgb (1,2,3)`;\n');
    fs.writeFileSync(path.join(iscas, 'multilinha.tsx'), "const k = {\n  a: 1,\n  borderColor:\n    cond\n      ? 'rgba(\n 26, 58, 82, 0.1)'\n      : colors\n          .ocean,\n};\n");
  });
  afterAll(() => fs.rmSync(iscas, { recursive: true, force: true }));

  const nenhum = () => false;
  it.each(['aspas-simples.ts', 'aspas-duplas.ts', 'template.ts'])('hex ocean em %s é acusado', arq => {
    const a = varrer(iscas, HEX_OCEAN, rel => rel !== arq);
    expect(a).toHaveLength(1);
  });
  it.each(['token.tsx', 'chave.ts'])('nome do token ocean em %s é acusado', arq => {
    expect(varrer(iscas, NOME_OCEAN, rel => rel !== arq)).toHaveLength(1);
  });
  it('hex literal qualquer é acusado fora de theme', () => {
    expect(varrer(iscas, HEX_LITERAL, rel => rel !== 'hex-qualquer.tsx')).toHaveLength(1);
  });
  it.each(['hex-alfa8.ts', 'hex-alfa4.ts', 'rgba.ts', 'rgb-espaco.ts'])('cor com alfa/funcional em %s é acusada', arq => {
    expect(varrer(iscas, HEX_LITERAL, rel => rel !== arq)).toHaveLength(1);
  });
  it('formato multilinha do Prettier: rgba( e colors\\n.ocean são achados', () => {
    expect(varrer(iscas, HEX_LITERAL, rel => rel !== 'multilinha.tsx')).toHaveLength(1);
    expect(varrer(iscas, /\bocean\b/, rel => rel !== 'multilinha.tsx')).toHaveLength(1);
  });
  it('comentário não conta (decisão documentada): controle negativo', () => {
    expect(varrer(iscas, HEX_OCEAN, rel => rel !== 'comentario.ts')).toHaveLength(0);
    expect(varrer(iscas, NOME_OCEAN, rel => rel !== 'comentario.ts')).toHaveLength(0);
  });
  it('varre a pasta toda (acha as 6 iscas de ocean/hex)', () => {
    expect(varrer(iscas, new RegExp(`${HEX_OCEAN.source}|${NOME_OCEAN.source}`, 'i'), nenhum).length).toBeGreaterThanOrEqual(5);
  });
});

// ---------- no-ocean: hex do ocean ----------
describe('no-ocean (hex)', () => {
  it('nenhum hex #1A3A52 em src/ fora de src/theme/ (qualquer aspas, qualquer caixa)', () => {
    expect(fmt(varrer(SRC_DIR, HEX_OCEAN, rel => rel.startsWith('theme/')))).toEqual([]);
  });
});

// ---------- no-ocean: nome do token ----------
// DS (ds-tokens-2026-10-09.json, token `ocean`): "No app do tutor só em badge de teleorientação, exame físico
// e aviso vindo da clínica — nunca como chrome." O token só pode aparecer nos arquivos abaixo, cada um com o uso
// permitido. Tela/componente novo que use ocean fora desta lista quebra o teste (decisão consciente, não acidente).
// Allowlist POR OCORRENCIA: arquivo + trecho da linha casada + quantas vezes + motivo. Uso NOVO de ocean num
// arquivo ja permitido (trecho diferente, ou a mesma linha repetida) quebra o teste: o `n` e exato.
// `n` conta CASAMENTOS de /ocean[A-Za-z]*/ (uma linha com `ocean:` e `colors.ocean` conta 2).
type Permissao = { arq: string; trecho: string; n: number; motivo: string };
const OCEAN_PERMITIDO: Permissao[] = [
  { arq: 'components/primitives/KChip.tsx', trecho: "type Tone = 'sage' | 'amber' | 'clay' | 'ocean' | 'mute'", n: 1, motivo: 'union de tons do chip (tipo)' },
  { arq: 'components/primitives/KChip.tsx', trecho: 'ocean: { bg: colors.oceanPale,', n: 3, motivo: 'tom ocean do chip (badge de teleorientação / aviso da clínica): chave, oceanPale e ocean' },
  { arq: 'components/domain/ConsultaSection.tsx', trecho: "type Tone = 'sage' | 'ocean' | 'amber'", n: 1, motivo: 'union de tons (tipo)' },
  { arq: 'components/domain/ConsultaSection.tsx', trecho: "tone === 'ocean' ? colors.ocean", n: 2, motivo: 'linha de seção Exame físico/Prescrição: comparação do tom e o token' },
  { arq: 'components/domain/ConsultasTab.tsx', trecho: 'colors.oceanPale', n: 1, motivo: 'bolinha da timeline de teleorientação (fundo)' },
  { arq: 'components/domain/ConsultasTab.tsx', trecho: 'const dotBorder = isTele ? colors.ocean', n: 1, motivo: 'bolinha da timeline de teleorientação (borda)' },
  { arq: 'components/domain/ConsultasTab.tsx', trecho: "<KChip tone={isTele ? 'ocean'", n: 1, motivo: 'badge de teleorientação' },
  { arq: 'components/domain/ConsultasTab.tsx', trecho: 'tone="ocean"', n: 2, motivo: 'seções Exame físico e Prescrição' },
  { arq: 'components/domain/ConsultasTab.tsx', trecho: 'borderLeftColor: colors.ocean', n: 1, motivo: 'linha de prescrição (ocean pelo DS)' },
  { arq: 'types/api.ts', trecho: "'ocean'", n: 1, motivo: 'union de tons de chip (tipo, não cor)' },
  { arq: 'types/domain.ts', trecho: "'ocean'", n: 1, motivo: 'union de tons de chip (tipo, não cor)' },
];

// Devolve violacoes: achado sem permissao, ou permissao cuja contagem nao bate (uso novo ou apodrecido).
// Cada achado e atribuido a PRIMEIRA permissao que o casa (arquivo igual e linha contendo o trecho).
export function violacoesOcean(achados: Achado[], permitido: Permissao[]): string[] {
  const usado = permitido.map(() => 0);
  const orfaos: string[] = [];
  for (const a of achados) {
    const i = permitido.findIndex(p => p.arq === a.arq && a.trecho.includes(p.trecho));
    if (i < 0) orfaos.push(`${a.arq}:${a.linha}  ${a.trecho}  (sem permissão)`);
    else usado[i] = (usado[i] ?? 0) + 1;
  }
  const contagem = permitido
    .map((p, i) => (usado[i] !== p.n ? `${p.arq} "${p.trecho}": esperado ${p.n}, achado ${usado[i]}` : ''))
    .filter(Boolean);
  return [...orfaos, ...contagem];
}

describe('no-ocean (controle positivo da allowlist por ocorrência)', () => {
  const base: Achado[] = [{ arq: 'app/notificacoes.tsx', linha: 19, trecho: "COMUNICADO_CLINICA:     { tone: 'ocean', label: 'Aviso' }," }];
  const perm: Permissao[] = [{ arq: 'app/notificacoes.tsx', trecho: "COMUNICADO_CLINICA:     { tone: 'ocean'", n: 1, motivo: 'x' }];
  it('a ocorrência permitida passa (controle negativo)', () => {
    expect(violacoesOcean(base, perm)).toEqual([]);
  });
  it('uso NOVO de colors.ocean num arquivo já permitido é acusado (isca: header de notificacoes)', () => {
    const novo = [...base, { arq: 'app/notificacoes.tsx', linha: 88, trecho: 'backgroundColor: colors.ocean,' }];
    expect(violacoesOcean(novo, perm)).toHaveLength(1);
  });
  it('a mesma linha permitida repetida é acusada pela contagem', () => {
    expect(violacoesOcean([...base, ...base], perm)).toHaveLength(1);
  });
  it('permissão apodrecida (ocorrência sumiu) é acusada', () => {
    expect(violacoesOcean([], perm)).toHaveLength(1);
  });
});

describe('no-ocean (nome do token)', () => {
  const achados = varrer(SRC_DIR, NOME_OCEAN, rel => rel.startsWith('theme/'));
  it('ocean só aparece nas ocorrências permitidas pelo DS (teleorientação, exame físico, aviso da clínica), exatamente', () => {
    expect(violacoesOcean(achados, OCEAN_PERMITIDO)).toEqual([]);
  });
  it('ocean nunca aparece em chrome: tab bar, layouts, botões, campos, cabeçalhos', () => {
    const chrome = /^(components\/layout\/|components\/primitives\/(KButton|KTextField|KCard|KDialog)|app\/_layout|app\/\(tabs\)\/_layout)/;
    expect(fmt(achados.filter(a => chrome.test(a.arq)))).toEqual([]);
  });
});

// ---------- check:colors: hex literal fora do tema ----------
// Cor de UI vem de `useTheme()`. Exceção justificada: paleta de pelagem das ilustrações de pet (pigmento, não tema).
const HEX_PERMITIDO: Record<string, string> = {
  'components/primitives/KPetPortrait.tsx': 'paleta de pelagem das ilustrações (Labrador/Siamês/SRD): pigmento de desenho, não cor de UI',
};

describe('colors (hex literal fora do tema)', () => {
  const achados = varrer(SRC_DIR, HEX_LITERAL, rel => rel.startsWith('theme/'));
  it('nenhum hex literal em src/ fora de src/theme/ e da lista permitida', () => {
    expect(fmt(achados.filter(a => !(a.arq in HEX_PERMITIDO)))).toEqual([]);
  });
  it('a lista de permitidos não apodrece', () => {
    const usados = new Set(achados.map(a => a.arq));
    expect(Object.keys(HEX_PERMITIDO).filter(k => !usados.has(k))).toEqual([]);
  });
});
