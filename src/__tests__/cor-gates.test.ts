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
const HEX_LITERAL = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/;

type Achado = { arq: string; linha: number; trecho: string };
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
        semComentarios(fs.readFileSync(p, 'utf8')).split('\n').forEach((l, i) => {
          if (regex.test(l)) achados.push({ arq: rel, linha: i + 1, trecho: l.trim().slice(0, 100) });
        });
      }
    }
  };
  anda(dir);
  return achados;
}
const fmt = (a: Achado[]) => a.map(x => `${x.arq}:${x.linha}  ${x.trecho}`);

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
const OCEAN_PERMITIDO: Record<string, string> = {
  'components/primitives/KChip.tsx': 'tom "ocean" do chip (badge de teleorientação / aviso da clínica)',
  'components/domain/ConsultaSection.tsx': 'linha de seção "Exame físico"/"Prescrição" (tom ocean)',
  'components/domain/ConsultasTab.tsx': 'exame físico, prescrição e badge de teleorientação na timeline',
  'app/(tabs)/agenda/novo.tsx': 'cartão do tipo "Teleorientação" selecionado',
  'app/notificacoes.tsx': 'tom do COMUNICADO_CLINICA (aviso vindo da clínica)',
  'types/api.ts': 'union de tons de chip (tipo, não cor)',
  'types/domain.ts': 'union de tons de chip (tipo, não cor)',
};

describe('no-ocean (nome do token)', () => {
  const achados = varrer(SRC_DIR, NOME_OCEAN, rel => rel.startsWith('theme/'));
  it('ocean só aparece nos arquivos permitidos pelo DS (teleorientação, exame físico, aviso da clínica)', () => {
    expect(fmt(achados.filter(a => !(a.arq in OCEAN_PERMITIDO)))).toEqual([]);
  });
  it('a lista de permitidos não apodrece (cada arquivo permitido ainda usa ocean)', () => {
    const usados = new Set(achados.map(a => a.arq));
    expect(Object.keys(OCEAN_PERMITIDO).filter(k => !usados.has(k))).toEqual([]);
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
