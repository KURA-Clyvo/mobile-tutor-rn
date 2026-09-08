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
