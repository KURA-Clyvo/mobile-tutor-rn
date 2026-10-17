import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { join } from 'path';
import { lightColors, darkColors } from '../theme/tokens';

// BR-TUT-T02. ÂNCORA (regra 11): adaptado de mobile-clinica-rn `tests/assetsMarca.test.ts` linhas 1-57, commit
// 773ae66, conferido em 2026-10-15 (git -C mobile-clinica-rn show 773ae66:tests/assetsMarca.test.ts | sed -n '1,57p').
// Os PNG de `assets/` (que não existiam) são consequência de `scripts/gerar-assets.mjs` (forma lida do KuraMark.tsx, cores do
// tokens.ts). Duas travas: (1) hashes distintos e nenhum igual ao placeholder antigo;
// (2) o gerador em modo `--verificar` compara PIXELS (não bytes) com o que está em disco —
// editar o KuraMark/tokens sem regerar, ou trocar um PNG à mão, derruba aqui.
const RAIZ = join(__dirname, '..', '..');
const TIMEOUT_GERADOR_MS = 120_000;
const NOMES = ['icon.png', 'adaptive-icon.png', 'favicon.png', 'splash-icon.png', 'splash-icon-dark.png'];
const sha = (n: string) => createHash('sha256').update(readFileSync(join(RAIZ, 'assets', n))).digest('hex');

describe('assets de marca', () => {
  // o `it` do gerador pode gastar até o timeout do spawn; o do Jest tem que ser MAIOR, senão o aviso nunca chega
  jest.setTimeout(TIMEOUT_GERADOR_MS + 30_000);
  it('os PNG são todos distintos entre si (antes do BR-TUT-T02 `assets/` nem existia)', () => {
    const hashes = NOMES.map(sha);
    expect(new Set(hashes).size).toBe(NOMES.length);
  });

  it('gerar-assets --verificar: os PNG em disco batem com o que o gerador produz', () => {
    // BR-TUT-T11 (F10): sem `timeout` o spawnSync podia travar a suíte INTEIRA (2 vezes em 2026-10-17, sem reproduzir isolado: o
    // gerador roda em ~0,3 s e 12 em paralelo saem EXIT=0). Com timeout o teste FALHA com mensagem clara em vez de pendurar o Jest.
    // `stdin` ignorado: o filho nunca lê entrada. ponytail: causa-raiz do travamento NÃO achada; a trava limita o dano.
    const r = spawnSync(process.execPath, [join(RAIZ, 'scripts/gerar-assets.mjs'), '--verificar'], {
      cwd: RAIZ,
      encoding: 'utf8',
      timeout: TIMEOUT_GERADOR_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    expect(`${r.error?.message ?? ''}${r.signal ?? ''}`).toBe(''); // estourou o timeout (ETIMEDOUT/SIGTERM) ou nem iniciou
    expect(`${r.stdout}${r.stderr}`).toContain('assets em dia');
    expect(r.status).toBe(0);
  });

  it('o app.json aponta para os assets que existem', () => {
    const app = JSON.parse(readFileSync(join(RAIZ, 'app.json'), 'utf8')).expo;
    const caminhos = [
      app.icon,
      app.web.favicon,
      app.android.adaptiveIcon.foregroundImage,
      ...app.plugins.filter((p: unknown) => Array.isArray(p) && p[0] === 'expo-splash-screen').flatMap((p: any[]) => [p[1].image, p[1].dark.image]),
    ];
    expect(caminhos).toHaveLength(5);
    for (const c of caminhos) expect(() => readFileSync(join(RAIZ, c))).not.toThrow();
  });

  // M3 do G2: o app.json repete à mão 3 cores de token. O gerador lê o tokens.ts para os PNG, mas
  // nada conferia o app.json: mudar `bg` regenerava o PNG e deixava o fundo do splash nativo
  // diferente do `bg` da Abertura, em silêncio.
  it('as cores do app.json são as dos tokens (fundo do splash claro/Noite e fundo do ícone adaptativo)', () => {
    const app = JSON.parse(readFileSync(join(RAIZ, 'app.json'), 'utf8')).expo;
    const splash = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-splash-screen')[1];
    const igual = (a: string, b: string) => expect(a.toLowerCase()).toBe(b.toLowerCase());
    igual(splash.backgroundColor, lightColors.bg);
    igual(splash.dark.backgroundColor, darkColors.bg);
    igual(app.android.adaptiveIcon.backgroundColor, lightColors.bg);
  });
});
