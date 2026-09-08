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

## T-6 · Horários da agenda vindos de dado real — **fechada**

`agenda/novo.tsx` declarava `SLOTS` (16 horários) e
`INDISPONIVEIS = new Set(['10:00','11:30','14:00','16:30'])` — horários que o tutor via como
ocupados sem que nada tivesse sido consultado, no fluxo principal do app. E um horário que ele
mesmo acabara de marcar continuava aparecendo livre.

**Feito:**

- `src/constants/agenda.ts` — `GRADE_HORARIOS_PADRAO`, com o comentário dizendo que é
  **horário comercial da clínica, não disponibilidade**.
- `src/hooks/useHorariosOcupados.ts` — cruza a grade com os agendamentos do dia vindos do
  `GET /v1/tutor/agendamentos`. Mesma `queryKey ['agendamentos']` que as mutações já
  invalidam, então marcar um horário o tira da grade **sem reiniciar o app**. Cancelado
  devolve o horário para a grade.
- `horarioJaPassou()` no mesmo hook: horário de hoje já vencido sai da oferta. O Java valida
  `dtAgendamento` com `@Future` (`AgendamentoRequest`), então oferecer passado era **400
  garantido** — o tutor levava erro genérico por uma escolha que a própria tela permitiu.

**Limite declarado, no código:** o app só enxerga os agendamentos **deste tutor**. Isto não é a
agenda da clínica — não existe endpoint de disponibilidade hoje, e inventar "livre" que o
servidor não sustenta seria pior que o Set fixo removido.

**Prova:** `grep -rn "INDISPONIVEIS" src/` → **3 linhas, todas comentário** (`constants/agenda.ts:11`,
`useHorariosOcupados.ts:17,26`, explicando o que foi removido); **0 como código**. Não vou
reportar isso como "0 ocorrências": o comando literal do backlog devolve 3, e quem repetir tem
que achar o mesmo número que eu achei. Controle positivo: `grep -rn "GRADE_HORARIOS_PADRAO" src/`
→ 4 linhas, incluindo o uso real em `novo.tsx:192`.

**Mordida do bug original:** o teste "um agendamento novo muda a grade" falha por construção
contra a versão antiga — lá o Set era constante de módulo, então nenhum dado mudava a grade.

**Verificação:** `Test Suites: 48 passed, 48 total` · `Tests: 1 skipped, 289 passed, 290 total`
· `JEST_EXIT=0`; `npx eslint src` 0 linhas, `LINT_EXIT=0`; `npx tsc --noEmit` 0 linhas,
`TSC_EXIT=0`. Delta: **+9 testes, +1 suíte**.

## T-8 · README — **fechada**

Era 49 linhas, sem descrição do problema, sem descrição da solução e sem seção de tecnologias —
os três itens que a rubrica pede textualmente.

**Acrescentado no topo:** **O problema** (a clínica de bairro com agenda, prontuário e
comunicação em três lugares que não conversam, e o custo caindo no tutor), **A solução** (os 5
componentes do ecossistema, o que este app resolve, e as duas fronteiras que o código respeita:
o tutor nunca fala com o `.NET`; agendamento nasce como solicitação) e **Tecnologias com
versão** — todas lidas do `package.json`, não de memória: RN 0.81.5, Expo SDK 54, expo-router
6.0.23, TanStack Query 5.100.10, Zustand 5.0.13, react-hook-form 7.75.0, Zod 4.4.3, Axios
1.16.1, TypeScript 5.3 (`strict: true`, `tsconfig.json:4`).

**Removido:**

- **O link do vídeo** (`youtu.be/F62_LPbJORQ`), anterior à Sprint 3. `grep -n "youtu" README.md`
  → 0.
- **A seção "Limitações v1" inteira** — ela entregava ao avaliador a redação da penalidade VI
  ("Slots de agenda mockados", "pode não ter endpoint POST", "pode não estar exposto ainda").
  `grep -n "Limitações v1\|pode não" README.md` → 0; controle positivo: `grep -c "Limitações
  conhecidas"` → 1.

**Cada um dos 6 itens foi reconciliado com o código antes de sumir ou mudar de lugar:**

| Item v1 | Destino | Medição |
|---|---|---|
| 1. Slots mockados | **apagado** — resolvido pela T-6 | `INDISPONIVEIS` não existe mais como código |
| 2. "pode não ter POST /pets" | virou fato em `docs/` | `grep -rn "PostMapping" TutorBffController.java` → **0**; controle positivo: `AgendamentoBffController:62` tem |
| 3. Luna não integrada | `docs/` | segue verdade |
| 4. "GET /notificacoes pode não estar exposto" | **apagado** — está exposto | `NotificacaoBffController:44`, `@GetMapping` |
| 5. Push sem `extra.eas.projectId` | `docs/` | `grep -n "eas\|projectId" app.json` → **0** |
| 6. Teleconsulta por `Linking` | `docs/` | é decisão, não pendência |

Mais um item novo em `docs/limitacoes-conhecidas.md`: a divergência de nomes de campo que a T-2
não fechou, e o limite do "ocupado" da agenda (é a agenda deste tutor, não a disponibilidade da
clínica).

**Duas afirmações do texto novo foram atenuadas por não terem prova de runtime:** a seção de
navegação diz o que está **declarado** (`Stack.Protected` com o guard na sessão) e o que o teste
**afirma** (`guarda-rotas.test.tsx` renderiza sem sessão e checa que `(tabs)` não monta) — não
"link direto cai no login", que ninguém executou num aparelho. E diz explicitamente que é
controle de acesso na navegação, **não** proteção de dado.

**Correções factuais no que já existia:** o script `f09-mutation-proof.sh` cobre as regras 1–5;
com o gate agora em 8 regras, a frase "as 5 regressões que o gate cobre" ficaria falsa. E
`check:colors`/`check:no-ocean` ganharam o aviso de que são scripts POSIX que falham no Windows
(`npm run` executa via `cmd.exe`) — o README prometia um comando que não roda na máquina onde
está sendo lido.

**Verificação:** `Test Suites: 48 passed, 48 total` · `Tests: 1 skipped, 289 passed, 290 total`
· `JEST_EXIT=0`.

## T-7 · CRUD — **item B já estava pronto; item A bloqueado**

Medido antes de implementar: **revogar consentimento já está inteiro** —
`consentimentos.service.ts::revogar` (POST com `aceito:'N'`, insert-only por LGPD, decisão da
TASK-31), `useRevogar` com `invalidateQueries(['consentimentos'])`, e a tela
`perfil/consentimentos.tsx:49-56` com confirmação via `useDialog` antes de revogar. Nada a
fazer.

**Item A (remarcar agendamento) continua bloqueado no Java:** `grep -rn "PutMapping"
.../bff/api/` → **0**. O `nrVersion` que o `PUT` exige **já está exposto** em
`AgendamentoResponse`, então do lado do app falta só a chamada — mas construir service, hook e
botão contra um endpoint que responde 404 seria escrever código que promete o que o sistema não
faz.

## T-2 · Nomes de campo — **fechada** (08/09, com os DTOs em mãos)

A trilha Java respondeu com os 3 DTOs transcritos campo a campo, mais os valores de enum que o
`…` do backlog escondia, e **travou os nomes** dos campos que a `SJ3-10` vai acrescentar:
`nmEspecie`, `nmRaca`, `nmClinica`, **no nível raiz** de `AgendamentoResponse` (não aninhados em
`pet`). Com isso o mapper pôde ser escrito inteiro de uma vez, sem segunda rodada.

**Feito:**

- `types/api.ts`: `PetListaRaw` (7 campos) e `AgendamentoRaw` (17), transcritos do Java.
- `utils/mappers.ts`: `mapPetListaDto` e `mapAgendamentoDto`, com as duas tabelas de tradução
  de **valor** — `status` (`INTENCAO`→`SOLICITADO`, `REALIZADO`/`NAO_COMPARECEU`→`CONCLUIDO`) e
  `tipo` (o inverso do `mapTipoParaJava` que já existia).
- Os services passam a devolver o tipo app-facing traduzido. **Nenhuma tela mudou de fluxo.**

**O que ficou ausente, e por quê:** `dsStatusGeral`, `nrAlertasAtivos` e `chips` **não existem
em lugar nenhum do Java** — `nrAlertasAtivos` é alerta de IoT, dado do backend `.NET`. Viraram
opcionais em `PetTutorResponse` e `PetDomain`, e as telas degradam: o card mostra `—` em STATUS
em vez de "Tudo certo", que seria uma afirmação sobre a saúde do pet que ninguém apurou;
`usePets` ordena pet sem status **no fim**, não no meio, porque o topo é de quem tem urgência
conhecida.

**`nmVeterinario`: respondido que NÃO é preciso.** Medido antes de responder —
`grep -rn "nmVeterinario" src/app src/components/domain/AgendamentoItem.tsx` → **0**. O card da
agenda nunca o renderizou. Os dois lugares que o usam (`ConsultasTab`, `VacinaItem`) vêm de
outros DTOs e já o tratam como opcional, escondendo a linha. Ele exigiria `@ManyToOne` novo numa
entidade compartilhada com o `.NET`, a 4 dias da entrega — e não é preciso.

**O achado desta rodada:** trocar o service **sem** trocar o mock deixaria a suíte verde com o
modo mock quebrado. Os mocks de pets e agendamentos devolviam o shape app-facing, então o mapper
receberia `id` onde espera `idPet`. Corrigido junto: os dois mocks passaram a devolver
`Page<T>` com o shape **cru** do Java, mesma disciplina da TASK-65 em `getPetById`.

**Por que ninguém tinha visto:** `mock-contract-audit.test.ts` afirmava só
`expect(Array.isArray(pets)).toBe(true)` para as duas listas — e **um array de objetos
corrompidos é um array**. As asserções agora descem ao campo (`typeof p.id === 'number'`, os 5
valores possíveis de `sgStatus`, e a ausência declarada de `dsStatusGeral`/`chips`).

**Mordida:** com os mocks crus e os 2 services revertidos a `6cf5bc9`, a auditoria de mock dá
`Tests: 1 failed, 11 passed, 12 total`, `MORDIDA_EXIT=1`, com `typeof p.id` → `"undefined"` —
literalmente o bug que apareceria no dia em que o mock fosse desligado.

**Consequência assumida no modo demonstração:** a lista de pets deixa de mostrar chips e status,
porque o servidor real também não os manda. É a mesma tela que o avaliador veria contra a API de
verdade — um mock mais rico que o servidor é exatamente o que escondeu este contrato por 6
ciclos.

**Verificação:** `Test Suites: 48 passed, 48 total` · `Tests: 1 skipped, 297 passed, 298 total`
· `JEST_EXIT=0`; `npx eslint src` 0 linhas, `LINT_EXIT=0`; `npx tsc --noEmit` 0 linhas,
`TSC_EXIT=0`. Delta: **+8 testes**.

**Processo:** o aviso desta trilha no `KURA_BACKLOG_SPRINT3_JAVA.md` estava em commit local e
nunca chegou ao `origin` — a trilha Java mediu isso (`grep -c "SEGUNDO AVISO"` no `origin` → 0).
Commitado, rebaseado sobre a resposta deles (conflito resolvido mantendo os dois lados, pergunta
antes da resposta) e pushado: `2f55db8`. Confirmado no `origin`: `grep -c` → 4.

## T-7a · Remarcar agendamento — **fechada** (o `U` que faltava)

Destravada no meio da sessão: a `SJ3-10` do backend foi mesclada em `main` (`9d3d4b6` +
`90b4c25` + `ff6384c`) e trouxe **as duas coisas** — os 3 campos novos em
`AgendamentoResponse` e o `@PutMapping("/{id}")` no BFF (`AgendamentoBffController:85`), que
era a `MB-06`. Medido antes de escrever qualquer linha: `grep -rn "PutMapping" .../bff/api/` →
**1 ocorrência** (era 0 pela manhã).

**⇒ `GET` · `POST` · `PUT` · `DELETE` — os 4 verbos existem em agendamentos.**
`grep -n "apiClient\.(get|post|put|delete)" src/services/agendamentos.service.ts` → 4 linhas.

**O contrato tem uma armadilha, e ela é o motivo de a camada anticorrupção existir:** o `PUT`
usa **nomes diferentes do `POST`** para os mesmos conceitos —
`dsTipoConsulta`/`dsObservacoes` contra `tipo`/`observacoes`. Um `PUT` montado por analogia com
o `POST` mandaria `tipo`, o Jackson o **ignoraria em silêncio**, e o agendamento seria salvo
sem a mudança: sem 400, sem crash, sem rastro. Mesmo formato do bug que a TASK-74b corrigiu no
`POST`.

**O que é enviado, e o que não é:** só `dtAgendamento` + `nrVersion`. `Agendamento.atualizar`
(domínio, linha 149) **ignora campo nulo**, então tipo e motivo do agendamento original são
preservados. Mandar string vazia no motivo **apagaria** o que o tutor escreveu ao solicitar —
por isso a tela esconde o campo MOTIVO no modo remarcar, em vez de pedi-lo de novo.

**Os erros ganharam mensagem humana**, porque cada um pede uma ação diferente do tutor:
`409` → *"Este horário mudou. Recarregue e tente de novo."* (o optimistic lock disparou: alguém
mexeu no agendamento entre a leitura e o envio); `422` → *"já foi concluído ou cancelado"*
(guarda de status final no domínio); `403` → *"não é seu"*.

**UI:** botão **Remarcar** visível no card (o cancelar é toque longo — gesto escondido não se
narra em vídeo), e a tela de agendamento é reaproveitada em modo remarcar: mesma grade de dias
e horários, já sabendo quais estão ocupados (T-6). O botão **não aparece** sem `nrVersion` —
o `PUT` devolveria 400, e é melhor não oferecer que oferecer e falhar.

**Mock:** rota de `PUT` nova, com despacho **explícito por método** — `PUT` e `DELETE`
compartilham a mesma URL, e a rota de agendamentos já foi cega a método uma vez (TASK-65, `GET`
e `POST` em `/agendamentos`), com o bug sobrevivendo ciclos. O mock **valida `nrVersion`** como
o Java valida (`@NotNull`), então um app que pare de mandar a versão quebra no modo mock em vez
de passar verde e falhar só contra o servidor real.

**Mordida — o `PUT` escrito "por analogia com o POST"** (nomes do POST, sem `nrVersion`, data
com `Z`): `Tests: 5 failed, 15 passed, 20 total`, `MORDIDA_EXIT=1`, e o mock rejeita com a
mensagem nomeando o campo que falta.

**Um gate do próprio repo pegou a função nova antes de mim:** `smoke-coverage.test.ts` derruba
a suíte quando uma função de rede descoberta por AST não tem entrada no registry do
`smoke-contratos.sh`. Entrada registrada como **`naoCoberto`**, não `coberto` — o script do
`DevOps-Cloud` não tem check para um `PUT` que nasceu hoje, e alegar cobertura inexistente é
exatamente o que aquele registry existe para impedir. Resumo impresso: **16 cobertos / 1 não
coberto / 17 funções de rede**.

**Verificação:** `Test Suites: 49 passed, 49 total` · `Tests: 1 skipped, 306 passed, 307 total`
· `JEST_EXIT=0`; `npx eslint src tools` 0 linhas, `LINT_EXIT=0`; `npx tsc --noEmit` 0 linhas,
`TSC_EXIT=0`.

⬜ **O que esta task NÃO provou:** o percurso dos 4 verbos **pela interface**, à mão, num
aparelho. A prova é de contrato (service × mock × DTO Java), não de runtime — e é isso que o
vídeo (`T-11`) tem que mostrar.
