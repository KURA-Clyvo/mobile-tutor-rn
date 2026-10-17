// BR-TUT-T09 — detector estático de alvo de toque (>= touchTarget.min), role e Dynamic Type.
// Padrão da clínica (`mobile-clinica-rn/src/a11y/discoverInteractiveTouchables.ts` + `tests/touch-target-area.test.ts`,
// BR-CLI-T05, main@8e721ee, conferido em 2026-10-17) — aqui SIMPLIFICADO: uma regra por tocável, sem registry à mão.
// A lista de tocáveis é derivada do código (AST), nunca escrita à mão (regra de ouro v7).
//
// O que cada tocável (Pressable/Touchable*) precisa: (1) `accessibilityRole`/`role` literal e != 'none'; (2) no `style`,
// ALTURA e LARGURA declaradas >= 44 (literal ou `touchTarget.min`; largura também vale `flex`/`'100%'`/`alignSelf:'stretch'`);
// (3) NENHUMA dimensão literal < 44 em QUALQUER ramo do style (ternário, array, função de `pressed`, `styles.x`).
// `hitSlop` NÃO conta: no web ele não aumenta a caixa do DOM (achado da G2 da T05 da clínica) e o gate mede o que o DOM mede.
// Escape explícito: `accessible={false}` (fundo/scrim decorativo, fora da árvore de acessibilidade).
//
// PONTOS CEGOS declarados (o que este gate NÃO vê — a sonda de DOM `scripts/shots/br-tut-t09-sonda.mjs` cobre o renderizado):
//  - tamanho vindo de variável/parâmetro/prop (`style={estilo}`, `StyleSheet.flatten`) ou de outro arquivo: sem evidência
//    REPROVA (falha segura), mas um número escondido atrás de chamada de função não é lido;
//  - "declarado" não é "renderizado": o `minHeight` garante o piso, não o teto, e não prova que o pai não corta o filho;
//  - `styles.x` resolve por NOME do objeto-de-estilo + chave dentro do mesmo arquivo; dois objetos de mesmo nome em escopos
//    diferentes colidem (vale o último);
//  - componente custom (`<KCard onPress>`, `<PetListCard>`) só é conferido por dentro (o `Pressable` dele);
//  - `<KButton>`: o tamanho vem do primitivo (conferido em `KButton.test.tsx`); no ponto de uso só se barra dimensão < 44;
//  - `Switch` só pode existir em `KSwitchRow.tsx`; nada é dito sobre `TextInput` (a sonda de DOM mede os inputs).
import * as ts from 'typescript';

export const MIN = 44;
export type Achado = { arquivo: string; linha: number; regra: string; detalhe: string };

const TOCAVEIS = new Set(['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'TouchableNativeFeedback']);
const NAO_TOCAVEIS_COM_ONPRESS = new Set(['View', 'Text', 'Image', 'ImageBackground', 'ScrollView']);
const COM_PRIMITIVO_DE_TAMANHO = new Set(['KButton']);
const DIM_ALTURA = new Set(['height', 'minHeight']);
const DIM_LARGURA = new Set(['width', 'minWidth']);

type Dim = { prop: string; num: number | null; token: boolean };
type Estilos = Map<string, ts.ObjectLiteralExpression>;

function atributo(n: ts.JsxOpeningLikeElement, nome: string): ts.JsxAttribute | undefined {
  for (const a of n.attributes.properties) if (ts.isJsxAttribute(a) && a.name.getText() === nome) return a;
  return undefined;
}

function textoInit(a: ts.JsxAttribute): string {
  const i = a.initializer;
  if (!i) return 'true';
  if (ts.isJsxExpression(i)) return i.expression ? i.expression.getText() : '';
  return i.getText().replace(/^["']|["']$/g, '');
}

function nomeProp(p: ts.PropertyAssignment): string {
  return p.name.getText().replace(/['"]/g, '');
}

function mapaDeEstilos(sf: ts.SourceFile): Estilos {
  const m: Estilos = new Map();
  const visit = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      let init: ts.Expression = n.initializer;
      const arg0 = ts.isCallExpression(init) ? init.arguments[0] : undefined;
      if (ts.isCallExpression(init) && /StyleSheet\.create$/.test(init.expression.getText()) && arg0) init = arg0;
      if (ts.isObjectLiteralExpression(init)) m.set(n.name.text, init);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return m;
}

function objetosDoStyle(e: ts.Expression, mapa: Estilos, out: ts.ObjectLiteralExpression[], vistos = new Set<ts.Node>()): void {
  if (vistos.has(e)) return;
  vistos.add(e);
  if (ts.isParenthesizedExpression(e)) return objetosDoStyle(e.expression, mapa, out, vistos);
  if (ts.isObjectLiteralExpression(e)) {
    out.push(e);
    for (const p of e.properties) if (ts.isSpreadAssignment(p)) objetosDoStyle(p.expression, mapa, out, vistos);
    return;
  }
  if (ts.isArrayLiteralExpression(e)) {
    e.elements.forEach((x) => objetosDoStyle(x, mapa, out, vistos));
    return;
  }
  if (ts.isConditionalExpression(e)) {
    objetosDoStyle(e.whenTrue, mapa, out, vistos);
    objetosDoStyle(e.whenFalse, mapa, out, vistos);
    return;
  }
  if (ts.isBinaryExpression(e)) {
    objetosDoStyle(e.right, mapa, out, vistos);
    const k = e.operatorToken.kind;
    if (k === ts.SyntaxKind.BarBarToken || k === ts.SyntaxKind.QuestionQuestionToken) objetosDoStyle(e.left, mapa, out, vistos);
    return;
  }
  if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) {
    if (ts.isBlock(e.body)) e.body.forEachChild((s) => { if (ts.isReturnStatement(s) && s.expression) objetosDoStyle(s.expression, mapa, out, vistos); });
    else objetosDoStyle(e.body, mapa, out, vistos);
    return;
  }
  if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression)) {
    const o = mapa.get(e.expression.text);
    const prop = o?.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && nomeProp(p) === e.name.text);
    if (prop) objetosDoStyle(prop.initializer, mapa, out, vistos);
    return;
  }
  if (ts.isIdentifier(e)) {
    const o = mapa.get(e.text);
    if (o) objetosDoStyle(o, mapa, out, vistos);
  }
}

function dimensoes(objs: ts.ObjectLiteralExpression[]): { dims: Dim[]; fillLargura: boolean } {
  const dims: Dim[] = [];
  let fillLargura = false;
  for (const o of objs) {
    for (const p of o.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const nome = nomeProp(p);
      const v = p.initializer;
      const t = v.getText();
      if (nome === 'flex' || (nome === 'alignSelf' && /stretch/.test(t))) fillLargura = true;
      if (nome === 'width' && /^['"]100%['"]$/.test(t)) fillLargura = true;
      if (!DIM_ALTURA.has(nome) && !DIM_LARGURA.has(nome)) continue;
      if (ts.isNumericLiteral(v)) dims.push({ prop: nome, num: Number(v.text), token: false });
      else if (/touchTarget\.min/.test(t)) dims.push({ prop: nome, num: null, token: true });
      else dims.push({ prop: nome, num: null, token: false });
    }
  }
  return { dims, fillLargura };
}

const ok44 = (d: Dim) => d.token || (d.num !== null && d.num >= MIN);

export function escanear(codigo: string, arquivo: string): Achado[] {
  const sf = ts.createSourceFile(arquivo, codigo, ts.ScriptTarget.Latest, true, arquivo.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const mapa = mapaDeEstilos(sf);
  const achados: Achado[] = [];
  const add = (n: ts.Node, regra: string, detalhe: string) =>
    achados.push({ arquivo, linha: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, regra, detalhe });

  const conferirEstilo = (n: ts.JsxOpeningLikeElement, tag: string, exigeEvidencia: boolean) => {
    const a = atributo(n, 'style');
    const objs: ts.ObjectLiteralExpression[] = [];
    if (a?.initializer && ts.isJsxExpression(a.initializer) && a.initializer.expression) objetosDoStyle(a.initializer.expression, mapa, objs);
    const { dims, fillLargura } = dimensoes(objs);
    for (const d of dims) if (d.num !== null && d.num < MIN) add(n, 'alvo-pequeno', `<${tag}> declara ${d.prop}: ${d.num} (< ${MIN})`);
    if (!exigeEvidencia) return;
    if (!dims.some((d) => DIM_ALTURA.has(d.prop) && ok44(d))) add(n, 'sem-altura', `<${tag}> sem minHeight/height >= ${MIN} (literal ou touchTarget.min) no style`);
    if (!fillLargura && !dims.some((d) => DIM_LARGURA.has(d.prop) && ok44(d))) add(n, 'sem-largura', `<${tag}> sem minWidth/width >= ${MIN} (literal ou touchTarget.min), flex ou '100%' no style`);
  };

  const visit = (n: ts.Node) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText();
      const acc = atributo(n, 'accessible');
      const decorativo = !!acc && textoInit(acc) === 'false';
      if (TOCAVEIS.has(tag) && !decorativo) {
        const r = atributo(n, 'accessibilityRole') ?? atributo(n, 'role');
        const v = r ? textoInit(r).replace(/^['"]|['"]$/g, '') : '';
        if (!r || v === '' || v === 'none' || v === 'undefined') add(n, 'sem-role', `<${tag}> sem accessibilityRole (ou 'none')`);
        conferirEstilo(n, tag, true);
      } else if (COM_PRIMITIVO_DE_TAMANHO.has(tag)) {
        conferirEstilo(n, tag, false);
      }
      if (NAO_TOCAVEIS_COM_ONPRESS.has(tag) && atributo(n, 'onPress')) add(n, 'onpress-fora-de-tocavel', `<${tag} onPress> não é tocável acessível: use Pressable com role`);
      if (tag === 'Switch' && !/KSwitchRow\.tsx$/.test(arquivo)) add(n, 'switch-solto', '<Switch> só em KSwitchRow.tsx (40×20 no web, sem hitSlop)');
      const f = atributo(n, 'allowFontScaling');
      if (f && textoInit(f) !== 'true') add(n, 'font-scaling', `allowFontScaling={${textoInit(f)}} desliga Dynamic Type`);
      const m = atributo(n, 'maxFontSizeMultiplier');
      if (m && Number(textoInit(m)) < 2) add(n, 'font-scaling', `maxFontSizeMultiplier=${textoInit(m)} (< 2) limita Dynamic Type`);
    }
    if (ts.isPropertyAssignment(n) && n.name.getText() === 'allowFontScaling' && n.initializer.kind === ts.SyntaxKind.FalseKeyword) add(n, 'font-scaling', 'allowFontScaling: false');
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && /allowFontScaling$/.test(n.left.getText()) && n.right.kind === ts.SyntaxKind.FalseKeyword) add(n, 'font-scaling', 'defaultProps.allowFontScaling = false');
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return achados;
}
