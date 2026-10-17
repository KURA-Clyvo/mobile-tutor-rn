// BR-TUT-G4 I-2: o RN-web 0.21.2 ignora `accessibilityState`; sem `aria-checked`/`aria-selected` explícito o DOM
// fica sem o atributo (leitor de tela não ouve o estado). Todo `accessibilityState={{ selected|checked: X }}` em
// src/ precisa do `aria-…={X}` logo na linha seguinte (padrão do KSwitchRow). Limite: lê o texto do fonte.
import fs from 'node:fs';
import path from 'node:path';

function arquivos(d: string): string[] {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === '__tests__' ? [] : arquivos(path.join(d, e.name))) : /\.tsx$/.test(e.name) ? [path.join(d, e.name)] : []);
}

export function semAria(src: string): string[] {
  const linhas = src.split(/\r?\n/);
  const out: string[] = [];
  linhas.forEach((l, i) => {
    const m = /accessibilityState=\{\{\s*(selected|checked):\s*([^}]+?)\s*\}\}/.exec(l);
    if (!m) return;
    const esperado = `aria-${m[1]}={${m[2]}}`;
    if (!(linhas[i + 1] ?? '').includes(esperado)) out.push(`${i + 1}: falta ${esperado}`);
  });
  return out;
}

describe('aria-checked / aria-selected explícitos', () => {
  it('nenhum arquivo de src/ declara o estado só por accessibilityState', () => {
    const achados = arquivos(path.join(__dirname, '..')).flatMap((f) => semAria(fs.readFileSync(f, 'utf8')).map((a) => `${path.relative(__dirname, f)}:${a}`));
    expect(achados).toEqual([]);
  });
  it('controle positivo: o detector enxerga a falta', () => {
    expect(semAria('<P\n accessibilityState={{ selected: active }}\n>')).toHaveLength(1);
    expect(semAria('<P\n accessibilityState={{ selected: active }}\n aria-selected={active}\n>')).toEqual([]);
  });
});
