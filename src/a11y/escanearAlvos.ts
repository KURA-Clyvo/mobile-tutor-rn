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
// Também REPROVA (G2 da T09, I-1): role literal fora do conjunto de roles de controle (ex.: "text" num tocável), role
// `undefined`/`null` explícito (`accessibilityRole={undefined}`, ternário com `undefined`) e `accessibilityLabel` vazio.
//
// PONTOS CEGOS declarados — o que este gate NÃO vê. Cada um tem uma ISCA DE LIMITE em `a11y-alvos-gate.test.tsx`
// (o gate APROVA a isca; o teste trava essa aprovação, para a cegueira ficar declarada e um conserto futuro aparecer).
// Medido pela G2 (`br-tut-t09-revisao.md` R2); 0 instância real hoje em `src/` (inventário por AST):
//  - 🔴 A "falha segura" de tamanho vale SÓ quando o style é 100% opaco. Basta UM objeto `{ minHeight: 44, minWidth: 44 }`
//    no array e qualquer parte POSTERIOR não resolvida é ignorada em silêncio (e é ela que vence no render):
//    `[{minHeight:44,minWidth:44}, props.style]`, `..., estilosExternos.x`, `..., { minHeight: PEQUENO }` (constante),
//    `..., StyleSheet.flatten({...})`, `return { minHeight: 20 }` dentro de `if` na função de `pressed`;
//  - `/touchTarget\.min/` aceita QUALQUER expressão com o token (`touchTarget.min - 14`, `touchTarget.min / 2`);
//  - `flex: 0` conta como "preenche a largura" (qualquer `flex`);
//  - `Pressable` por alias (`import { Pressable as P }`, `const P = Pressable`), namespace (`<RN.Pressable>`) ou
//    `Animated.createAnimatedComponent(Pressable)` não é tocável para o gate;
//  - componente custom (`<MeuBotao style onPress>`, `<KCard onPress style>`, `<KSwitchRow style>`) só é conferido por dentro
//    (o `Pressable` dele); no ponto de uso só o `<KButton>` tem dimensão literal < 44 barrada. O piso dos primitivos é
//    garantido por teste (`A11yFixWave.test.tsx`, `pisoDeAlvo`), não por este gate;
//  - `onPress`/`onLongPress`/`onPressIn`/`onPressOut` fora de `View/Text/Image/ImageBackground/ScrollView`
//    (`Animated.View`, `KIcon`...) e `onLongPress`/`onPressIn` em qualquer tag não são vistos;
//  - role/rótulo por variável ou ternário sem `undefined`/`null` (`accessibilityRole={papel}`) não são lidos;
//  - `accessible={false}` isenta tamanho, role e rótulo de um botão REAL (só os 2 scrims o usam hoje; o `tabIndex` deles é
//    travado em teste, não aqui);
//  - spread de props (`{...props}`) que traga role/style não é lido (sem role no JSX explícito reprova: falha segura);
//  - `Text maxFontSizeMultiplier={expr}` por variável não é lido (só literal < 2 reprova);
//  - "declarado" não é "renderizado": o `minHeight` garante o piso, não o teto, nem que o pai não corta o filho (a sonda de
//    DOM `scripts/shots/br-tut-t09-sonda.mjs` cobre o renderizado);
//  - `styles.x` resolve por NOME do objeto-de-estilo + chave no mesmo arquivo; dois objetos de mesmo nome em escopos
//    diferentes colidem (vale o último);
//  - `Switch` só pode existir em `KSwitchRow.tsx`; nada é dito sobre `TextInput` (a sonda de DOM mede os inputs).
import * as ts from 'typescript';

export const MIN = 44;
export type Achado = { arquivo: string; linha: number; regra: string; detalhe: string };

const TOCAVEIS = new Set(['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'TouchableNativeFeedback']);
const NAO_TOCAVEIS_COM_ONPRESS = new Set(['View', 'Text', 'Image', 'ImageBackground', 'ScrollView']);
// Roles que fazem sentido num tocável. `text`/`header`/`image`/`alert`... num `Pressable` com `onPress` anuncia o controle errado.
const ROLES_DE_CONTROLE = new Set(['button', 'link', 'switch', 'checkbox', 'radio', 'tab', 'menuitem', 'imagebutton', 'togglebutton', 'combobox', 'adjustable']);
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

/** Valor se o atributo é string literal (`"x"`, `{'x'}`, `` {`x`} `` sem interpolação); `null` se for expressão. */
function literalString(a: ts.JsxAttribute): string | null {
  const i = a.initializer;
  if (!i) return null;
  if (ts.isStringLiteral(i)) return i.text;
  if (ts.isJsxExpression(i) && i.expression && (ts.isStringLiteral(i.expression) || ts.isNoSubstitutionTemplateLiteral(i.expression))) return i.expression.text;
  return null;
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
        if (!r) add(n, 'sem-role', `<${tag}> sem accessibilityRole`);
        else {
          const lit = literalString(r);
          if (lit !== null) {
            if (lit === '' || lit === 'none') add(n, 'sem-role', `<${tag}> sem accessibilityRole (ou 'none')`);
            else if (!ROLES_DE_CONTROLE.has(lit)) add(n, 'role-invalido', `<${tag}> role "${lit}" não é de controle (${[...ROLES_DE_CONTROLE].join('|')})`);
          } else if (/\b(undefined|null)\b/.test(textoInit(r))) add(n, 'sem-role', `<${tag}> accessibilityRole ${textoInit(r)} pode ficar sem role`);
        }
        const rot = atributo(n, 'accessibilityLabel');
        if (rot && literalString(rot) === '') add(n, 'rotulo-vazio', `<${tag}> accessibilityLabel vazio (o leitor de tela diz só "botão")`);
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
