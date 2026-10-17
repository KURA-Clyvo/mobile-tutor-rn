// ÂNCORA (regra 11): adaptado de mobile-clinica-rn `tests/queryStateCoverage.test.ts`, linhas 1-173, commit 773ae66, conferida
// em 2026-10-15:
//   git -C mobile-clinica-rn show 773ae66:tests/queryStateCoverage.test.ts | sed -n '1,173p'
// DIVERGÊNCIAS do tutor: (1) caminho `src/__tests__/` (RAIZ sobe 2 níveis); (2) contagens e hooks esperados do app do tutor;
// (3) a allowlist é travada por IGUALDADE com a lista exata (a clínica trava por razão e por hook proibido) — entrada nova é
// regressão, e a BR-TUT-T04 troca esta lista por `[]`; (4) iscas EXTRAS no formato real das 3 telas antigas (Saúde, perfil do
// pet, Consentimentos) e as 4 do brief (isError depois do dado em ternário, `if (isError) {` multilinha de Prettier,
// desestruturação renomeada, `?? 'OK'`); (5) bloco do default `?? 'OK'` sobre dado de servidor, com controle positivo.
//
// BR-TUT-T04 (2026-10-16): portado de mobile-clinica-rn `tests/queryStateCoverage.test.ts` @ 080b1aa
// (`git -C mobile-clinica-rn diff 773ae66 080b1aa -- tests/queryStateCoverage.test.ts`): `exigirPassa` (controle negativo exige a
// chamada contada) e o bloco "fix wave G2" inteiro (I1-I5, M1, M4 e as reproduções do maestro). Divergência: os controles de useQueries
// ganharam a guarda de dado da 080b1aa; a contagem do app real é a do tutor (>= 13 chamadas).
//
// BR-TUT-T03 — gate 2 (regra v7): roda o detector `scripts/check-query-state.mjs` sobre o app real (telas derivadas de
// src/app, hooks de dado derivados de src/hooks) e sobre ISCAS (controle positivo: o detector precisa enxergar a violação).
// Roda por processo filho porque o script é ESM puro (.mjs) e a suíte Jest é CJS.
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const RAIZ = path.join(__dirname, '..', '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'check-query-state.mjs');

type Resultado = {
  telas: string[];
  hooks: string[];
  chamadas: { tela: string; hook: string; ok: boolean; motivo?: string; allowlist?: boolean }[];
  violacoes: { tela: string; hook: string; motivo?: string }[];
};
function rodar(root: string): { status: number | null; r: Resultado } {
  const p = spawnSync(process.execPath, [SCRIPT, '--root', root, '--json'], { encoding: 'utf8' });
  return { status: p.status, r: JSON.parse(p.stdout) as Resultado };
}

const HOOK = [
  "import { useQuery } from '@tanstack/react-query';",
  'export function useCoisas() {',
  "  return useQuery({ queryKey: ['c'], queryFn: async () => [] });",
  '}',
  '',
].join('\n');

/** Monta uma árvore src/ falsa. `null` remove o arquivo-base src/hooks/useCoisa.ts. */
function montar(arquivos: Record<string, string | null>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qs-isca-'));
  for (const [rel, src] of Object.entries({ 'src/hooks/useCoisa.ts': HOOK, ...arquivos })) {
    if (src === null) continue;
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), src);
  }
  fs.mkdirSync(path.join(dir, 'src', 'app'), { recursive: true });
  return dir;
}
const montarIsca = (telaSrc: string) => montar({ 'src/app/tela.tsx': telaSrc });

// BR-TUT-T04 (porte do G2-M5 da clínica 080b1aa): controle negativo só vale se o detector CONTOU a chamada
// (um detector nulo também sai 0 sem violação).
function exigirPassa(dir: string) {
  const { status, r } = rodar(dir);
  expect(r.violacoes).toEqual([]);
  expect(r.chamadas.length).toBeGreaterThanOrEqual(1);
  expect(r.chamadas.every((c) => c.ok)).toBe(true);
  expect(status).toBe(0);
}

// A lista EXATA (BR-TUT-T04): só 1 entrada (a BR-TUT-T07 tirou `agenda/novo.tsx::usePets`); `useAgendamentoBadgeCount` é PERMANENTE
// (badge numérico: no erro o número some, não afirma "tudo certo"). Entrada nova é regressão.
const ALLOWLIST_EXATA = [
  'app/(tabs)/_layout.tsx::useAgendamentoBadgeCount',
];

describe('gate: tela que lê dado de servidor trata o erro (check-query-state)', () => {
  it('app real: 0 violações (EXIT 0)', () => {
    const { status, r } = rodar(RAIZ);
    expect(r.violacoes).toEqual([]);
    expect(status).toBe(0);
  });

  it('controle: o detector enxerga telas e hooks de dado derivados do código', () => {
    const { r } = rodar(RAIZ);
    expect(r.telas.length).toBeGreaterThan(15);
    expect(r.hooks).toEqual(
      expect.arrayContaining(['usePets', 'usePetDetail', 'useConsentimentos', 'useNotifications', 'useAgendamentos', 'usePetVacinas']),
    );
    expect(r.chamadas.length).toBeGreaterThanOrEqual(13);
    // as telas da BR-TUT-T03 e as 7 chamadas da BR-TUT-T04 estão entre as chamadas e passam SEM allowlist
    for (const [tela, hook] of [
      ['app/(tabs)/agenda/index.tsx', 'useAgendamentos'],
      ['app/(tabs)/pets/index.tsx', 'usePets'],
      ['app/(tabs)/pets/index.tsx', 'useNotifications'],
      ['app/notificacoes.tsx', 'useNotifications'],
      ['components/domain/ConsultasTab.tsx', 'usePetTimeline'],
      ['components/domain/ConsultasTab.tsx', 'usePetTimelineEvent'],
      ['components/domain/VacinasTab.tsx', 'usePetVacinas'],
      ['app/(tabs)/saude/index.tsx', 'usePets'],
      ['app/(tabs)/saude/index.tsx', 'useQueries'],
      ['app/(tabs)/pets/[id]/index.tsx', 'usePetDetail'],
      ['app/(tabs)/perfil/consentimentos.tsx', 'useConsentimentos'],
    ] as const) {
      const c = r.chamadas.find((x) => x.tela === tela && x.hook === hook);
      expect(c).toMatchObject({ ok: true });
      expect(c?.allowlist).toBeFalsy();
    }
    // tela sem dado de servidor não vira "chamada"
    expect(r.chamadas.some((c) => c.tela.includes('login.tsx'))).toBe(false);
  });

  it('isca: tela que desestrutura só data/isLoading => violação nominal, EXIT 1', () => {
    const dir = montarIsca('export default function T(){ const { data = [], isLoading } = useCoisas(); return null; }');
    const { status, r } = rodar(dir);
    expect(status).toBe(1);
    expect(r.violacoes).toHaveLength(1);
    expect(r.violacoes[0]).toMatchObject({ tela: 'app/tela.tsx', hook: 'useCoisas' });
  });

  it('isca: tela com <QueryState query={q}> passa', () => {
    const dir = montarIsca('export default function T(){ const q = useCoisas(); return <QueryState query={q} empty={null}>{() => null}</QueryState>; }');
    exigirPassa(dir);
  });

  it('isca: isError lido e USADO passa; lido e ignorado reprova', () => {
    const usado = montarIsca('export default function T(){ const { data, isError } = useCoisas(); return isError && data == null ? 1 : 2; }');
    exigirPassa(usado);
    const ignorado = montarIsca('export default function T(){ const { data, isError } = useCoisas(); return data; }');
    expect(rodar(ignorado).status).toBe(1);
  });

  // "isError antes de data" descarta o dado salvo quando o refetch falha.
  it('isca: isError testado ANTES do dado (isError ? / isError || !data / if (isError)) => violação nominal', () => {
    const ternario = montarIsca("export default function T(){ const { data, isError } = useCoisas(); return isError ? 'erro' : data; }");
    const r1 = rodar(ternario);
    expect(r1.status).toBe(1);
    expect(r1.r.violacoes[0]!.motivo).toMatch(/isError antes de data/);
    const ou = montarIsca("export default function T(){ const { data: lista, isError } = useCoisas(); if (isError || !lista) return 'erro'; return lista; }");
    expect(rodar(ou).status).toBe(1);
    const cedo = montarIsca("export default function T(){ const { data, isError } = useCoisas();\n  if (isError) {\n    return 'erro';\n  }\n  return data; }");
    const r3 = rodar(cedo);
    expect(r3.status).toBe(1);
    expect(r3.r.violacoes[0]!.motivo).toMatch(/retorno antecipado/);
  });

  it('controle: isError só quando NÃO há dado, ou ligado à faixa de dados salvos, passa', () => {
    const guarda = montarIsca("export default function T(){ const { data, isError } = useCoisas(); return isError && data == null ? 'erro' : data; }");
    exigirPassa(guarda);
    const faixa = montarIsca('export default function T(){ const { data, isError } = useCoisas(); return <>{isError ? <FaixaDadosSalvos/> : null}{data}</>; }');
    exigirPassa(faixa);
  });

  // As 4 iscas obrigatórias do brief da BR-TUT-T03, no FORMATO que o Prettier e o código real produzem (não one-liners de sonda).
  describe('iscas obrigatórias (formato real)', () => {
    it('isError testado DEPOIS do dado, em ternário encadeado de uma linha e no formato multilinha do Prettier => violação (conservador)', () => {
      // `data ? ... : isError ? ... : ...` é a ordem certa, mas o detector é textual: qualquer `isError ?` sem guarda `&& data == null`
      // reprova. Declarado: o caminho aceito é QueryState (ou `isError && data == null`). Se isto passar a EXIT 0 sem o dev mudar a
      // tela, o detector perdeu a regra.
      const umaLinha = montarIsca('export default function T(){ const { data, isError } = useCoisas(); return data ? <L d={data}/> : isError ? <Erro/> : <Skel/>; }');
      const r1 = rodar(umaLinha);
      expect(r1.status).toBe(1);
      expect(r1.r.violacoes[0]!.motivo).toMatch(/isError antes de data/);
      const multilinha = montarIsca(
        'export default function T(){\n  const { data, isError } = useCoisas();\n  return data ? (\n    <L d={data}/>\n  ) : isError ? (\n    <Erro/>\n  ) : null;\n}',
      );
      expect(rodar(multilinha).status).toBe(1);
    });

    it('`if (isError) {\\n return ... }` multilinha (Prettier), antes de usar o dado => violação "retorno antecipado"', () => {
      const dir = montarIsca(
        'export default function T(){\n  const { data, isError } = useCoisas();\n  if (isError) {\n    return <Erro/>;\n  }\n  return <L d={data}/>;\n}',
      );
      const { status, r } = rodar(dir);
      expect(status).toBe(1);
      expect(r.violacoes[0]!.motivo).toMatch(/retorno antecipado/);
    });

    it('desestruturação renomeada (`data: vacinas`, `isError: falhou`) é seguida pelo alias => violação; com guarda de dado passa', () => {
      const ruim = montarIsca(
        'export default function T(){\n  const { data: vacinas, isError: falhou } = useCoisas();\n  if (falhou) return <Erro/>;\n  return <L d={vacinas}/>;\n}',
      );
      const r1 = rodar(ruim);
      expect(r1.status).toBe(1);
      expect(r1.r.violacoes[0]!.motivo).toMatch(/falhou.*vacinas|vacinas/);
      const ruimTernario = montarIsca('export default function T(){ const { data: vacinas, isError: falhou } = useCoisas(); return falhou ? <Erro/> : <L d={vacinas}/>; }');
      expect(rodar(ruimTernario).status).toBe(1);
      const boa = montarIsca('export default function T(){ const { data: vacinas, isError: falhou } = useCoisas(); return falhou && vacinas == null ? <Erro/> : <L d={vacinas}/>; }');
      exigirPassa(boa);
      const lidoEIgnorado = montarIsca('export default function T(){ const { data: vacinas, isError: falhou } = useCoisas(); return <L d={vacinas}/>; }');
      expect(rodar(lidoEIgnorado).status).toBe(1);
    });

    it('`?? \'OK\'` sobre dado que pode estar ausente (o código antigo do perfil do pet) => violação por não tratar isError', () => {
      const dir = montarIsca(
        "const STATUS = { OK: 'Tudo certo', ALERTA: 'Atenção' };\n" +
          'export default function T(){\n  const { data: pet } = useCoisas();\n  const statusCfg = STATUS[pet?.dsStatusGeral ?? \'OK\'];\n  return <Chip>{statusCfg}</Chip>;\n}',
      );
      const { status, r } = rodar(dir);
      expect(status).toBe(1);
      expect(r.violacoes[0]!.motivo).toMatch(/destructuring sem isError/);
    });
  });

  // As 3 telas ANTIGAS, no código que estava em main@4c9a0de (trechos copiados). O detector tem de reprovar cada uma: é a prova
  // de que o gate teria pegado o P0, e não só passa com o código novo.
  describe('as 3 telas antigas (trechos reais de main@4c9a0de) reprovam', () => {
    const casos: [string, Record<string, string | null>, RegExp][] = [
      [
        'Saúde: usePets sem isError + useQueries sem isError',
        {
          'src/app/saude.tsx':
            'export default function SaudeScreen() {\n  const { data: pets = [], isLoading: petsLoading, refetch: refetchPets } = usePets();\n' +
            '  const vacinasResults = useQueries({ queries: pets.map(pet => ({ queryKey: [1], queryFn: () => 1 })) });\n' +
            '  const isLoading = petsLoading || vacinasResults.some(r => r.isLoading);\n' +
            '  const allClear = pets.length === 0 && !isLoading;\n  return allClear ? <Text>Tudo em dia!</Text> : null;\n}',
          'src/hooks/usePets.ts': 'export function usePets() { return useQuery({ queryKey: ["pets"], queryFn: async () => [] }); }',
        },
        /sem isError/,
      ],
      [
        "perfil do pet: usePetDetail sem isError + `?? 'OK'`",
        {
          'src/app/pet.tsx':
            "export default function PetDetailScreen() {\n  const { data: pet } = usePetDetail(1);\n  const statusCfg = STATUS_CHIP[pet?.dsStatusGeral ?? 'OK'];\n  return <KChip>{statusCfg.label}</KChip>;\n}",
          'src/hooks/usePetDetail.ts': 'export function usePetDetail(id) { return useQuery({ queryKey: ["p", id], queryFn: async () => null }); }',
        },
        /destructuring sem isError/,
      ],
      [
        'Consentimentos: useConsentimentos sem isError (lista vazia vira "Pendente")',
        {
          'src/app/consent.tsx':
            "export default function ConsentimentosScreen() {\n  const { data: lista = [] }                          = useConsentimentos();\n  const getStatus = (tipo) => lista.find(c => c.tipo === tipo);\n  return <KChip>{getStatus('X') ? 'Ativo' : 'Pendente'}</KChip>;\n}",
          'src/hooks/useConsentimentos.ts': 'export function useConsentimentos() { return useQuery({ queryKey: ["c"], queryFn: async () => [] }); }',
        },
        /destructuring sem isError/,
      ],
    ];
    it.each(casos)('%s', (_nome, arquivos, motivo) => {
      const { status, r } = rodar(montar({ 'src/hooks/useCoisa.ts': null, ...arquivos }));
      expect(status).toBe(1);
      expect(r.violacoes.length).toBeGreaterThan(0);
      expect(r.violacoes.map((v) => v.motivo).join('\n')).toMatch(motivo);
    });
  });

  // Cada forma que o detector pode não ver ganha uma isca que DEVE reprovar (regra 13). Corpos das sondas da G2 da clínica.
  const SEM_ERRO = 'export default function T(){ const { data = [] } = useCoisas(); return data; }';
  const hookEm = (corpo: string) => ({ 'src/hooks/useCoisa.ts': `export function useCoisas(){ ${corpo} }` });
  const ISCAS: [string, Record<string, string | null>][] = [
    ['q passado por prop ao filho', { 'src/app/t.tsx': 'export default function T(){ const q = useCoisas(); return <Lista q={q}/>; }' }],
    ['if (q.isError) {} vazio', { 'src/app/t.tsx': 'export default function T(){ const q = useCoisas(); if (q.isError) {} return q.data?.length ? q.data : <Text>Nenhum</Text>; }' }],
    ['isError só no console.log', { 'src/app/t.tsx': "export default function T(){ const { data = [], isError } = useCoisas(); console.log(isError); return data.length ? data : 'Nenhum'; }" }],
    ['hook useInfiniteQuery', { ...hookEm("return useInfiniteQuery({ queryKey:['c'], queryFn: async()=>[] });"), 'src/app/t.tsx': SEM_ERRO }],
    ['hook useQueries', { ...hookEm('return useQueries({ queries: [] });'), 'src/app/t.tsx': SEM_ERRO }],
    ['hook useSuspenseQuery', { ...hookEm("return useSuspenseQuery({ queryKey:['c'], queryFn: async()=>[] });"), 'src/app/t.tsx': SEM_ERRO }],
    ['hook definido em src/services', { 'src/hooks/useCoisa.ts': null, 'src/services/coisa.ts': HOOK, 'src/app/t.tsx': SEM_ERRO }],
    [
      'hook local no próprio arquivo de tela',
      { 'src/hooks/useCoisa.ts': null, 'src/app/t.tsx': "function useLocal(){ return useQuery({queryKey:['x'],queryFn:async()=>[]}); }\nexport default function T(){ const { data = [] } = useLocal(); return data; }" },
    ],
    ['componente de src/components chama hook', { 'src/components/Lista.tsx': "export function Lista(){ const { data = [] } = useCoisas(); return data.length ? data : 'Nenhum'; }" }],
    ['useQuery direto na tela', { 'src/app/t.tsx': "export default function T(){ const { data = [] } = useQuery({queryKey:['x'],queryFn:async()=>[]}); return data; }" }],
    ['useQuery direto num componente', { 'src/components/L.tsx': "export function L(){ const { data = [] } = useQuery({queryKey:['x'],queryFn:async()=>[]}); return data; }" }],
    ['useInfiniteQuery direto', { 'src/app/t.tsx': "export default function T(){ const { data } = useInfiniteQuery({queryKey:['x'],queryFn:async()=>[]}); return data; }" }],
    ['useSuspenseQuery direto', { 'src/app/t.tsx': "export default function T(){ const { data } = useSuspenseQuery({queryKey:['x'],queryFn:async()=>[]}); return data; }" }],
    ['2 chamadas, isError usado só na 1ª', { 'src/app/t.tsx': "export default function T(){ const { data: a, isError } = useCoisas(); const { data: b = [], isError: e2 } = useCoisas(); return isError ? 'x' : b; }" }],
    [
      '2 componentes no arquivo reaproveitando o nome isError',
      { 'src/app/t.tsx': "function A(){ const { data, isError } = useCoisas(); return isError&&data==null?1:data; }\nfunction B(){ const { data = [], isError } = useCoisas(); return data.length?data:'Nenhum'; }\nexport default function T(){return <><A/><B/></>;}" },
    ],
    ['export default function useX', { 'src/hooks/useCoisa.ts': "export default function useCoisas(){ return useQuery({ queryKey:['c'], queryFn: async()=>[] }); }", 'src/app/t.tsx': SEM_ERRO }],
    ['arrow const + export { useX }', { 'src/hooks/useCoisa.ts': "const useCoisas = () => useQuery({ queryKey:['c'], queryFn: async()=>[] });\nexport { useCoisas };", 'src/app/t.tsx': SEM_ERRO }],
    ['export { useX as useY }', { 'src/hooks/useCoisa.ts': "const useBase = () => useQuery({ queryKey:['c'], queryFn: async()=>[] });\nexport { useBase as useCoisas };", 'src/app/t.tsx': SEM_ERRO }],
    ['query={q} num componente que não é QueryState', { 'src/app/t.tsx': 'export default function T(){ const q = useCoisas(); return <Grafico query={q} />; }' }],
    ['arquivo .ts em src/app', { 'src/app/t.ts': SEM_ERRO }],
    ['useQueries direto sem isError', { 'src/app/t.tsx': 'export default function T(){ const rs = useQueries({ queries: [] }); return rs.length; }' }],
  ];
  it.each(ISCAS)('isca (controle positivo): %s => violação, EXIT 1', (_nome, arquivos) => {
    const { status, r } = rodar(montar(arquivos));
    expect(r.violacoes.length).toBeGreaterThan(0);
    expect(status).toBe(1);
  });

  // BR-TUT-T03 fix wave (F3-I1): as iscas da G2 que o detector herdado da clínica NÃO via, no formato multilinha do Prettier.
  describe('F3-I1: formas que o detector herdado não enxergava', () => {
    const tela = (corpo: string) => `export default function T() {\n${corpo}\n}`;
    const CASOS: [string, string, RegExp][] = [
      [
        'a) objeto: `if (q.isError) { return <Erro/> }` descarta o dado salvo',
        tela(
          '  const petsQuery = useCoisas();\n  if (petsQuery.isError) {\n    return <ErrorState onRetry={() => petsQuery.refetch()} />;\n  }\n  return <Text>{petsQuery.data?.length ?? 0}</Text>;',
        ),
        /isError antes de data/,
      ],
      [
        'a) objeto: ternário `q.isError ? <Erro/> : ...`',
        tela('  const q = useCoisas();\n  return q.isError ? (\n    <Erro />\n  ) : (\n    <L d={q.data} />\n  );'),
        /isError antes de data/,
      ],
      [
        'a) objeto: `q.isError || !q.data`',
        tela('  const q = useCoisas();\n  if (q.isError || !q.data) return <Erro />;\n  return <L d={q.data} />;'),
        /isError antes de data/,
      ],
      [
        'b) desestruturado: `if (isError && !isFetching) return <Erro/>`',
        tela('  const { data, isError, isFetching } = useCoisas();\n  if (isError && !isFetching) {\n    return <Erro />;\n  }\n  return <L d={data} />;'),
        /condição composta sem guarda de data/,
      ],
      [
        'b) objeto: `if (q.isError && !q.isFetching) return <Erro/>`',
        tela('  const q = useCoisas();\n  if (q.isError && !q.isFetching) {\n    return <Erro />;\n  }\n  return <L d={q.data} />;'),
        /condição composta sem guarda de q\.data/,
      ],
      [
        // Reprodução do maestro (sessão 6): desestruturação em 2ª instrução a partir do objeto, com renomeação, e o
        // objeto também indo para <QueryState>. O detector só olhava `q.isError` e aceitava pelo <QueryState>.
        'a) objeto + desestruturação renomeada depois: `const { isError: falhou } = q; if (falhou) return null`',
        tela(
          '  const q = useCoisas();\n  const { isError: falhou } = q;\n  if (falhou) return null;\n  return (\n    <QueryState\n      query={q}\n      empty={<Text>Nenhum</Text>}\n    >\n      {(d) => <L d={d} />}\n    </QueryState>\n  );',
        ),
        /isError antes de data/,
      ],
      [
        'c) erro E vazio ao mesmo tempo (Review Focus §5)',
        tela(
          '  const { data = [], isError } = useCoisas();\n  return (\n    <>\n      {isError && <ErrorState onRetry={() => 1} />}\n      {data.length === 0 && <Text>Nenhum pet ainda</Text>}\n      {data.length > 0 && <L d={data} />}\n    </>\n  );',
        ),
        /erro e vazio podem coincidir/,
      ],
      [
        'c) erro E vazio, forma objeto, `!q.length`',
        tela(
          '  const q = useCoisas();\n  return (\n    <>\n      {q.isError && <ErrorState onRetry={() => 1} />}\n      {!q.data?.length && (\n        <Text>Nenhum</Text>\n      )}\n    </>\n  );',
        ),
        /erro e vazio podem coincidir/,
      ],
    ];
    it.each(CASOS)('isca: %s => violação nominal, EXIT 1', (_n, src, motivo) => {
      const { status, r } = rodar(montarIsca(src));
      expect(status).toBe(1);
      expect(r.violacoes).toHaveLength(1);
      expect(r.violacoes[0]!.motivo).toMatch(motivo);
    });

    const QUERIES = (corpo: string) => tela(`  const petsQuery = useCoisas();\n  const vacinas = useQueries({ queries: [] });\n${corpo}`);
    const QUERY_LIKE = 'isLoading: false, refetch: () => 1, data: petsQuery.data';
    const CASOS_QUERIES: [string, string][] = [
      [
        'd) M8b da G2: o erro dos itens do useQueries é descartado (só `petsQuery.isError`)',
        QUERIES(`  const agregada = { ${QUERY_LIKE}, isError: petsQuery.isError };\n  return (\n    <QueryState query={agregada} empty={null}>\n      {() => null}\n    </QueryState>\n  );`),
      ],
      [
        'd) `isError` lido do array e jogado fora (`void algumErro`)',
        QUERIES('  const algumErro = vacinas.some((r) => r.isError);\n  void algumErro;\n  return petsQuery.isError && petsQuery.data == null ? 1 : 2;'),
      ],
      ['d) a palavra isError só aparece em outro lugar', QUERIES('  return petsQuery.isError && petsQuery.data == null ? vacinas.length : 2;')],
    ];
    it.each(CASOS_QUERIES)('isca (useQueries): %s => violação em useQueries, EXIT 1', (_n, src) => {
      const { status, r } = rodar(montarIsca(src));
      expect(status).toBe(1);
      expect(r.violacoes.map((v) => v.hook)).toEqual(['useQueries']);
      expect(r.violacoes[0]!.motivo).toMatch(/useQueries: o isError de cada item/);
    });

    const PASSAM_F3: [string, string][] = [
      ['objeto com guarda de dado', tela('  const q = useCoisas();\n  if (q.isError && q.data == null) {\n    return <Erro />;\n  }\n  return <L d={q.data} />;')],
      ['desestruturado com guarda de dado na condição composta', tela('  const { data, isError, isFetching } = useCoisas();\n  if (isError && data == null && !isFetching) {\n    return <Erro />;\n  }\n  return <L d={data} />;')],
      [
        'erro e vazio, com `!isError` na cadeia do vazio',
        tela('  const { data = [], isError } = useCoisas();\n  return (\n    <>\n      {isError && data.length === 0 && <ErrorState onRetry={() => 1} />}\n      {!isError && data.length === 0 && <Text>Nenhum pet ainda</Text>}\n    </>\n  );'),
      ],
      [
        'useQueries: o erro de cada item entra no agregado, COM guarda de dado, e o agregado é usado',
        tela('  const vacinas = useQueries({ queries: [] });\n  const falhou = vacinas.some((r) => r.isError && r.data == null);\n  return falhou ? <Erro /> : <L />;'),
      ],
      [
        'objeto + desestruturação renomeada depois, com guarda do dado renomeado',
        tela('  const q = useCoisas();\n  const { isError: falhou, data: d } = q;\n  if (falhou && !d) return null;\n  return <QueryState query={q} empty={<Text>N</Text>}>{(x) => <L d={x} />}</QueryState>;'),
      ],
      [
        'useQueries: `res[0].isError` lido, com guarda de dado',
        tela('  const vacinas = useQueries({ queries: [] });\n  return vacinas[0]?.isError && vacinas[0]?.data == null ? <Erro /> : <L />;'),
      ],
      [
        // padrão da Saúde do tutor: o erro dos itens vira um QueryLike entregue ao kit (o kit decide o que o erro faz ao dado)
        'useQueries: erro agregado num objeto entregue a <QueryState query>',
        tela(
          '  const vacinas = useQueries({ queries: [] });\n  const agregada = {\n    isLoading: false,\n    refetch: () => 1,\n    data: vacinas.map((r) => r.data),\n    isError: vacinas.some((r) => r.isError),\n  };\n  return (\n    <QueryState query={agregada} empty={null}>\n      {() => null}\n    </QueryState>\n  );',
        ),
      ],
      ['if (q.isError && (q.data == null)) aninhado', tela('  const q = useCoisas();\n  if (q.isError && (q.data == null)) {\n    return <Erro />;\n  }\n  return <L d={q.data} />;')],
      ['`!q.data && q.isError` (guarda antes do erro)', tela('  const q = useCoisas();\n  if (!q.data && q.isError) {\n    return <Erro />;\n  }\n  return <L d={q.data} />;')],
    ];
    it.each(PASSAM_F3)('controle negativo: %s => passa', (_n, src) => {
      exigirPassa(montarIsca(src));
    });
  });

  const PASSAM: [string, Record<string, string | null>][] = [
    ['componente com isError usado', { 'src/components/Lista.tsx': "export function Lista(){ const { data = [], isError } = useCoisas(); return isError && data.length === 0 ? 'erro' : data; }" }],
    ['hook local com consumidor em QueryState', { 'src/hooks/useCoisa.ts': null, 'src/app/t.tsx': "function useLocal(){ return useQuery({queryKey:['x'],queryFn:async()=>[]}); }\nexport default function T(){ const q = useLocal(); return <QueryState query={q} empty={null}>{() => null}</QueryState>; }" }],
    ['2 componentes, cada um usa o próprio isError', { 'src/app/t.tsx': "function A(){ const { data, isError } = useCoisas(); return isError&&data==null?1:data; }\nfunction B(){ const { data = [], isError } = useCoisas(); return isError&&data.length===0?2:data; }\nexport default function T(){return <><A/><B/></>;}" }],
    ['useQueries com isError lido, com guarda de dado', { 'src/app/t.tsx': 'export default function T(){ const rs = useQueries({ queries: [] }); return rs.some((r) => r.isError && r.data == null) ? 1 : 2; }' }],
    ['useInfiniteQuery direto em QueryState', { 'src/app/t.tsx': 'export default function T(){ const q = useInfiniteQuery({queryKey:[1]}); return <QueryState query={q} empty={null}>{() => null}</QueryState>; }' }],
    ['petQuery inteiro em <QueryState query={petQuery}> (o formato do perfil do pet novo)', { 'src/app/t.tsx': 'export default function T(){\n  const petQuery = useCoisas();\n  return (\n    <QueryState\n      query={petQuery}\n      empty={null}\n    >\n      {(p) => <X p={p}/>}\n    </QueryState>\n  );\n}' }],
  ];
  it.each(PASSAM)('controle negativo: %s => passa', (_nome, arquivos) => {
    exigirPassa(montar(arquivos));
  });

  // BR-CLI-DET fix wave da G2 (br-cli-det-revisao.md), portado da clínica 080b1aa para a BR-TUT-T04: cada isca é uma sonda da revisão, no formato multilinha do Prettier, e
  // o detector herdado (cb36c2a) a aceitava com EXIT 0. Todas DEVEM reprovar com violação nominal.
  describe('fix wave G2: formas que o detector herdado aceitava', () => {
    const tela = (corpo: string) => `export default function T() {\n${corpo}\n}`;
    const ERRO_SEM_DADO = /isError antes de data/;
    const CASOS_G2: [string, string, RegExp][] = [
      // G2-I1: a guarda de dado só vale em conjunção com o erro, nunca dentro de `||`
      ['I1 `!data || isError`', tela('  const { data, isError } = useCoisas();\n  if (!data || isError) {\n    return <ErrorState />;\n  }\n  return <L d={data} />;'), ERRO_SEM_DADO],
      ['I1 `q.data == null || q.isError`', tela('  const q = useCoisas();\n  if (q.data == null || q.isError) {\n    return <ErrorState />;\n  }\n  return <L d={q.data} />;'), ERRO_SEM_DADO],
      ['I1 `isError || data?.length === 0`', tela('  const { data, isError } = useCoisas();\n  if (isError || data?.length === 0) {\n    return <ErrorState />;\n  }\n  return <L d={data} />;'), ERRO_SEM_DADO],
      // Reprodução do maestro (sessão 6): a guarda com a polaridade trocada por negação dupla ainda deixa o erro vencer o dado
      // (`!!data`, `!(data == null)`, `!(!data)` = "tem dado"); o detector lia o `!` inicial como guarda de ausência.
      ['maestro `isError && !!data ?`', tela('  const { data, isError } = useCoisas();\n  return isError && !!data ? (\n    <ErrorState />\n  ) : (\n    <L d={data} />\n  );'), ERRO_SEM_DADO],
      ['maestro `isError && !(data == null) ?`', tela('  const { data, isError } = useCoisas();\n  return isError && !(data == null) ? (\n    <ErrorState />\n  ) : (\n    <L d={data} />\n  );'), ERRO_SEM_DADO],
      ['maestro `if (q.isError && !(!q.data))`', tela('  const q = useCoisas();\n  if (q.isError && !(!q.data)) {\n    return <ErrorState />;\n  }\n  return <L d={q.data} />;'), ERRO_SEM_DADO],
      // G2-I2: erro negado
      ['I2 `!isError ? <L/> : <Erro/>`', tela('  const { data, isError } = useCoisas();\n  return !isError ? (\n    <L d={data} />\n  ) : (\n    <ErrorState />\n  );'), ERRO_SEM_DADO],
      ['I2 `!q.isError ? <L/> : <Erro/>` (objeto)', tela('  const q = useCoisas();\n  return !q.isError ? (\n    <L d={q.data} />\n  ) : (\n    <ErrorState />\n  );'), ERRO_SEM_DADO],
      ['I2 `{!isError && <L d={data}/>}` esconde o dado salvo', tela('  const { data, isError } = useCoisas();\n  return (\n    <>\n      {!isError && <L d={data} />}\n    </>\n  );'), ERRO_SEM_DADO],
      // G2-I3: erro guardado em variável local
      ['I3 `const erro = q.isError; if (erro)`', tela('  const q = useCoisas();\n  const erro = q.isError;\n  if (erro) {\n    return <ErrorState />;\n  }\n  return <L d={q.data} />;'), ERRO_SEM_DADO],
      [
        'I3 `const mostrarErro = isError && !isFetching; if (mostrarErro)`',
        tela('  const { data, isError, isFetching } = useCoisas();\n  const mostrarErro = isError && !isFetching;\n  if (mostrarErro) {\n    return <ErrorState />;\n  }\n  return <L d={data} />;'),
        ERRO_SEM_DADO,
      ],
      // G2-I5: ramo `{ query: q }` passa pelas mesmas regras
      ['I5 `{ query: q }` + `if (q.isError)`', tela('  const { query: q } = useCoisas();\n  if (q.isError) {\n    return <ErrorState />;\n  }\n  return <L d={q.data} />;'), ERRO_SEM_DADO],
      ['I5 `{ query: q }` + `q.isError ? <Erro/> : <L/>`', tela('  const { query: q } = useCoisas();\n  return q.isError ? (\n    <ErrorState />\n  ) : (\n    <L d={q.data} />\n  );'), ERRO_SEM_DADO],
      [
        'I5 forma da teleorientação: erro derivado de `{ query, mutation }` testado antes da sala salva',
        tela(
          '  const { query: salaQuery, mutation } = useCoisas();\n  const sala = mutation.data ?? salaQuery.data;\n  const erro = mutation.error ?? salaQuery.error;\n  return erro ? <Text>Nao foi possivel</Text> : sala ? <Sala /> : null;',
        ),
        ERRO_SEM_DADO,
      ],
      // G2-M1: outros campos de erro
      ['M1 `q.error`', tela('  const q = useCoisas();\n  if (q.error) {\n    return <ErrorState />;\n  }\n  return <QueryState query={q} empty={null}>{() => null}</QueryState>;'), ERRO_SEM_DADO],
      ["M1 `q.status === 'error'`", tela("  const q = useCoisas();\n  if (q.status === 'error') {\n    return <ErrorState />;\n  }\n  return <QueryState query={q} empty={null}>{() => null}</QueryState>;"), ERRO_SEM_DADO],
      ['M1 `q.isRefetchError`', tela('  const q = useCoisas();\n  if (q.isRefetchError) {\n    return <ErrorState />;\n  }\n  return <QueryState query={q} empty={null}>{() => null}</QueryState>;'), ERRO_SEM_DADO],
      ['M1 `q?.isError`', tela('  const q = useCoisas();\n  if (q?.isError) {\n    return <ErrorState />;\n  }\n  return <QueryState query={q} empty={null}>{() => null}</QueryState>;'), ERRO_SEM_DADO],
      // parênteses aninhados na condição (antes o `if` era lido só até o 1º `)`)
      ['`if (Boolean(ativo) && q.isError)`', tela('  const q = useCoisas();\n  if (Boolean(ativo) && q.isError) {\n    return <ErrorState />;\n  }\n  return <L d={q.data} />;'), ERRO_SEM_DADO],
    ];
    it.each(CASOS_G2)('isca: %s => violação nominal, EXIT 1', (_n, src, motivo) => {
      const { status, r } = rodar(montarIsca(src));
      expect(status).toBe(1);
      expect(r.violacoes).toHaveLength(1);
      expect(r.violacoes[0]!.motivo).toMatch(motivo);
    });

    // G2-I4: `useQueries` — o erro de um item não pode vencer o dado dos outros
    const QUERIES = (corpo: string) => tela(`  const vacinas = useQueries({ queries: [] });\n${corpo}`);
    const CASOS_USEQUERIES: [string, string][] = [
      ['I4 `if (rs.some(r => r.isError)) return <Erro/>`', QUERIES('  if (vacinas.some((r) => r.isError)) {\n    return <ErrorState />;\n  }\n  return <L d={vacinas.map((r) => r.data)} />;')],
      ['I4 `falhou ? <Erro/> : <L/>` com `falhou` derivado do array', QUERIES('  const falhou = vacinas.some((r) => r.isError);\n  return falhou ? (\n    <ErrorState />\n  ) : (\n    <L d={vacinas.map((r) => r.data)} />\n  );')],
      ['I4 `vacinas[0]?.isError ? <Erro/> : <L/>`', QUERIES('  return vacinas[0]?.isError ? <ErrorState /> : <L d={vacinas[0]?.data} />;')],
    ];
    it.each(CASOS_USEQUERIES)('isca (useQueries): %s => violação em useQueries, EXIT 1', (_n, src) => {
      const { status, r } = rodar(montarIsca(src));
      expect(status).toBe(1);
      expect(r.violacoes.map((v) => v.hook)).toEqual(['useQueries']);
      expect(r.violacoes[0]!.motivo).toMatch(ERRO_SEM_DADO);
    });

    // G2-M4 (falso positivo): o retorno antecipado COM guarda de dado exclui o erro quando há dado; o vazio, que só existe com dado,
    // não coincide com ele.
    const CORRETAS: [string, string][] = [
      [
        'M4 retorno antecipado com guarda + vazio depois',
        tela('  const { data, isError } = useCoisas();\n  if (isError && data == null) {\n    return <ErrorState />;\n  }\n  return (\n    <>\n      {data?.length === 0 && <Text>Nenhum</Text>}\n      <L d={data} />\n    </>\n  );'),
      ],
      [
        'M4 `{isError && data == null && <Erro/>}` + vazio',
        tela('  const { data, isError } = useCoisas();\n  return (\n    <>\n      {isError && data == null && <ErrorState />}\n      {data?.length === 0 && <Text>Nenhum</Text>}\n    </>\n  );'),
      ],
      [
        'M4 2 queries: erro guardado da A, vazio da B',
        tela(
          '  const a = useCoisas();\n  const b = useCoisas();\n  if (a.isError && a.data == null) {\n    return <ErrorState />;\n  }\n  return (\n    <>\n      {b.data?.length === 0 && <Text>Nenhum</Text>}\n      <QueryState query={b} empty={null}>{() => null}</QueryState>\n    </>\n  );',
        ),
      ],
      ['I3 alias de erro COM guarda na definição', tela('  const { data, isError } = useCoisas();\n  const semDado = isError && data == null;\n  if (semDado) {\n    return <ErrorState />;\n  }\n  return <L d={data} />;')],
      ['I2 erro negado só no vazio (a lista continua com o erro)', tela('  const { data = [], isError } = useCoisas();\n  return (\n    <>\n      {isError && data.length === 0 && <ErrorState />}\n      {!isError && data.length === 0 && <Text>Nenhum</Text>}\n      <L d={data} />\n    </>\n  );')],
      ['I5 `{ query: q }` com guarda de dado', tela('  const { query: q } = useCoisas();\n  if (q.isError && q.data == null) {\n    return <ErrorState />;\n  }\n  return <L d={q.data} />;')],
    ];
    it.each(CORRETAS)('controle negativo (chamada contada): %s => passa', (_n, src) => {
      exigirPassa(montarIsca(src));
    });
  });

  it('allowlist EXATA: 2 entradas (BR-TUT-T04), razão > 30 caracteres, cada entrada aponta para chamada que existe e as telas da T03/T04 nunca entram', () => {
    const lista = JSON.parse(execFileSync(process.execPath, [SCRIPT, '--allowlist'], { encoding: 'utf8' })) as Record<string, string>;
    expect(Object.keys(lista).sort()).toEqual([...ALLOWLIST_EXATA].sort());
    const { r } = rodar(RAIZ);
    for (const [chave, razao] of Object.entries(lista)) {
      expect(razao.length).toBeGreaterThan(30);
      const [tela, hook] = chave.split('::');
      expect(r.chamadas.some((c) => c.tela === tela && c.hook === hook)).toBe(true);
      expect(chave).not.toMatch(/saude\/index|pets\/\[id\]\/index|perfil\/consentimentos|agenda\/index|pets\/index|notificacoes|ConsultasTab|VacinasTab/);
    }
  });

  it('o CLI imprime a contagem e sai 0 no app real', () => {
    const out = execFileSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
    expect(out).toMatch(/chamadas: [1-9]\d/); // detector nulo imprime `chamadas: 0`
    expect(out).toMatch(/violacoes: 0/);
  });
});

// LIMITES DECLARADOS (G2 BR-TUT-T04, I1/I2): formas em que o detector deixa passar uma leitura de erro que esconde o dado, porque
// `<QueryState query={q}>` absolve `q` e a regra do erro negado só enxerga o DADO textual. Cada isca FIXA o limite: EXIT 0 e 0 violações.
// limite declarado (G2 BR-TUT-T04): se este teste quebrar, o detector melhorou; troque por isca de violação.
// Quem protege essas formas nas telas reais é o teste de estado por tela (`TelasDadoEstados.test.tsx`), não o detector.
describe('limites declarados do detector (iscas que PASSAM de propósito)', () => {
  const QS = '<QueryState query={q} empty={null}>{() => null}</QueryState>';
  const tela = (corpo: string, jsx = QS) => `export default function T() {\n  const q = useCoisas();\n${corpo}\n  return (\n    <>\n      ${jsx}\n    </>\n  );\n}`;
  const LIMITES: [string, string][] = [
    ['A01 erro negado em volta do <QueryState> (I2)', tela('', `{!q.isError && ${QS}}`)],
    ['A02 erro negado por constante (I2)', tela('  const ok = !q.isError;', `{ok && ${QS}}`)],
    ['A03 função auxiliar lê o erro (I1)', `function falhou(x: { isError: boolean }) {\n  return x.isError;\n}\n\n${tela('  if (falhou(q)) return null;')}`],
    ["A04 `status !== 'success'` (I1)", tela("  if (q.status !== 'success' && !q.isLoading) return null;")],
    ['A05 desestruturação com cast `as` (I1)', tela('  const { isError: falhou } = q as { isError: boolean };\n  if (falhou) return null;')],
    ['A09 `failureReason` (I1)', tela('  if (q.failureReason) return null;')],
    ['A10 spread que zera o erro + leitura inócua (I1)', tela('', '<Lista refreshing={canceling || q.isError} /><QueryState query={{ ...q, isError: false }} empty={null}>{() => null}</QueryState>')],
    ['A11 alias do objeto `const q2 = q` (I1)', tela('  const q2 = q;\n  if (q2.isError) return null;')],
  ];
  it.each(LIMITES)('limite: %s => passa, EXIT 0, 0 violações', (_nome, src) => {
    exigirPassa(montarIsca(src));
  });
});

// Default que inventa "tudo certo" quando o dado não veio. O detector acima não enxerga o operador (só o isError), então este bloco
// olha o texto de src/ direto — com controle positivo. PEGA (F4-M1 da G2): `?? 'OK'`, `|| 'OK'`, default de desestruturação ou de
// parâmetro (`{ x = 'OK' }`, `(x = 'OK')`) e fallback pela CHAVE de status (`?? STATUS_CHIP.OK`, `|| MAPA['OK']`), com os literais OK,
// Tudo certo, Tudo em dia e Em dia. NÃO PEGA (limite declarado): o mesmo literal guardado numa constante de nome arbitrário
// (`const PADRAO = 'OK'; x ?? PADRAO`) — nesse caso quem protege é o teste de comportamento da tela (`PetDetalheEstados`).
describe('gate: nenhum default "OK" sobre dado de servidor em src/', () => {
  const LIT = String.raw`(['"` + "`" + String.raw`])(?:OK|Tudo certo|Tudo em dia|Em dia)\1`;
  const FORMAS: [string, RegExp][] = [
    ['`?? \'OK\'`', new RegExp(String.raw`\?\?\s*` + LIT)],
    ['`|| \'OK\'`', new RegExp(String.raw`\|\|\s*` + LIT)],
    ['default de desestruturação/parâmetro', new RegExp(String.raw`[{,(]\s*\w+(?:\s*:\s*\w+)?\s*=\s*` + LIT)],
    ['fallback pela chave OK', /(?:\?\?|\|\|)\s*[A-Za-z_]\w*(?:\.OK\b|\[\s*['"`]OK['"`]\s*\])/],
  ];
  const acha = (src: string) => FORMAS.filter(([, re]) => re.test(src)).map(([n]) => n);
  function listar(dir: string, acc: string[] = []): string[] {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== '__tests__') listar(p, acc); }
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) acc.push(p);
    }
    return acc;
  }
  it('controle positivo: cada forma enxerga o código antigo e as variantes da G2 (M4a-d)', () => {
    expect(acha("const statusCfg = STATUS_CHIP[pet?.dsStatusGeral ?? 'OK'];")).toEqual(['`?? \'OK\'`']);
    expect(acha('const x = a ?? "Tudo em dia";')).toEqual(['`?? \'OK\'`']);
    expect(acha("STATUS_CHIP[pet.dsStatusGeral || 'OK']")).toEqual(['`|| \'OK\'`']);
    expect(acha("const { dsStatusGeral = 'OK' } = pet;")).toEqual(['default de desestruturação/parâmetro']);
    expect(acha("const { id, dsStatusGeral: s = 'OK', outro } = pet;")).toEqual(['default de desestruturação/parâmetro']);
    expect(acha("function f(status = 'Tudo certo') {}")).toEqual(['default de desestruturação/parâmetro']);
    expect(acha('STATUS_CHIP[pet.dsStatusGeral] ?? STATUS_CHIP.OK')).toEqual(['fallback pela chave OK']);
    expect(acha("STATUS_CHIP[pet.dsStatusGeral] || MAPA['OK']")).toEqual(['fallback pela chave OK']);
  });
  it('controle negativo: o que NÃO é default de status passa', () => {
    for (const ok of [
      'const x = a ?? 0;',
      "if (status === 'OK') return 1;",
      "const STATUS = { OK: 'Tudo certo', ALERTA: 'Atenção' };",
      '<Chip status="OK" />',
      "const y = a ?? 'Pendente';",
      'const z = STATUS_CHIP[s];',
    ]) {
      expect(acha(ok)).toEqual([]);
    }
  });
  it('limite declarado: constante de nome arbitrário NÃO é pega por este gate', () => {
    expect(acha("const PADRAO = 'OK' as const; STATUS_CHIP[pet.dsStatusGeral ?? PADRAO]")).toEqual([]);
  });
  // Escopo: telas (src/app) e componentes de domínio. `components/primitives` fica de fora: o `rotuloOk ?? 'OK'` do KDialog é o
  // rótulo de um botão, não dado de servidor.
  it('src/app e src/components/domain não têm nenhum (fora comentários)', () => {
    const arquivos = [...listar(path.join(RAIZ, 'src', 'app')), ...listar(path.join(RAIZ, 'src', 'components', 'domain'))];
    expect(arquivos.length).toBeGreaterThan(15);
    const semComentario = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    const achados = arquivos.filter((f) => acha(semComentario(fs.readFileSync(f, 'utf8'))).length > 0).map((f) => path.relative(RAIZ, f));
    expect(achados).toEqual([]);
  });
});
