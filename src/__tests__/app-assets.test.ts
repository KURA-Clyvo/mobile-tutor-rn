// `app.json` referenciava 5 caminhos em `assets/` e o diretório NUNCA existiu — nem no
// working tree, nem em ponto nenhum do histórico (`git log -- assets` vazio). Nada no
// projeto detectava isso: `tsc`, `eslint` e a suíte inteira passavam verdes, porque
// nenhum deles lê `app.json`. Quem quebra é `expo prebuild`/EAS Build, longe daqui.
//
// O teste deriva a lista do PRÓPRIO `app.json` em vez de conferir 4 nomes fixos: é o que
// faz ele continuar mordendo quando alguém adicionar um asset novo (um `notification.icon`,
// um ícone de plugin) em vez de virar uma lista congelada que envelhece em silêncio.
import fs from 'fs';
import path from 'path';

const RAIZ = path.join(__dirname, '..', '..');
const appJson = JSON.parse(fs.readFileSync(path.join(RAIZ, 'app.json'), 'utf8'));

/** Toda string do app.json que aponta para um arquivo local, com o caminho até ela. */
function caminhosDeArquivo(no: unknown, trilha: string[] = []): [string, string][] {
  if (typeof no === 'string') {
    return no.startsWith('./') ? [[trilha.join('.'), no]] : [];
  }
  if (Array.isArray(no)) {
    return no.flatMap((v, i) => caminhosDeArquivo(v, [...trilha, String(i)]));
  }
  if (no && typeof no === 'object') {
    return Object.entries(no).flatMap(([k, v]) => caminhosDeArquivo(v, [...trilha, k]));
  }
  return [];
}

const referencias = caminhosDeArquivo(appJson);

describe('app.json — assets referenciados', () => {
  it('encontra pelo menos os 4 assets de marca (o teste não pode passar por lista vazia)', () => {
    expect(referencias.length).toBeGreaterThanOrEqual(4);
  });

  it.each(referencias)('%s → %s existe e é um PNG válido', (_chave, ref) => {
    const absoluto = path.join(RAIZ, ref);
    expect(fs.existsSync(absoluto)).toBe(true);

    // Assinatura PNG (\x89PNG\r\n\x1a\n): um arquivo vazio ou truncado passaria no
    // existsSync e quebraria só no bundler.
    const cabecalho = fs.readFileSync(absoluto).subarray(0, 8);
    expect([...cabecalho]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });
});
