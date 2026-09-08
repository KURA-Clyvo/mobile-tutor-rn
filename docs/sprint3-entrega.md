# Sprint 3 — registro de execução (`mobile-tutor-rn`)

Cada entrada traz número literal e o comando que o produziu. Escrito conforme as tasks fecham.

## Baseline desta sessão — 2026-09-08

Branch `fix/auditoria-codigo`, `HEAD af1d68f`, árvore limpa (só `backlog/` sem versionar).

| Comando | Resultado |
|---|---|
| `npx jest --watchAll=false` | `Test Suites: 45 passed, 45 total` · `Tests: 1 skipped, 256 passed, 257 total` · `JEST_EXIT=0` |
| `npx eslint src` | 0 linhas · `LINT_EXIT=0` |
| `npx tsc --noEmit` | 0 linhas · `TSC_EXIT=0` |

⚠️ Não é o baseline da auditoria (`main @ 591d377` → 231 passed / 36 suites): são checkouts
diferentes — a branch tem 16 commits que `main` não tem.

## T-2 · Envelope `Page<T>` das listas — **parcial**

**O que a auditoria dizia:** 4 endpoints lendo `Page<T>` como array. **Medido nesta branch:
2 dos 4 já estavam corrigidos** desde a TASK-31 —
`timeline.service.ts` e `notifications.service.ts` já faziam `.content` na mão
(`grep -n "data.content" src/services/` achava os dois). A âncora do backlog é de `main`,
sem os commits da branch.

**Feito:**

- `src/services/api/pagina.ts` — `desembrulharPagina<T>()`, helper único e nomeado. Aceita
  `Page<T>` **e** `T[]` (os mocks devolvem array; quebrá-los trocaria um bug por outro), trata
  corpo ausente como `[]` e **lança** em shape desconhecido, em vez de devolver lista vazia
  silenciosa.
- Aplicado a `listPets`, `listAgendamentos` e `listConsentimentos` (que não desembrulhavam nada)
  e às duas listas que desembrulhavam à mão — `timeline` e `notificacoes` passaram a usar o
  mesmo helper, então o app tem **um** lugar que sabe que o servidor pagina.
- `src/__tests__/pagina.service.test.ts` — 8 testes, incluindo o JSON literal que
  `AgendamentoBffControllerTest:81-82` assegura (`{content:[{idAgendamento:1,…}],totalElements:1}`),
  a sentinela do shape desconhecido e o controle de não-regressão do modo mock (array nu).

**Mordida:** com os 5 services revertidos a `af1d68f` (`git stash push`), o arquivo novo dá
`Tests: 3 failed, 5 passed, 8 total`, `MORDIDA_EXIT=1` — os 3 que falham são exatamente os do
envelope (`Received has value: {"content": […], "totalElements": 1}`). Depois do fix: 8/8.

**Verificação:** `Test Suites: 46 passed, 46 total` · `Tests: 1 skipped, 264 passed, 265 total`
· `JEST_EXIT=0`; `npx eslint src` 0 linhas, `LINT_EXIT=0`; `npx tsc --noEmit` 0 linhas,
`TSC_EXIT=0`. Delta: **+8 testes, +1 suíte** — só o arquivo novo. `mock-contract-audit.test.ts`
continua verde.

### 🔴 O que T-2 **não** fechou, e por quê

**Envelope e nomes de campo são duas divergências independentes. Esta fechou só a primeira.**

`PetResponse` e `AgendamentoResponse` (Java) usam nomes diferentes do tipo app-facing
(`idAgendamento`≠`id`, `dtAgendamento`≠`dtInicio`, `status`≠`sgStatus`), e o Java pode não ter
`pet.nmRaca`/`nmClinica`/`dsMotivo`, que `AgendamentoItem.tsx` renderiza hoje como obrigatórios.

O mapa campo-a-campo existe, mas **em outro repositório que não está nesta máquina**:
`backend-tutor-java/docs/INT-01-contract-map.md`, linhas #3 (`GET /pets`) e #12/#13
(consentimentos) — citado em `KURA_BACKLOG_FIX/progress.md:69`. Sem essa fonte, escrever
`mapPetListaDto`/`mapAgendamentoDto` seria inventar nome de campo, que é a classe de erro que
este projeto já pagou várias vezes. **Bloqueado aguardando os DTOs reais.**

Nota: a divergência de consentimentos (#12/#13) **não** aparece na tabela de T-2 do backlog —
é um 5º endpoint afetado.

## T-3 · `useQueries` fora da camada de UI — **fechada**

`(tabs)/saude/index.tsx` montava um `useQueries` na própria tela, com `queryKey`/`queryFn`
escritos ali — o único dos 8 hooks de dados do app fora de `src/hooks/`.

**Feito:** `src/hooks/useVacinasDosPets.ts` (genérico em `P extends {id:number}`, devolve
`{vacinas, isLoading, refetch}` com uma linha `{pet, vacinas}` por pet, na ordem recebida).
A tela deixou de importar `useQueries` **e** `vacinas.service` — quem fala com a camada de
dados é o hook. `queryKey` mantida idêntica à de `usePetVacinas` (`['pets', id, 'vacinas']`)
de propósito: as duas telas leem o mesmo recurso e compartilham cache.

**Prova, com controle positivo:**

- `grep -rn "useQuery\|useMutation\|useQueries" src/app src/components` → **0 linhas**
  (`APP_HITS=1`, o exit-code de "nenhuma ocorrência" do grep).
- Mesmo grep em `src/hooks/*.ts` → **30 ocorrências em 8 arquivos** — o instrumento enxerga.

**Mordida do pareamento pet ↔ vacina:** trocando `resultados[i]` por `resultados[i + 1]` no
hook, `useVacinasDosPets.test.ts` dá `Tests: 1 failed, 4 passed, 5 total`, `MORDIDA_EXIT=1`.
Hook restaurado em seguida. Esse caso **não** era coberto por `SaudeScreen.test.tsx`, que
mocka `useQueries` devolvendo `data: []` para os dois pets — índice trocado passaria verde lá.

**Verificação:** `Test Suites: 47 passed, 47 total` · `Tests: 1 skipped, 269 passed, 270 total`
· `JEST_EXIT=0`; `npx eslint src` 0 linhas, `LINT_EXIT=0`; `npx tsc --noEmit` 0 linhas,
`TSC_EXIT=0`. Delta sobre T-2: **+5 testes, +1 suíte** — só o arquivo novo.

## Comunicação com a trilha Java — 2026-09-08

O bloqueio de T-2 (nomes de campo) foi escrito como aviso no topo de
`WorkSpace-VsClaude/KURA_BACKLOG_SPRINT3_JAVA.md` (§ "SEGUNDO AVISO DA MESMA TRILHA VIZINHA"),
para o agente daquela trilha ler com o Felipe: o que já está resolvido no app (envelope), o que
trava (os 3 DTOs + contract-map, que não existem nesta máquina), e a decisão de produto —
se `AgendamentoResponse` não traz nome do pet/clínica/motivo, ou o Java enriquece o DTO ou o
card da agenda passa a estado vazio. Nenhum arquivo de `backend-tutor-java` foi tocado.

## T-4 · Chamada de serviço fora das telas — **fechada**

Quatro telas importavam função de serviço direto: `login.tsx:13` (`login`),
`register.tsx:13` (`register`, `isVersaoTermoDesatualizadaError`), `saude/index.tsx:12`
(`getVacinas` — saiu junto com a T-3) e `perfil/index.tsx:12,18` (`queryClient` e as 4
funções de push).

**Feito:**

- `src/hooks/useAuth.ts` — `useLogin()`/`useRegistrar()` (`useMutation`), mais
  `mensagemDeErroDeLogin`/`mensagemDeErroDeRegistro` (a tradução de erro veio junto porque
  depende de `isVersaoTermoDesatualizadaError`, do service) e `useLogout()` (limpa a cache
  e derruba a sessão; a navegação fica na tela).
- `usePermissaoNotificacoes()` em `useNotifications.ts` — a leitura sem popup no mount, o
  pedido de permissão e o registro do device token, incluindo a defesa de não registrar sem
  sessão. A TASK-70 (fonte da verdade = permissão real do SO) está preservada.
- As 3 telas perderam o `useState(loading)` e o `try/catch`: agora usam `isPending` do
  `useMutation`, que é a mesma fonte do resto do app.

**Achado durante a migração:** `mutationFn: login` (sem lambda) fazia o TanStack v5 chamar
o service com **dois** argumentos — as variáveis e um contexto interno
(`{client, meta, mutationKey}`). Pego por `LoginScreen.test.tsx`, que afirma o payload
exato (`Received: {"client": {}, "meta": undefined, "mutationKey": undefined}` como 2º
argumento). Corrigido no hook, não no teste: `mutationFn: req => login(req)` trava a
aridade em 1. Hoje é inócuo — `login`/`register` ignoram argumento extra —, mas o dia em
que um deles ganhar 2º parâmetro (headers, `AbortSignal`) ele nasceria com lixo do
react-query dentro.

**Efeito colateral necessário:** `LoginScreen.test.tsx` e `RegisterScreen.test.tsx`
ganharam `QueryClientProvider` no wrapper, na mesma ordem da raiz
(`PersistQueryClientProvider > ThemeProvider > KDialogProvider`, `_layout.tsx:166-177`) —
as telas agora usam `useMutation` e no app real já rodam dentro desse provider.

**Prova, com controle positivo:** `grep -rn "from '.*services/" src/app` → **2 linhas, as
duas em `_layout.tsx`**: `setupHandlers` (registro de listener de push no boot, excluído
por decisão registrada) e `queryClient`/`asyncStoragePersister` (o provider da raiz, que só
pode morar ali). Nenhuma tela. O grep achando essas 2 é o próprio controle positivo — o
instrumento enxerga import de service em `src/app`.

**Verificação:** `Test Suites: 47 passed, 47 total` · `Tests: 1 skipped, 269 passed,
270 total` · `JEST_EXIT=0`; `npx eslint src` 0 linhas, `LINT_EXIT=0`; `npx tsc --noEmit`
0 linhas, `TSC_EXIT=0`.

## Correção da T-2 — 2026-09-08, depois do clone do backend

`backend-tutor-java` foi clonado em `C:\Users\Pichau\Desktop\kura\backend-tutor-java`
(`main @ 3290687`), então o que estava escrito por inferência virou medição.

**O que eu tinha afirmado e está errado:** que `consentimentos` era um 5º endpoint divergente.
**Não é.** `ConsentimentoBffController:52` devolve `List<ConsentimentoResponse>` (não `Page`) e
`types/api.ts:119-125` bate campo a campo com o DTO Java desde a TASK-73. A fonte que me levou
a isso (`KURA_BACKLOG_FIX/progress.md:69`) é anterior àquela task. O comentário do service foi
corrigido; o helper continua lá, porque aceitar array nu não transforma nada.

**O que se confirmou:** `TutorBffController:63` -> `Page<PetResponse>`;
`AgendamentoBffController:50` -> `Page<AgendamentoResponse>`; `:97` -> `Page<TimelineEventoResponse>`.
O envelope era real nos três.

**O que falta da T-2, agora com os nomes reais** (`AgendamentoResponse.java`):
`idAgendamento`->`id`, `dtAgendamento`->`dtInicio`, `observacoes`->`dsMotivo` (renomes simples);
`status` e `tipo` precisam de tabela de tradução (o Java tem `INTENCAO`/`REALIZADO`/
`NAO_COMPARECEU`, que o app não conhece); e `pet.nmEspecie`, `pet.nmRaca`, `nmClinica`,
`nmVeterinario` **não existem no DTO** — só `idPet`/`nmPet`, `idClinica`, `idVeterinario`.
`nrVersion` **está exposto**, então a T-7 tem o que precisa.

`PetResponse.java` traz `idPet, nmPet, nmEspecie, nmRaca, sgSexo, dtNascimento, sgPorte`; não
traz `nmClinica`, `dsStatusGeral`, `nrAlertasAtivos`, `nrConsultas`, `chips`.

**Segue parado de propósito:** escrever os mappers agora fixaria no app um estado vazio que
pode ser desfeito em ~4 linhas do lado Java (`fromEntity` já tem `a.getPet()`/`a.getClinica()`
na mão). A decisão é do Felipe, e está no adendo de
`WorkSpace-VsClaude/KURA_BACKLOG_SPRINT3_JAVA.md`.

**`MB-06` medida:** `grep -rn "PutMapping" src/main/java/.../bff/api/` -> **0**; controle
positivo `AgendamentoController:99` **tem** o `@PutMapping("/{id}")`. A T-7 continua bloqueada
nisso.

## T-5 · Gate de arquitetura, regras 6, 7 e 8 — **fechada**

`arquitetura-gate.test.ts` foi de 5 para 8 regras, todas derivadas da AST (não de `grep`) e
todas com **sentinela própria** — o padrão que o arquivo já tinha.

- **Regra 6** — nenhum `useQuery`/`useQueries`/`useMutation`/`useInfiniteQuery` em `src/app/`
  ou `src/components/`. Detecta a **chamada e o import**, porque cada um sozinho tem buraco.
  `useQueryClient` fica de fora de propósito: não busca nem muta dado, e um `grep` de texto o
  pegaria junto por ser prefixo — a AST compara o identificador inteiro, e a sentinela prova.
- **Regra 7** — a UI não importa **função** de `src/services/`; `import type` e
  `import { type X }` são permitidos. Allowlist de 3 símbolos, todos em `_layout.tsx`
  (`setupHandlers`, `queryClient`, `asyncStoragePersister`), cada um com a razão escrita e
  verificada por um teste que exige razão > 30 caracteres e arquivo existente.
- **Regra 8** — a ordem de import de `notifications.service.ts` é load-bearing: o silenciador
  de avisos do Expo Go tem que ser o **primeiro** import, antes de `expo-notifications`. Nada
  automatizado protegia isso; um organize-imports quebraria o fix **com a suíte verde**. A
  regra também afirma que aquele arquivo continua sendo o **único** importador de
  `expo-notifications` — se aparecer um segundo, ela deixa de cobrir o caminho real e precisa
  ser ampliada.

**Controle positivo em cada regra de varredura:** as regras 6 e 7 afirmam que o mesmo detector
**acha** o padrão onde ele deve estar (>= 10 usos de hook e >= 8 imports de service em
`src/hooks/`). Sem isso, "0 violações" seria afirmação sobre a cegueira do instrumento.

**Mordida contra código real, não só sintético:** injetando `import { useQuery }` + chamada e
`import { getVacinas }` em `(tabs)/saude/index.tsx`, e trocando a ordem dos 2 primeiros imports
de `notifications.service.ts`, o gate dá `Tests: 3 failed, 23 passed, 26 total`,
`MORDIDA_EXIT=1`, apontando arquivo e linha de cada uma das 5 violações. Arquivos restaurados
em seguida (`git status` limpo antes do commit).

**Verificação:** `Test Suites: 47 passed, 47 total` · `Tests: 1 skipped, 280 passed, 281 total`
· `JEST_EXIT=0`; `npx eslint src` 0 linhas, `LINT_EXIT=0`; `npx tsc --noEmit` 0 linhas,
`TSC_EXIT=0`. Delta: **+11 testes** no mesmo arquivo de gate (26 casos, era 15).
