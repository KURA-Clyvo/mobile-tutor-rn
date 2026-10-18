// BR-TUT-G4 I-4: o itálico de marca saía em Roboto no Android (só `Cormorant_500Medium` era carregada e
// `fontStyle: 'italic'` não sintetiza a família). Agora é a família `Cormorant_500Medium_Italic`, via token.
// Limite: lê o texto do fonte (o glifo só a sonda no aparelho mede).
import fs from 'node:fs';
import path from 'node:path';
import { fonts } from '../theme/tokens';

const SRC = path.join(__dirname, '..');
const lista = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === '__tests__' ? [] : lista(path.join(d, e.name))) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []);

describe('itálico de marca', () => {
  it('o token existe e a raiz carrega a fonte', () => {
    expect(fonts.displayItalic).toBe('Cormorant_500Medium_Italic');
    const raiz = fs.readFileSync(path.join(SRC, 'app', '_layout.tsx'), 'utf8');
    expect(raiz).toMatch(/useFonts\(\{[^}]*Cormorant_500Medium_Italic[^}]*\}\)/);
    expect(raiz).toMatch(/import \{[^}]*Cormorant_500Medium_Italic[^}]*\} from '@expo-google-fonts\/cormorant'/);
  });
  it('nenhum fontStyle italic solto em src/', () => {
    const soltos = lista(SRC).filter((f) => /fontStyle:\s*['"]italic['"]/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(SRC, f));
    expect(soltos).toEqual([]);
  });
  it('os 10 títulos com destaque usam o token', () => {
    const usam = lista(SRC).filter((f) => /fonts\.displayItalic/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(SRC, f).split(path.sep).join('/'));
    expect(usam.sort()).toEqual([
      'app/(tabs)/agenda/index.tsx', 'app/(tabs)/loja/index.tsx', 'app/(tabs)/perfil/consentimentos.tsx', 'app/(tabs)/pets/index.tsx', 'app/(tabs)/pets/novo.tsx',
      'app/(tabs)/saude/index.tsx', 'app/login.tsx', 'app/register.tsx', 'components/domain/ConsultasTab.tsx', 'components/domain/VacinasTab.tsx',
    ]);
  });
});
