// src/__tests__/arquitetura-gate.test.ts
//
// TASK-F09 — GATE ARQUITETURAL DERIVADO DO CÓDIGO.
//
// Este arquivo NÃO testa comportamento de tela. Ele varre o próprio código-fonte
// e falha quando uma das 5 classes de bug corrigidas no ciclo KURA_BACKLOG_FRONT_1
// reaparecer. Regra de ouro v7 (FIX_7): *inventário escrito à mão apodrece em
// silêncio — o gate tem que DERIVAR a lista do código e falhar quando aparecer
// item sem check*. Por isso não há, em nenhuma das 5 regras, lista fixa de nomes
// de arquivo ou de pasta: tudo vem do filesystem ou da AST.
//
// ⚠️ POR QUE AST E NÃO `grep`
// Na TASK-F06 deste mesmo ciclo um critério mecânico baseado em `grep` de string
// REPROVOU CÓDIGO CORRETO, porque casou com o comentário `// era Alert.alert
// nativo`. Hoje, no HEAD, a MAIORIA das ocorrências textuais de `Alert` e de
// `router.back()` em src/ são COMENTÁRIO, não chamada. Um gate baseado em texto
// falharia imediatamente e seria afrouxado até virar enfeite.
// Decisão explícita: as regras 3 e 4 IGNORAM comentários e strings, porque
// operam sobre a AST do TypeScript, que só enxerga nós de código real. Os testes
// "sentinela" ao fim de cada regra PROVAM isso de forma versionada — código
// sintético com a chamada só em comentário tem que dar 0 violação, e o mesmo
// código com a chamada de verdade tem que dar 1.
//
// 🔴 LIMITES DECLARADOS DE COBERTURA — o que este gate NÃO pega
// Levantados pelo G2 (task-F09-review.md). Nenhum é falso-verde no caminho de
// regressão realista: todos exigem escrever contra a convenção do repo de forma
// deliberada. Estão aqui porque cobertura não declarada é a forma como um gate
// vira enfeite sem ninguém perceber — e porque, na entrega original, o limite da
// regra 2 estava declarado e os das regras 3 e 4 não (assimetria apontada pelo
// revisor como Minor-2/Minor-3).
//   Regra 2 — não detecta `require('react-native').SafeAreaView` nem
//             `import * as RN from 'react-native'` + `RN.SafeAreaView`.
//   Regra 3 — não detecta `RN.Alert.alert(...)`, `const { alert } = Alert` nem
//             `(Alert as any)?.alert(...)`. A forma `Alert?.alert('x')` É pega.
//   Regra 4 — não detecta receptor renomeado: `const r = useRouter(); r.back()`.
//   Regra 5 — prova a PRESENÇA do `_layout.tsx`, nunca o seu conteúdo. Um
//             `_layout.tsx` vazio ou sem `<Stack>` passa.
// Ao ampliar qualquer regra, amplie também o teste sentinela correspondente —
// senão a ampliação não tem prova de que morde.
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

const RAIZ_REPO = path.resolve(__dirname, '..', '..');
const DIR_SRC = path.join(RAIZ_REPO, 'src');
const DIR_APP = path.join(DIR_SRC, 'app');
const DIR_TABS = path.join(DIR_APP, '(tabs)');
const LAYOUT_TABS = path.join(DIR_TABS, '_layout.tsx');

/** Lista recursiva de verdade — src/app tem 3 níveis (`(tabs)/pets/[id]/index.tsx`). */
function listarRecursivo(dir: string, extensoes: string[]): string[] {
  const achados: string[] = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === 'node_modules') continue;
      achados.push(...listarRecursivo(completo, extensoes));
    } else if (extensoes.includes(path.extname(entrada.name))) {
      achados.push(completo);
    }
  }
  return achados;
}

/** Caminho relativo à raiz do repo, sempre com `/`, para mensagem legível. */
function rel(arquivo: string): string {
  return path.relative(RAIZ_REPO, arquivo).split(path.sep).join('/');
}

function parsear(arquivo: string, conteudo?: string): ts.SourceFile {
  const texto = conteudo ?? fs.readFileSync(arquivo, 'utf8');
  return ts.createSourceFile(arquivo, texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

/** Linha 1-based de um nó, para a mensagem de falha apontar o lugar exato. */
function linhaDe(sf: ts.SourceFile, no: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(no.getStart(sf)).line + 1;
}

function visitar(no: ts.Node, fn: (n: ts.Node) => void): void {
  fn(no);
  ts.forEachChild(no, (filho) => visitar(filho, fn));
}

function falhar(regra: string, violacoes: string[], porque: string, comoCorrigir: string): void {
  if (violacoes.length === 0) return;
  throw new Error(
    `\n[GATE F09] ${regra}\n` +
      `${violacoes.length} violacao(oes):\n` +
      violacoes.map((v) => `  x ${v}`).join('\n') +
      `\n\nPOR QUE ISSO E BUG: ${porque}` +
      `\nCOMO CORRIGIR: ${comoCorrigir}\n`,
  );
}

// ---------------------------------------------------------------------------
// REGRA 1 — todo .tsx dentro de src/app/ precisa de `export default`
// Derivação: varredura RECURSIVA de src/app/ por extensão .tsx. Nenhum nome de
// arquivo é citado. Dívida da TASK-F03 fechada aqui: aquela prova foi feita com
// um script de uso único que o implementador apagou; agora é teste versionado.
// ---------------------------------------------------------------------------
function temExportDefault(sf: ts.SourceFile): boolean {
  for (const stmt of sf.statements) {
    // `export default <expr>;`
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) return true;
    // `export default function ...` / `export default class ...`
    if (
      ts.canHaveModifiers(stmt) &&
      ts.getModifiers(stmt)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      return true;
    }
    // `export { X as default }`
    if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
      if (stmt.exportClause.elements.some((e) => e.name.text === 'default')) return true;
    }
  }
  return false;
}

describe('GATE F09 - regra 1 - toda rota de src/app/ exporta um componente default', () => {
  const rotas = listarRecursivo(DIR_APP, ['.tsx']);

  it('a varredura recursiva realmente enxerga os 3 niveis de src/app/', () => {
    // Antitautologia: uma varredura de 1 nível não veria nada disso.
    expect(rotas.length).toBeGreaterThanOrEqual(15);
    expect(rotas.some((a) => rel(a).includes('(tabs)/pets/[id]/'))).toBe(true);
  });

  it('nenhum arquivo de rota fica sem export default', () => {
    const violacoes = rotas
      .filter((a) => !temExportDefault(parsear(a)))
      .map((a) => `${rel(a)} - nenhum \`export default\` encontrado`);
    falhar(
      'REGRA 1 - rota sem `export default` em src/app/',
      violacoes,
      'o expo-router monta a rota a partir do export default do arquivo. Sem ele a rota existe no roteador mas renderiza vazio - falha silenciosa, sem erro de build.',
      'adicione `export default function NomeDaTela() { ... }` no arquivo apontado (ou `export default NomeDaTela;` no fim).',
    );
  });

  it('sentinela: o detector reprova um arquivo que so tem export nomeado', () => {
    expect(temExportDefault(parsear('fake.tsx', 'export function Tela() { return null; }'))).toBe(false);
    expect(temExportDefault(parsear('fake.tsx', 'export default function Tela() { return null; }'))).toBe(true);
    expect(temExportDefault(parsear('fake.tsx', 'function T(){}\nexport default T;'))).toBe(true);
    expect(temExportDefault(parsear('fake.tsx', 'function T(){}\nexport { T as default };'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// REGRA 2 — ninguém importa SafeAreaView de 'react-native'
// Derivação: varredura recursiva de TODO src/ (.ts/.tsx), leitura das
// ImportDeclaration pela AST. Sem lista de arquivos.
// ---------------------------------------------------------------------------
function importaSafeAreaViewDoRN(sf: ts.SourceFile): number[] {
  const linhas: number[] = [];
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (stmt.moduleSpecifier.text !== 'react-native') continue;
    const bindings = stmt.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        // `propertyName` cobre `SafeAreaView as X`; senão o nome é o próprio.
        const original = (el.propertyName ?? el.name).text;
        if (original === 'SafeAreaView') linhas.push(linhaDe(sf, el));
      }
    }
  }
  return linhas;
}

describe('GATE F09 - regra 2 - SafeAreaView nunca vem de react-native', () => {
  const fontes = listarRecursivo(DIR_SRC, ['.ts', '.tsx']);

  it('a varredura cobre src/ inteiro, nao so src/app/', () => {
    expect(fontes.length).toBeGreaterThanOrEqual(50);
    expect(fontes.some((a) => rel(a).startsWith('src/components/'))).toBe(true);
    expect(fontes.some((a) => rel(a).startsWith('src/services/'))).toBe(true);
  });

  it('nenhum arquivo importa SafeAreaView de react-native', () => {
    const violacoes: string[] = [];
    for (const arquivo of fontes) {
      const sf = parsear(arquivo);
      for (const linha of importaSafeAreaViewDoRN(sf)) {
        violacoes.push(`${rel(arquivo)}:${linha} - \`import { SafeAreaView } from 'react-native'\``);
      }
    }
    falhar(
      'REGRA 2 - SafeAreaView importado de react-native',
      violacoes,
      "o SafeAreaView do react-native esta DEPRECIADO e so respeita a safe area no iOS - no Android ele nao desconta a status bar, e o conteudo nasce por baixo dela.",
      "troque por `import { SafeAreaView } from 'react-native-safe-area-context'` (ou use o hook `useSafeAreaInsets` do mesmo pacote).",
    );
  });

  it('sentinela: o detector pega o import real e ignora o comentario', () => {
    const real = "import { View, SafeAreaView } from 'react-native';";
    const comentado = "// import { SafeAreaView } from 'react-native';\nimport { View } from 'react-native';";
    const correto = "import { SafeAreaView } from 'react-native-safe-area-context';";
    expect(importaSafeAreaViewDoRN(parsear('f.tsx', real))).toHaveLength(1);
    expect(importaSafeAreaViewDoRN(parsear('f.tsx', comentado))).toHaveLength(0);
    expect(importaSafeAreaViewDoRN(parsear('f.tsx', correto))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// REGRA 3 — nenhum `Alert.alert` em src/app/
// Derivação: varredura recursiva de src/app/, CallExpression na AST.
// ALLOWLIST: VAZIA, de propósito. A TASK-F06 migrou as 21 chamadas nativas para
// o KDialog e não deixou NENHUMA exceção justificada — medido no HEAD 6850be3:
// zero chamadas. Allowlist vazia não é descuido, é o estado real; item novo aqui
// só entra com razão específica escrita ao lado, no padrão do
// `TenantFilterCoverageTests` do .NET (que allowlista `Agendamento` com a razão
// ao lado). Allowlist não é depósito do que deu trabalho corrigir.
// ---------------------------------------------------------------------------
const ALLOWLIST_ALERT: { arquivo: string; razao: string }[] = [];

function chamadasAlertAlert(sf: ts.SourceFile): number[] {
  const linhas: number[] = [];
  visitar(sf, (no) => {
    if (!ts.isCallExpression(no)) return;
    const alvo = no.expression;
    if (!ts.isPropertyAccessExpression(alvo)) return;
    if (alvo.name.text !== 'alert') return;
    if (!ts.isIdentifier(alvo.expression) || alvo.expression.text !== 'Alert') return;
    linhas.push(linhaDe(sf, no));
  });
  return linhas;
}

describe('GATE F09 - regra 3 - Alert.alert nativo nao volta para src/app/', () => {
  const rotas = listarRecursivo(DIR_APP, ['.tsx', '.ts']);

  it('nenhuma tela chama Alert.alert', () => {
    const violacoes: string[] = [];
    for (const arquivo of rotas) {
      const relativo = rel(arquivo);
      if (ALLOWLIST_ALERT.some((i) => i.arquivo === relativo)) continue;
      for (const linha of chamadasAlertAlert(parsear(arquivo))) {
        violacoes.push(`${relativo}:${linha} - chamada a \`Alert.alert(...)\``);
      }
    }
    falhar(
      'REGRA 3 - Alert.alert nativo em src/app/',
      violacoes,
      'o Alert nativo quebra a identidade visual do app (usa o chrome do SO), nao e testavel pelo @testing-library/react-native e o callback dele roda fora do ciclo do React - foi a classe de bug da TASK-F06, que migrou 21 chamadas.',
      'use o `useDialogo()` de `src/components/primitives/KDialog.tsx`: `const acao = await confirmar({...})` / `await alerta({...})`. Se houver excecao realmente justificada, acrescente-a a ALLOWLIST_ALERT neste arquivo COM a razao especifica escrita.',
    );
  });

  it('sentinela: o detector ignora comentario e pega so a chamada real', () => {
    // Este é literalmente o caso que reprovou código correto na F06.
    const soComentario = '// TASK-F06: era um Alert.alert nativo aqui.\nexport default function T(){ return null; }';
    const real = "import { Alert } from 'react-native';\nexport default function T(){ Alert.alert('oi'); return null; }";
    const emString = "export const msg = 'antes usavamos Alert.alert(...)';";
    expect(chamadasAlertAlert(parsear('f.tsx', soComentario))).toHaveLength(0);
    expect(chamadasAlertAlert(parsear('f.tsx', emString))).toHaveLength(0);
    expect(chamadasAlertAlert(parsear('f.tsx', real))).toHaveLength(1);
  });

  it('todo item da allowlist tem razao escrita', () => {
    for (const item of ALLOWLIST_ALERT) {
      expect(item.razao.trim().length).toBeGreaterThan(30);
      expect(fs.existsSync(path.join(RAIZ_REPO, item.arquivo))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// REGRA 4 — `router.back()` só existe dentro do helper src/hooks/useVoltar.ts
// Derivação: varredura recursiva de TODO src/ (.ts/.tsx), CallExpression na AST.
// Fecha a dívida da TASK-F02: os 9 call sites de `voltar()` ficaram sem proteção
// de teste. Esta regra é ESTRUTURAL — não precisa de um teste por tela: qualquer
// tela que trocar `voltar()` por `router.back()` cru quebra aqui.
//
// EXCEÇÕES (2, ambas com razão específica — não são "difíceis de corrigir"):
//   1. src/hooks/useVoltar.ts — é O helper. A única chamada real de router.back()
//      do app mora aqui de propósito, guardada por router.canGoBack().
//   2. src/__tests__/ — os testes exercitam o ANTI-PADRÃO de propósito
//      (useVoltar.test.tsx tem uma prova de mordida que chama router.back() às
//      cegas para demonstrar o comportamento do código ANTIGO). Proibir aí
//      apagaria a própria prova de mordida da F02.
// ---------------------------------------------------------------------------
const HELPER_VOLTAR = 'src/hooks/useVoltar.ts';
const PREFIXO_TESTES = 'src/__tests__/';

function chamadasRouterBack(sf: ts.SourceFile): number[] {
  const linhas: number[] = [];
  visitar(sf, (no) => {
    if (!ts.isCallExpression(no)) return;
    const alvo = no.expression;
    if (!ts.isPropertyAccessExpression(alvo)) return;
    if (alvo.name.text !== 'back') return;
    // O receptor pode ser `router`, `useRouter()`, `props.router`…
    const receptor = alvo.expression.getText(sf);
    if (!/router/i.test(receptor)) return;
    linhas.push(linhaDe(sf, no));
  });
  return linhas;
}

describe('GATE F09 - regra 4 - router.back() cru so dentro de useVoltar.ts', () => {
  const fontes = listarRecursivo(DIR_SRC, ['.ts', '.tsx']);

  it('o helper existe e continua sendo o portador da chamada real', () => {
    // Antitautologia invertida: se o detector nunca casasse com nada, ESTA
    // asserção falharia — o helper TEM que ter exatamente uma chamada.
    expect(chamadasRouterBack(parsear(path.join(RAIZ_REPO, HELPER_VOLTAR)))).toHaveLength(1);
  });

  it('nenhuma tela chama router.back() diretamente', () => {
    const violacoes: string[] = [];
    for (const arquivo of fontes) {
      const relativo = rel(arquivo);
      if (relativo === HELPER_VOLTAR) continue;
      if (relativo.startsWith(PREFIXO_TESTES)) continue;
      for (const linha of chamadasRouterBack(parsear(arquivo))) {
        violacoes.push(`${relativo}:${linha} - chamada direta a \`router.back()\``);
      }
    }
    falhar(
      'REGRA 4 - router.back() fora do helper useVoltar',
      violacoes,
      'router.back() sem router.canGoBack() e NO-OP silencioso quando a tela foi alcancada sem historico (deep link de convite, toque em notificacao push): o botao Voltar simplesmente nao faz nada, sem feedback nenhum. Foi a classe de bug da TASK-F02.',
      "use o helper: `const voltar = useVoltar('/(tabs)/pets')` (declare o destino de fallback hierarquicamente correto DESTA tela) e chame `voltar()` no lugar de `router.back()`.",
    );
  });

  it('sentinela: o detector ignora comentario/JSDoc e pega so a chamada real', () => {
    const soComentario = '// o router.back() puro nao checa canGoBack()\n/** usa router.back() */\nexport const x = 1;';
    const real = 'export function f(router: any){ router.back(); }';
    const emString = "export const doc = 'chame router.back() aqui';";
    expect(chamadasRouterBack(parsear('f.ts', soComentario))).toHaveLength(0);
    expect(chamadasRouterBack(parsear('f.ts', emString))).toHaveLength(0);
    expect(chamadasRouterBack(parsear('f.ts', real))).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// REGRA 5 — toda aba declarada em (tabs)/_layout.tsx tem seu próprio _layout.tsx
// Derivação: os nomes das abas saem da AST do PRÓPRIO
// `src/app/(tabs)/_layout.tsx` (atributo `name` de cada `<Tabs.Screen>`), NÃO do
// filesystem e NUNCA hardcodados. Assim, aba nova sem _layout quebra o teste no
// commit que a criou — que é exatamente o bug que originou este ciclo inteiro
// (Voltar caindo no Perfil porque `pets`, `agenda` e `saude` não tinham
// _layout.tsx e compartilhavam o stack raiz).
// ---------------------------------------------------------------------------
function nomesDeAbasDeclarados(sf: ts.SourceFile): string[] {
  const nomes: string[] = [];
  visitar(sf, (no) => {
    let tag: ts.JsxTagNameExpression | undefined;
    let attrs: ts.JsxAttributes | undefined;
    if (ts.isJsxSelfClosingElement(no)) {
      tag = no.tagName;
      attrs = no.attributes;
    } else if (ts.isJsxOpeningElement(no)) {
      tag = no.tagName;
      attrs = no.attributes;
    }
    if (!tag || !attrs) return;
    if (tag.getText(sf) !== 'Tabs.Screen') return;
    for (const attr of attrs.properties) {
      if (!ts.isJsxAttribute(attr)) continue;
      if (attr.name.getText(sf) !== 'name') continue;
      const init = attr.initializer;
      if (init && ts.isStringLiteral(init)) nomes.push(init.text);
    }
  });
  return nomes;
}

describe('GATE F09 - regra 5 - toda aba tem seu proprio _layout.tsx', () => {
  const abas = nomesDeAbasDeclarados(parsear(LAYOUT_TABS));

  it('os nomes das abas sao derivados do (tabs)/_layout.tsx, e nao de lista fixa', () => {
    // Antitautologia: se a extração devolvesse [] o loop abaixo passaria vazio.
    expect(abas.length).toBeGreaterThanOrEqual(2);
  });

  it('cada aba declarada tem um _layout.tsx proprio', () => {
    const violacoes: string[] = [];
    for (const aba of abas) {
      const pasta = path.join(DIR_TABS, aba);
      if (!fs.existsSync(pasta) || !fs.statSync(pasta).isDirectory()) {
        violacoes.push(
          `src/app/(tabs)/${aba}/ - declarada em <Tabs.Screen name="${aba}"> mas a pasta nao existe`,
        );
        continue;
      }
      if (!fs.existsSync(path.join(pasta, '_layout.tsx'))) {
        violacoes.push(
          `src/app/(tabs)/${aba}/_layout.tsx - AUSENTE (aba declarada em (tabs)/_layout.tsx)`,
        );
      }
    }
    falhar(
      'REGRA 5 - aba sem _layout.tsx proprio',
      violacoes,
      'sem um _layout.tsx (Stack) proprio, as telas da aba sao empilhadas no stack RAIZ compartilhado - e o Voltar de uma tela dessa aba cai na ultima aba visitada em vez da tela pai. Foi o bug que originou o ciclo KURA_BACKLOG_FRONT_1 (Voltar caindo no Perfil).',
      'crie `src/app/(tabs)/<aba>/_layout.tsx` exportando por default um `<Stack screenOptions={{ headerShown: false }} />`, no mesmo molde das abas que ja tem.',
    );
  });

  it('sentinela: a extracao le o atributo name de <Tabs.Screen>, ignorando comentario', () => {
    const fonte =
      "import { Tabs } from 'expo-router';\n" +
      'export default function L(){ return (<Tabs>\n' +
      '  {/* <Tabs.Screen name="fantasma" /> */}\n' +
      '  <Tabs.Screen name="real" options={{ title: "R" }} />\n' +
      '</Tabs>); }';
    expect(nomesDeAbasDeclarados(parsear('f.tsx', fonte))).toEqual(['real']);
  });
});
