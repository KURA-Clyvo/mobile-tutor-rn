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
