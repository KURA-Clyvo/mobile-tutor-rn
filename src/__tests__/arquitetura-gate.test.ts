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

// ---------------------------------------------------------------------------
// REGRA 6 (T-5) — nenhum hook do TanStack Query dentro de src/app/ ou src/components/
// Derivação: varredura recursiva das duas pastas, AST. Detecta a CHAMADA
// (`useQuery({...})`) e o IMPORT nomeado de '@tanstack/react-query' — as duas,
// porque cada uma sozinha tem um buraco: só-chamada perde um alias renomeado no
// import, e só-import perde um re-export interno.
//
// A regra que a T-3 fechou: `(tabs)/saude/index.tsx` montava um `useQueries` na
// própria tela, com queryKey e queryFn escritos ali. O critério da disciplina pede
// hooks de TanStack Query isolados da camada de UI.
//
// `useQueryClient` NÃO entra na lista de propósito: ele não busca nem muta dado,
// só alcança o client já montado. Um `grep` de texto por "useQuery" pegaria ele
// junto (é prefixo); a AST compara o identificador inteiro, e a sentinela prova.
// ---------------------------------------------------------------------------
const HOOKS_DE_DADOS = new Set(['useQuery', 'useQueries', 'useMutation', 'useInfiniteQuery']);
const DIR_COMPONENTS = path.join(DIR_SRC, 'components');

function usosDeHookDeDados(sf: ts.SourceFile): { linha: number; oque: string }[] {
  const achados: { linha: number; oque: string }[] = [];
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (stmt.moduleSpecifier.text !== '@tanstack/react-query') continue;
    const bindings = stmt.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        const original = (el.propertyName ?? el.name).text;
        if (HOOKS_DE_DADOS.has(original)) {
          achados.push({ linha: linhaDe(sf, el), oque: 'import de `' + original + '`' });
        }
      }
    }
  }
  visitar(sf, (no) => {
    if (!ts.isCallExpression(no)) return;
    if (!ts.isIdentifier(no.expression)) return;
    if (!HOOKS_DE_DADOS.has(no.expression.text)) return;
    achados.push({ linha: linhaDe(sf, no), oque: 'chamada a `' + no.expression.text + '(...)`' });
  });
  return achados;
}

describe('GATE F09 - regra 6 - hooks do TanStack Query ficam fora da camada de UI', () => {
  const ui = [...listarRecursivo(DIR_APP, ['.ts', '.tsx']), ...listarRecursivo(DIR_COMPONENTS, ['.ts', '.tsx'])];

  it('a varredura cobre as duas pastas de UI', () => {
    expect(ui.some((a) => rel(a).startsWith('src/app/'))).toBe(true);
    expect(ui.some((a) => rel(a).startsWith('src/components/'))).toBe(true);
    expect(ui.length).toBeGreaterThanOrEqual(25);
  });

  it('o instrumento acha os hooks onde eles DEVEM estar (controle positivo)', () => {
    // Se este numero cair para 0, o detector parou de enxergar - e o teste de
    // cima passaria verde por cegueira, nao por conformidade.
    const emHooks = listarRecursivo(path.join(DIR_SRC, 'hooks'), ['.ts'])
      .flatMap((a) => usosDeHookDeDados(parsear(a)));
    expect(emHooks.length).toBeGreaterThanOrEqual(10);
  });

  it('nenhuma tela ou componente usa useQuery/useQueries/useMutation', () => {
    const violacoes: string[] = [];
    for (const arquivo of ui) {
      for (const uso of usosDeHookDeDados(parsear(arquivo))) {
        violacoes.push(`${rel(arquivo)}:${uso.linha} - ${uso.oque}`);
      }
    }
    falhar(
      'REGRA 6 - hook do TanStack Query dentro da camada de UI',
      violacoes,
      'queryKey e queryFn escritas na tela acoplam a UI ao transporte: duas telas que leem o mesmo recurso divergem a chave sem ninguem perceber (cache duplicada, invalidacao que nao alcanca a outra), e a tela deixa de ser testavel sem um QueryClient real. Foi o caso de `(tabs)/saude/index.tsx` ate a T-3.',
      'crie o hook em `src/hooks/` (ex.: `useVacinasDosPets.ts`) e deixe a tela consumir so o resultado: `const { dados, isLoading, refetch } = useMeuHook(...)`.',
    );
  });

  it('sentinela: pega chamada e import reais, ignora comentario/string e nao confunde useQueryClient', () => {
    const chamada = "import { useQuery } from '@tanstack/react-query';\nexport const f = () => useQuery({ queryKey: ['x'] });";
    const soComentario = '// antes isso era um useQuery({...}) na tela\nexport const x = 1;';
    const emString = "export const doc = 'nao use useQuery aqui';";
    const client = "import { useQueryClient } from '@tanstack/react-query';\nexport const f = () => useQueryClient();";
    expect(usosDeHookDeDados(parsear('f.ts', chamada))).toHaveLength(2); // o import e a chamada
    expect(usosDeHookDeDados(parsear('f.ts', soComentario))).toHaveLength(0);
    expect(usosDeHookDeDados(parsear('f.ts', emString))).toHaveLength(0);
    expect(usosDeHookDeDados(parsear('f.ts', client))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// REGRA 7 (T-5) — a camada de UI não importa FUNÇÃO de src/services/
// Import de TIPO é permitido (`import type { X }` e `import { type X }`): tipo
// some na compilação, não cria acoplamento em runtime, e o app inteiro tipa
// props contra os DTOs declarados em `types/api`.
//
// Derivação: AST das ImportDeclaration de src/app/ e src/components/, casando o
// especificador contra `services/` (relativo ou pelo alias `@services/`).
// ---------------------------------------------------------------------------
const ALLOWLIST_SERVICES: { arquivo: string; simbolo: string; razao: string }[] = [
  {
    arquivo: 'src/app/_layout.tsx',
    simbolo: 'setupHandlers',
    razao: 'nao e acesso a dados: registra os listeners de notificacao e o canal do Android uma vez no boot. Precisa do QueryClient e do Router da raiz, entao so pode ser chamado do layout raiz - nao existe tela onde caberia melhor.',
  },
  {
    arquivo: 'src/app/_layout.tsx',
    simbolo: 'queryClient',
    razao: 'e a instancia que o PersistQueryClientProvider da raiz monta. Nao e funcao de acesso a dados, e o provider so pode viver aqui - todo hook do app depende dele estar acima na arvore.',
  },
  {
    arquivo: 'src/app/_layout.tsx',
    simbolo: 'asyncStoragePersister',
    razao: 'mesma razao do queryClient: e config do provider da raiz (persistencia da cache em AsyncStorage), passada como prop no mesmo ponto de montagem.',
  },
];

function importsDeFuncaoDeService(sf: ts.SourceFile): { linha: number; simbolo: string }[] {
  const achados: { linha: number; simbolo: string }[] = [];
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const de = stmt.moduleSpecifier.text;
    if (!/(^|\/)services\//.test(de) && !de.startsWith('@services/')) continue;
    const clause = stmt.importClause;
    if (!clause) continue;                 // `import 'efeito'` — não traz símbolo
    if (clause.isTypeOnly) continue;       // `import type { X } from ...`
    if (clause.name) {
      achados.push({ linha: linhaDe(sf, clause.name), simbolo: clause.name.text });
    }
    const bindings = clause.namedBindings;
    if (!bindings) continue;
    if (ts.isNamespaceImport(bindings)) {
      achados.push({ linha: linhaDe(sf, bindings), simbolo: '* as ' + bindings.name.text });
      continue;
    }
    for (const el of bindings.elements) {
      if (el.isTypeOnly) continue;         // `import { type X }`
      achados.push({ linha: linhaDe(sf, el), simbolo: (el.propertyName ?? el.name).text });
    }
  }
  return achados;
}

describe('GATE F09 - regra 7 - a UI nao importa funcao de src/services/', () => {
  const ui = [...listarRecursivo(DIR_APP, ['.ts', '.tsx']), ...listarRecursivo(DIR_COMPONENTS, ['.ts', '.tsx'])];

  it('o instrumento acha os imports de service onde eles DEVEM estar (controle positivo)', () => {
    const emHooks = listarRecursivo(path.join(DIR_SRC, 'hooks'), ['.ts'])
      .flatMap((a) => importsDeFuncaoDeService(parsear(a)));
    expect(emHooks.length).toBeGreaterThanOrEqual(8);
  });

  it('nenhuma tela ou componente importa funcao de service', () => {
    const violacoes: string[] = [];
    for (const arquivo of ui) {
      const relativo = rel(arquivo);
      for (const imp of importsDeFuncaoDeService(parsear(arquivo))) {
        const liberado = ALLOWLIST_SERVICES.some((i) => i.arquivo === relativo && i.simbolo === imp.simbolo);
        if (liberado) continue;
        violacoes.push(`${relativo}:${imp.linha} - importa \`${imp.simbolo}\` de src/services/`);
      }
    }
    falhar(
      'REGRA 7 - funcao de service importada pela camada de UI',
      violacoes,
      'a tela chamando o service direto pula a camada de hooks: perde estado de carregamento e de erro padronizados, perde invalidacao de cache, e o acesso a dados fica espalhado por N telas em vez de um lugar. Foi o caso de login/register/saude/perfil ate a T-4.',
      "crie (ou reaproveite) o hook em `src/hooks/` e importe dele. Se o que voce precisa e so o TIPO, use `import type { X } from ...` - isso e permitido e nao conta como violacao.",
    );
  });

  it('todo item da allowlist tem razao escrita e aponta para arquivo que existe', () => {
    for (const item of ALLOWLIST_SERVICES) {
      expect(item.razao.trim().length).toBeGreaterThan(30);
      expect(fs.existsSync(path.join(RAIZ_REPO, item.arquivo))).toBe(true);
    }
  });

  it('sentinela: pega funcao e default, ignora import de tipo e side-effect', () => {
    const funcao = "import { getVacinas } from '../../../services/vacinas.service';";
    const alias  = "import { queryClient } from '@services/queryClient';";
    const tipo   = "import type { Pet } from '../../services/pets.service';";
    const tipoInline = "import { type Pet } from '../../services/pets.service';";
    const efeito = "import '../../services/algum.fx';";
    const outroDir = "import { algo } from '../../hooks/useAlgo';";
    expect(importsDeFuncaoDeService(parsear('f.tsx', funcao))).toHaveLength(1);
    expect(importsDeFuncaoDeService(parsear('f.tsx', alias))).toHaveLength(1);
    expect(importsDeFuncaoDeService(parsear('f.tsx', tipo))).toHaveLength(0);
    expect(importsDeFuncaoDeService(parsear('f.tsx', tipoInline))).toHaveLength(0);
    expect(importsDeFuncaoDeService(parsear('f.tsx', efeito))).toHaveLength(0);
    expect(importsDeFuncaoDeService(parsear('f.tsx', outroDir))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// REGRA 8 (T-5) — a ordem de import de notifications.service.ts é load-bearing
//
// O filtro de avisos do Expo Go (`silenciarAvisosPushExpoGo.fx`) só alcança os 2
// avisos de push porque eles são emitidos na AVALIAÇÃO de `expo-notifications`, e
// imports são avaliados na ordem em que aparecem. Se um formatador ou um "organize
// imports" reordenar alfabeticamente, o fix morre — em silêncio, com a suite
// verde, porque nenhum outro teste observa a ordem. Uma versão anterior passou nos
// testes e falhou em runtime exatamente assim.
//
// Esta regra não julga estilo: ela afirma UMA relação de ordem, no único arquivo do
// app que importa `expo-notifications`.
// ---------------------------------------------------------------------------
const SERVICE_NOTIF = 'src/services/notifications.service.ts';
const FX_SILENCIAR = '../utils/silenciarAvisosPushExpoGo.fx';
const MODULO_NOTIF = 'expo-notifications';

/** Índices (0-based) do 1º import de cada módulo; -1 quando ausente. */
function ordemDeImports(sf: ts.SourceFile): { fx: number; notif: number; total: number } {
  const modulos: string[] = [];
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    modulos.push(stmt.moduleSpecifier.text);
  }
  return { fx: modulos.indexOf(FX_SILENCIAR), notif: modulos.indexOf(MODULO_NOTIF), total: modulos.length };
}

describe('GATE F09 - regra 8 - o silenciador de avisos vem antes de expo-notifications', () => {
  const alvo = path.join(RAIZ_REPO, SERVICE_NOTIF);

  it('o arquivo alvo existe e continua sendo o unico que importa expo-notifications', () => {
    expect(fs.existsSync(alvo)).toBe(true);
    const importadores = listarRecursivo(DIR_SRC, ['.ts', '.tsx'])
      .filter((a) => !rel(a).startsWith(PREFIXO_TESTES))
      .filter((a) => ordemDeImports(parsear(a)).notif >= 0)
      .map(rel);
    // Se aparecer um segundo importador, esta regra deixa de cobrir o caminho
    // real e precisa ser ampliada - por isso a assercao e de igualdade.
    expect(importadores).toEqual([SERVICE_NOTIF]);
  });

  it('o import do silenciador e o PRIMEIRO do arquivo, antes de expo-notifications', () => {
    const { fx, notif } = ordemDeImports(parsear(alvo));
    const violacoes: string[] = [];
    if (fx !== 0) violacoes.push(`${SERVICE_NOTIF} - o silenciador esta na posicao ${fx}, deveria ser a 0`);
    if (notif >= 0 && fx > notif) violacoes.push(`${SERVICE_NOTIF} - expo-notifications (pos ${notif}) e avaliado ANTES do silenciador (pos ${fx})`);
    falhar(
      'REGRA 8 - ordem de import quebrada em notifications.service.ts',
      violacoes,
      'os 2 avisos de push do Expo Go sao emitidos na avaliacao de `expo-notifications`, e imports sao avaliados na ordem em que aparecem. Com o silenciador depois, o filtro e instalado tarde demais e os avisos voltam - sem nenhum teste ficar vermelho, porque nada mais observa a ordem.',
      "devolva o import de '../utils/silenciarAvisosPushExpoGo.fx' para a PRIMEIRA linha de import do arquivo, antes de 'expo-notifications'. Se o seu editor reordenou, desligue o organize-imports automatico neste arquivo.",
    );
  });

  it('sentinela: o detector reprova a ordem trocada e aprova a correta', () => {
    const correto = `import '${FX_SILENCIAR}';\nimport * as N from '${MODULO_NOTIF}';\nexport const x = 1;`;
    const trocado = `import * as N from '${MODULO_NOTIF}';\nimport '${FX_SILENCIAR}';\nexport const x = 1;`;
    const semFx = `import * as N from '${MODULO_NOTIF}';\nexport const x = 1;`;
    expect(ordemDeImports(parsear('f.ts', correto))).toMatchObject({ fx: 0, notif: 1 });
    const t = ordemDeImports(parsear('f.ts', trocado));
    expect(t.fx).toBe(1);
    expect(t.fx > t.notif).toBe(true);
    expect(ordemDeImports(parsear('f.ts', semFx)).fx).toBe(-1);
  });
});
