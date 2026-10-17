// BR-TUT-T11 — higiene visual e de texto. Cada bloco nomeia a frente (F1..F10) e o achado que fecha.
import React from 'react';
import fs from 'fs';
import path from 'path';
import { Switch } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { lightColors, darkColors } from '../theme/tokens';
import { KIcon } from '../components/primitives/KIcon';
import { KPetPortrait } from '../components/primitives/KPetPortrait';
import { KSwitchRow } from '../components/primitives/KSwitchRow';
import { AlertaBanner } from '../components/domain/AlertaBanner';
import { PetListCard } from '../components/domain/PetListCard';
import { VacinaItem } from '../components/domain/VacinaItem';
import { useAuthStore } from '../store/authStore';
import { mapVacinaDto } from '../utils/mappers';
import { PETS } from '../mocks/pets.mock';
import { Kicker } from '../components/primitives/Kicker';
import type { PetDomain } from '../types/domain';

const SRC = path.join(__dirname, '..');
const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

function arquivos(dir: string, exts: string[], acc: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '__tests__') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) arquivos(p, exts, acc);
    else if (exts.some(x => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}
// Tira comentários (bloco e linha) — emoji/termo em COMENTÁRIO não é texto de UI. Linha: só `//` precedido de espaço/início
// (não corta `https://`). ponytail: heurística de regex, não parser; vale para este gate, não como lexer geral.
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const EMOJI = /\p{Extended_Pictographic}/u;
const achaEmoji = (txt: string) => EMOJI.test(semComentarios(txt).replace(/[©®™]/g, ''));

describe('F2 BR-TUT-15 — nenhum emoji na UI (src/**/*.ts(x), fora de testes)', () => {
  it('controle positivo: o detector acha um emoji-isca em string, e ignora emoji em comentário', () => {
    expect(achaEmoji("const x = '🐶';")).toBe(true);
    expect(achaEmoji('<Text>✨ Câmera</Text>')).toBe(true);
    expect(achaEmoji('<Text>⚠ Retorno</Text>')).toBe(true);
    expect(achaEmoji('// 🔴 comentário\nconst x = 1;')).toBe(false);
  });
  it('0 arquivos com emoji', () => {
    const achados = arquivos(SRC, ['.ts', '.tsx']).filter(f => achaEmoji(fs.readFileSync(f, 'utf8'))).map(f => path.relative(SRC, f));
    expect(achados).toEqual([]);
  });
  it('retrato de pet sem foto não escreve emoji (todos os tiers e paletas)', () => {
    for (const tier of ['emoji', 'photo', 'detected'] as const) {
      const r = render(<KPetPortrait palette="lab" tier={tier} badge="sparkle" />, { wrapper: W });
      expect(JSON.stringify(r.toJSON())).not.toMatch(EMOJI);
    }
  });
});

describe('F2 — PetListCard com a câmera da Luna: selo por ícone, sem emoji', () => {
  const pet: PetDomain = {
    id: 3, nome: 'Thor', especie: 'Cão', raca: 'SRD', nascimento: new Date('2023-01-15'), sexo: 'M', porte: 'M',
    nmClinica: 'KURA', statusGeral: 'ALERTA', alertasAtivos: 1, idadeAnos: 3, nrConsultas: 2,
    chips: [{ tone: 'amber', label: 'Câmera Luna' }],
  };
  it('o selo aparece (KIcon dentro do retrato) e a árvore não tem emoji', () => {
    const r = render(<PetListCard pet={pet} onPress={jest.fn()} />, { wrapper: W });
    expect(JSON.stringify(r.toJSON())).not.toMatch(EMOJI);
    const selo = r.getByTestId('k-pet-portrait-selo');
    expect(selo.findAll(n => n.type === (KIcon as any)).length).toBe(1);
  });
  it('sem o chip da câmera não há selo', () => {
    const r = render(<PetListCard pet={{ ...pet, chips: [] }} onPress={jest.fn()} />, { wrapper: W });
    expect(r.queryByTestId('k-pet-portrait-selo')).toBeNull();
  });
});

describe('F1 BR-TUT-14 — kicker com função, sem numeração decorativa', () => {
  it('Kicker: caixa alta, filete e papel de título', () => {
    const r = render(<Kicker>Imunização</Kicker>, { wrapper: W });
    expect(r.getByText('IMUNIZAÇÃO')).toBeTruthy();
    expect(r.getByRole('header')).toBeTruthy();
  });
  it('nenhum rótulo "NN · TEXTO" no código de tela', () => {
    const NUM = /(^|[^\d])0\d · [A-ZÀ-Ú]/m;
    expect(NUM.test('            01 · PRÓXIMA AÇÃO')).toBe(true); // controle positivo
    const achados = arquivos(SRC, ['.tsx']).filter(f => NUM.test(semComentarios(fs.readFileSync(f, 'utf8')))).map(f => path.relative(SRC, f));
    expect(achados).toEqual([]);
  });
});

describe('F3 BR-TUT-16 — AlertaBanner sem barra lateral; revogado em chip neutro', () => {
  const planos = (s: any): Record<string, unknown> => Object.assign({}, ...[s].flat(5).filter(Boolean));
  it.each(['clay', 'amber'] as const)('tom %s: o banner não tem borda lateral grossa', tone => {
    const r = render(<AlertaBanner title="t" subtitle="s" tone={tone} />, { wrapper: W });
    const st = planos(r.getByTestId(`alerta-${tone}`).props.style);
    expect(st.borderLeftWidth).toBeUndefined();
    expect(st.borderWidth).toBe(1);
  });
  it('"Atenção" usa amberInk e "Urgente" usa clayInk (cores distintas)', () => {
    const a = render(<AlertaBanner title="Atenção" subtitle="s" tone="amber" />, { wrapper: W });
    const u = render(<AlertaBanner title="Urgente" subtitle="s" tone="clay" />, { wrapper: W });
    expect(planos(a.getByText('Atenção').props.style).color).toBe(lightColors.amberInk);
    expect(planos(u.getByText('Urgente').props.style).color).toBe(lightColors.clayInk);
    expect(lightColors.amberInk).not.toBe(lightColors.clayInk);
  });
});

describe('F3 — "Revogado em" é chip neutro (mute), não texto solto', () => {
  it('a linha revogada renderiza um chip com a cor textSoft sobre surface2', () => {
    const fonte = fs.readFileSync(path.join(SRC, 'app/(tabs)/perfil/consentimentos.tsx'), 'utf8');
    expect(fonte).toMatch(/<KChip tone="mute">\{status\.texto\}<\/KChip>/);
  });
});

describe('F4 BR-TUT-17 — vocabulário: "teleorientação", nunca "telemedicina"/"teleconsulta" em texto de UI', () => {
  const TERMO = /(?<![A-Za-z])(telemedicina|teleconsulta)/i;
  it('controle positivo', () => {
    expect(TERMO.test("label: 'Telemedicina 3'")).toBe(true);
    expect(TERMO.test('Entrar na teleconsulta')).toBe(true);
    expect(TERMO.test('const podeEntrarNaTeleconsulta = 1')).toBe(false); // identificador interno fica
  });
  it('0 ocorrências em strings/JSX (identificadores e comentários ficam)', () => {
    const achados = arquivos(SRC, ['.ts', '.tsx'])
      .filter(f => !f.includes(`${path.sep}smokeCoverage${path.sep}`)) // chave de inventário de rotas, não texto de UI
      .filter(f => TERMO.test(semComentarios(fs.readFileSync(f, 'utf8')))).map(f => path.relative(SRC, f));
    expect(achados).toEqual([]);
  });
});

describe('F5 BR-TUT-18 — Perfil: ícones semânticos e polegar por token', () => {
  it('e-mail = mail, telefone = phone, modo escuro = moon; a lupa/sino/pulso não ficam trocados', () => {
    const fonte = fs.readFileSync(path.join(SRC, 'app/(tabs)/perfil/index.tsx'), 'utf8');
    expect(fonte).toMatch(/label: 'E-mail',[^\n]*icon: 'mail'/);
    expect(fonte).toMatch(/label: 'Telefone',[^\n]*icon: 'phone'/);
    expect(fonte).toMatch(/<KIcon name="moon"[^\n]*\/>\s*<Text[^\n]*>Modo escuro/);
  });
  it.each([['claro', lightColors, 'light'], ['escuro', darkColors, 'dark']] as const)(
    'polegar do switch ligado vem de token (%s)', (_n, paleta, modo) => {
      useAuthStore.setState({ themeOverride: modo as 'light' | 'dark' });
      const r = render(<KSwitchRow value onValueChange={jest.fn()} accessibilityLabel="x" testID="sw"><></></KSwitchRow>, { wrapper: W });
      const sw = r.UNSAFE_getByType(Switch);
      expect(sw.props.thumbColor).toBe(paleta.bgElev);
      expect(sw.props.activeThumbColor).toBe(paleta.bgElev);
      expect(sw.props.trackColor.true).toBe(paleta.primary);
      useAuthStore.setState({ themeOverride: null });
    },
  );
  it('ícones novos existem no KIcon', () => {
    for (const name of ['mail', 'phone', 'moon', 'sparkle'] as const) {
      const r = render(<KIcon name={name} />, { wrapper: W });
      expect(r.toJSON()).toBeTruthy();
    }
  });
});

describe('F7 B-4 — nenhum pet de mock/seed se chama "Luna" (Luna é a assistente)', () => {
  it('pets.mock e os demais mocks', () => {
    expect(PETS.map(p => p.nmPet)).not.toContain('Luna');
    const NOME = /(nmPet|nome|nmPaciente)\s*:\s*['"]Luna['"]/;
    expect(NOME.test("pet: { nmPet: 'Luna' }")).toBe(true); // controle positivo
    const achados = arquivos(path.join(SRC, 'mocks'), ['.ts']).filter(f => NOME.test(fs.readFileSync(f, 'utf8')) || /da Luna\b/.test(fs.readFileSync(f, 'utf8').replace(/Luna grava|que a Luna/g, ''))).map(f => path.relative(SRC, f));
    expect(achados).toEqual([]);
  });
});

describe('F8 m-a — a view não tem data de aplicação: o mapper não a inventa', () => {
  const raw = { idPet: 1, nmPet: 'Bóbi', nmVacina: 'V10', dtProximaDose: '2026-11-01', nmClinica: 'KURA' } as any;
  it('mapVacinaDto deixa dtAplicacao ausente e a classificação segue pela próxima dose', () => {
    const v = mapVacinaDto(raw);
    expect(v.dtAplicacao).toBeUndefined();
    expect(v.dtProximaDose).toBe('2026-11-01');
    expect(v.sgStatus).not.toBe('SEM_DATA');
  });
  it('VacinaItem do mapper não mostra "Aplicada em"; com data de aplicação real, mostra', () => {
    const a = render(<VacinaItem vacina={mapVacinaDto(raw)} />, { wrapper: W });
    expect(a.queryByText(/Aplicada em/)).toBeNull();
    const b = render(<VacinaItem vacina={{ ...mapVacinaDto(raw), dtAplicacao: '2026-11-01' }} />, { wrapper: W });
    expect(b.getByText(/Aplicada em/)).toBeTruthy(); // mesmo dia da próxima dose: a heurística "≠" escondia isto
  });
});

describe('F8 m-b — singular na lista de pets', () => {
  it('"1 PET" (não "1 PETS")', () => {
    const fonte = fs.readFileSync(path.join(SRC, 'app/(tabs)/pets/index.tsx'), 'utf8');
    expect(fonte).not.toMatch(/\$\{pets\.length\} PETS/);
    expect(fonte).toMatch(/PET\$\{pets\.length === 1 \? '' : 'S'\}/);
  });
});

describe('F6 BR-TUT-19 — cadastro com subtítulo próprio', () => {
  it('o subtítulo não é o do Novo pet', () => {
    const fonte = fs.readFileSync(path.join(SRC, 'app/register.tsx'), 'utf8');
    expect(fonte).not.toMatch(/Quanto mais detalhes/);
    expect(fonte).toMatch(/Com a conta você acompanha as vacinas e os horários dos seus pets\./);
  });
});
