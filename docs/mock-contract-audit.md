# Auditoria de contrato mock × consumidor — TASK-65 (`KURA_BACKLOG_FIX_5.md`) + TASK-71 (`KURA_BACKLOG_FIX_6.md`)

> Varredura sistemática, nos dois apps mobile, de todo par `src/services/*.service.ts`
> (função exportada) × rota correspondente em `src/services/api/mock-adapter.ts`. Análogo
> exato da TASK-60 do `KURA_BACKLOG_FIX_4.md` (que varreu DTO × coluna `NOT NULL` no
> `.NET`), mas para a classe de bug que a TASK-64 achou por acaso: **o mock é um segundo
> consumidor de resposta de cada service function, e nenhum gate deste projeto (G0→G4 do
> FIX_4) jamais o exercitou** — ver `KURA_BACKLOG_FIX_5.md` §"Regra de ouro versão 5".
>
> Método: **todo par transformador foi executado**, nenhum foi classificado por leitura —
> é neles que mora esta classe de bug. Execução com `EXPO_PUBLIC_USE_MOCKS='true'`, sem
> `jest.mock` do `apiClient`/`mock-adapter`, no mesmo padrão do `auth.mock-contract.test.ts`
> (TASK-64). Ver:
> - `mobile-tutor-rn/src/__tests__/mock-contract-audit.test.ts` (12 casos, TASK-71 adicionou
>   1 líquido: `cancelarAgendamento` passou de "rejeita com erro" para "executa com sucesso"
>   + 1 caso novo de não-regressão GET/POST/DELETE)
> - `mobile-clinica-rn/tests/mock-contract-audit.test.ts` (10 casos, TASK-71 adicionou 2:
>   `criarOuObterSala`/`obterSala` passaram de "rejeita com erro" para "executa com sucesso"
>   + 1 caso de não-confusão POST/GET na mesma rota)
>
> ⚠️ **Precisão sobre a cobertura** (correção da revisão G2, achado `Minor` #4): 6 pares
> `pass-through` da clínica (`registerClinica`, `criarPrescricao`, `enviarTranscricao`,
> `confirmarSoap`, `gerarReceituario`, `getRelatorioTriagens`) estão marcados como
> classificados **por leitura**, não por execução. O revisor releu os 6 de forma
> independente e confirmou a classificação (todos são `const { data } = await ...; return
> data;` puro, sem transformação — logo sem superfície para esta classe de bug). A
> afirmação original "nada foi classificado por leitura" era um overstatement do texto, não
> uma varredura frouxa. (`obterSala` saiu desta lista na TASK-71 — deixou de ser "sem mock,
> classificado por leitura" e passou a ser executado de verdade, ver tabela abaixo.)
>
> Um grep único (`res.data`) **não cobre** — o código usa pelo menos 3 idiomas para
> desembrulhar o axios (`.then(r => r.data)`, `.then(r => mapper(r.data))`,
> `const {data} = await ...`). Cada função exportada foi lida e executada individualmente.
>
> **TASK-71 (FIX_6)** fechou 2 das 3 rotas que a TASK-65 tinha deixado de propósito sem
> mock (aquela task corrigia *shape mismatch*, não adicionava mock ausente — "adicionar
> mock" virou escopo só nesta task). Mesma disciplina: mock adicionado, testado por
> execução real (não leitura), fixture conferido contra o DTO real do backend
> correspondente. A 3ª rota (`registerDeviceToken`) foi reavaliada e **decidida
> deliberadamente sem mock** — justificativa no describe correspondente de
> `src/__tests__/mock-contract-audit.test.ts`.

## Resultado em números

| App | Pares auditados | Transformadores quebrados (corrigidos) | Pass-throughs OK | Rotas sem mock |
|---|---|---|---|---|
| `mobile-tutor-rn` | 12 | 6 | 7 | 1 (decisão deliberada, não gap) |
| `mobile-clinica-rn` | 13 | 4 | 11 | 0 |

10 pares corrigidos por shape mismatch no total pela TASK-65 — nenhum "não achei nada"
aqui (diferente da possibilidade prevista no brief da TASK-65: "se a varredura não achar
mais nada, resultado válido"). Este ciclo achou bastante, incluindo dois achados **P0**
(crash na tela inicial da clínica e na agenda) que não faziam parte da hipótese original
do backlog (que citava só `register()`, já corrigido pela TASK-64). A TASK-71 fechou mais
2 pares por classe diferente (mock ausente, não shape mismatch): `cancelarAgendamento`
(tutor) e `criarOuObterSala`/`obterSala` (clínica, mesma rota, 1 handler despachando por
método).

---

## `mobile-tutor-rn`

| Service · função | Rota no adapter | Classe | Executado? | Resultado antes do fix | Ação |
|---|---|---|---|---|---|
| `auth.service.ts::login` | `/auth/login$` | pass-through | ✓ | OK | nenhuma (já correto, TASK-64 confirmou) |
| `auth.service.ts::register` | `/auth/register-invite$` | transformador | ✓ | OK (TASK-64 já fechou) | nenhuma nesta task |
| `pets.service.ts::listPets` | `/tutor/pets$` | pass-through | ✓ | OK | nenhuma |
| `pets.service.ts::getPetById` | `/tutor/pets/\d+$` | **transformador** | ✓ | `id: undefined`; peso/temperatura/FC/condições descartados (mock devolvia `PetTutorDetailResponse` app-facing, service espera `PetDetalheRaw`) | **corrigido** — `byId()` devolve `PetDetalheRaw` |
| `timeline.service.ts::getTimeline` | `/tutor/pets/\d+/timeline$` | **transformador** | ✓ | `TypeError: Cannot read properties of undefined (reading 'map')` — mock devolvia array nu, service espera `PageRaw<T>.content` | **corrigido** — `timeline()` devolve `PageRaw<TimelineEventoRaw>` |
| `timeline.service.ts::getEventDetail` | `/tutor/pets/\d+/timeline/\d+$` (nova) | **transformador** | ✓ | `{}` (objeto vazio) — regex antiga sem `$` fazia a rota de lista "sequestrar" a URL de detalhe (B0.4) | **corrigido** — rota dedicada anchorada + `timelineDetail()` novo |
| `vacinas.service.ts::getVacinas` | `/tutor/pets/\d+/vacinas$` | **transformador** | ✓ | dados corrompidos: `id` calculado com `idPet` undefined, `dtAplicacao` virava `"Invalid Date"` string em item sem `dtProximaDose` | **corrigido** — `list()` devolve `VacinaVencendoRaw[]` |
| `vacinas.service.ts::getVacinaStatus` | `/tutor/pets/\d+/vacinas/status$` | **transformador** | ✓ | `nrTotal: undefined` | **corrigido** — `status()` devolve `VacinaStatusRaw` |
| `notifications.service.ts::getNotificacoes` | `/tutor/notificacoes$` | **transformador** | ✓ | `TypeError: Cannot read properties of undefined (reading 'map')` — mesma causa de `getTimeline` | **corrigido** — `list()` devolve `PageRaw<NotificacaoRaw>` |
| `notifications.service.ts::marcarLida` | — (local, sem rede de propósito) | n/a | — | n/a | fora de escopo — decisão travada na TASK-31 |
| `notifications.service.ts::marcarTodasLidas` | — (local, sem rede de propósito) | n/a | — | n/a | fora de escopo — decisão travada na TASK-31 |
| `notifications.service.ts::registerDeviceToken` | `/tutor/me/push-token` | **sem mock** | ✓ | `Error: No mock for PATCH .../me/push-token` — mas o service tem `try/catch` próprio (`notifications.service.ts:61-75`, TASK-70) e não propaga, devolvendo `false` | **decisão deliberada, TASK-71 (FIX_6): sem mock.** Reavaliada à luz do estado pós-TASK-70: chamada só em background (`usePushTokenSync`), nenhuma tela trata o retorno como erro visível, e um mock só trocaria `false` (falha silenciosa correta) por `true` (sucesso silencioso) — sem efeito observável em demo. Justificativa completa no teste. |
| `agendamentos.service.ts::listAgendamentos` | `/tutor/agendamentos$` (GET) | pass-through | ✓ | OK | nenhuma |
| `agendamentos.service.ts::solicitarAgendamento` | `/tutor/agendamentos$` (POST) | pass-through (mas rota do adapter era cega a método) | ✓ | devolvia o **array** de `agendaMock.list()` em vez do objeto de `agendaMock.criar()` (existia no mock, nunca era chamado) | **corrigido** — rota agora despacha por `c.method` |
| `agendamentos.service.ts::cancelarAgendamento` | `/tutor/agendamentos/\d+$` (DELETE, rota nova) | pass-through | ✓ | `Error: No mock for DELETE .../agendamentos/{id}` | **corrigido, TASK-71 (FIX_6)** — `cancelar()` novo em `agendamentos.mock.ts`, devolve `CancelarAgendamentoResponse` (`{id, sgStatus:'CANCELADO'}`, o próprio tipo app-facing — pass-through sem mapper, sem camada anti-corrupção a respeitar). Regex ancorada com `\d+$`, não reabre a cegueira a método que a TASK-65 corrigiu na rota `/tutor/agendamentos$` (GET/POST) — as duas URLs são distintas por construção. Nota de contrato REAL (fora de escopo): o endpoint Java (`AgendamentoBffController.java:84-99`) devolve HTTP 204 sem corpo, não `{id,sgStatus}` — mismatch pré-existente do modo real, não desta task. |
| `consentimentos.service.ts::listConsentimentos` | `/tutor/consentimentos$` (GET) | pass-through | ✓ | OK | nenhuma |
| `consentimentos.service.ts::assinar` | `/tutor/consentimentos$` (POST) | pass-through | ✓ | OK | nenhuma |
| `consentimentos.service.ts::revogar` | `/tutor/consentimentos$` (POST, mesmo endpoint de `assinar`) | pass-through (mas rota do adapter ignorava o corpo) | ✓ | devolvia `sgStatus: 'ATIVO'` fixo pra **qualquer** POST — `revogar()` recebia de volta o oposto do que pediu (`RevogarConsentimentoResponse.sgStatus` deveria ser `'REVOGADO'`) | **corrigido** — handler agora lê `dsAceite` do corpo pra decidir ATIVO vs REVOGADO |
| `auth.service.ts::isVersaoTermoDesatualizadaError` (helper, `auth.service.ts:99`) | n/a — não faz chamada de rede | n/a | — | n/a | fora de escopo (utilitário puro, sem HTTP) |
| `notifications.service.ts::requestPermission` | n/a — wrapper de `expo-notifications` | n/a | — | n/a | fora de escopo (não passa pelo `apiClient`) |
| `notifications.service.ts::getDeviceToken` | n/a — wrapper de `expo-notifications` | n/a | — | n/a | fora de escopo (não passa pelo `apiClient`) |
| `notifications.service.ts::setupHandlers` | n/a — wrapper de `expo-notifications` | n/a | — | n/a | fora de escopo (não passa pelo `apiClient`) |

### Achados corrigidos — árvore causal resumida

1. **`getPetById`** (`src/mocks/pets.mock.ts::byId`) — mock devolvia
   `PetTutorDetailResponse` (tipo de SAÍDA de `mapPetDetailDto`) onde o service espera
   `PetDetalheRaw` (tipo de ENTRADA). Mesma classe exata do B0.1 (`register()`/TASK-64).
2. **`getTimeline`/`getNotificacoes`** — ambos esperam `PageRaw<T>` (Spring Data Page,
   `.content`); os mocks devolviam array nu. `.content` batia `undefined`, `.map` lançava.
3. **`getEventDetail`** — a regex antiga do adapter (`/timeline`, sem `$`) casava com
   `/timeline/:idEvento` também, roteando para o handler de LISTA. `mapTimelineEventoDetailDto`
   lia campos de um array (todos `undefined`) e devolvia `{}` — sem lançar, mas inútil.
4. **`getVacinas`/`getVacinaStatus`** — mesma classe do #1, mocks devolviam os tipos de
   saída (`VacinaTutorResponse`/`VacinaStatusResponse`) em vez dos de entrada
   (`VacinaVencendoRaw`/`VacinaStatusRaw`).
5. **`solicitarAgendamento`** — a rota do adapter para `/agendamentos` não olhava
   `config.method`: GET e POST caíam os dois em `agendaMock.list()`. O mock `criar()` já
   existia (com o shape certo, `{id, sgStatus:'SOLICITADO', dtSolicitacao}`) mas nunca era
   chamado pelo adapter.
6. **`revogar`** — achado durante a execução dos pass-throughs (item 5 do método: "não
   classificar por leitura" — este só apareceu rodando o teste, não na varredura por
   leitura). O handler POST de `/consentimentos` ignorava o corpo da requisição e sempre
   devolvia `sgStatus: 'ATIVO'`, mesmo quando `revogar()` mandava `dsAceite: 'NAO'`
   esperando `'REVOGADO'` de volta.

### Prova de regressão (antes/depois)

Todos os 6 fixes têm teste correspondente em `mock-contract-audit.test.ts` que **falhou**
contra o código antigo (rodado com `git stash` isolando só os arquivos de mock/adapter, sem
tocar o teste) e **passou** depois do fix. Saídas completas coladas no relatório da task.

### TASK-71 (FIX_6) — fecha `cancelarAgendamento`, reavalia `registerDeviceToken`

Das 3 rotas sem mock que a TASK-65 tinha deixado documentadas de propósito (não era
escopo dela adicionar mock ausente), esta task fechou `cancelarAgendamento` (ver linha
`agendamentos.service.ts::cancelarAgendamento` na tabela acima) e reavaliou
`registerDeviceToken` à luz do estado pós-TASK-70 (que reescreveu o mesmo service e
corrigiu um bug de contrato real, `dsPlatform` → `dsPlatforma`).

**`registerDeviceToken` continua sem mock — decisão deliberada, não gap.** O service já
tem `try/catch` próprio e devolve `boolean` (`notifications.service.ts:61-75`); é chamado
só em background (`usePushTokenSync`, `useNotifications.ts:57-72`), nunca a partir de uma
ação explícita do usuário, e nenhum código trata o retorno `false` como erro visível.
Adicionar mock só trocaria `false` (falha silenciosa, já correta) por `true` (sucesso
silencioso) — zero efeito observável em modo mock. Justificativa completa no teste
(`mock-contract-audit.test.ts`, describe `'rota sem mock — decisão revisitada nesta
task'`).

Teste de não-regressão: `cancelarAgendamento` tem prova de mordida (falha contra o
adapter antigo com `Error: No mock for DELETE ...`, passa depois do fix) mais um teste
dedicado provando que GET/POST/DELETE em `/tutor/agendamentos` não se confundem entre si
— a mesma classe de bug que a TASK-65 corrigiu para GET/POST (regex cega a método) não
reabre com a rota nova, porque a URL do DELETE (`/agendamentos/{id}`) é distinta por
construção da URL do GET/POST (`/agendamentos`, sem sufixo).

---

## `mobile-clinica-rn`

| Service · função | Rota no adapter | Classe | Executado? | Resultado antes do fix | Ação |
|---|---|---|---|---|---|
| `auth.service.ts::login` | `/auth/login$` | pass-through | ✓ | OK | nenhuma |
| `auth.service.ts::registerClinica` | `/auth/register-clinica$` | pass-through | leitura (tipo idêntico ao de `login`, mesmo padrão) | OK | nenhuma |
| `auth.service.ts::logout` | — (sem chamada de rede) | n/a | — | n/a | fora de escopo |
| `pets.service.ts::listPets` | `/pets$` | pass-through | ✓ | OK | nenhuma |
| `pets.service.ts::getPetById` | `/pets/\d+$` | pass-through | ✓ | OK | nenhuma |
| `pets.service.ts::getPetTimeline` | `/pets/\d+/timeline$` | pass-through | ✓ | OK | nenhuma |
| `dashboard.service.ts::getHoje` | `/dashboard/hoje$` | **transformador** | ✓ | `TypeError: Cannot read properties of undefined (reading 'length')` em `mapHoje` (`dto.ultimosPetsAtendidos.length`) — mock devolvia `DashboardHojeResponse` app-facing, service espera `DashboardHojeApiDto` | **corrigido** — `hoje()` devolve o DTO raw exportado de `dashboard.service.ts` |
| `dashboard.service.ts::getAlertas` | `/dashboard/alertas$` | **transformador** | ✓ | não lançava, mas todo alerta virava `dsTipoAlerta: 'RETORNO_PENDENTE'` (fallback genérico de `translateAlertaTipo`) porque `raw.tipo` não existia no shape antigo | **corrigido** — `alertas()` devolve `AlertaApiDto[]` (`tipo: 'TEMPERATURA'\|'VACINA_VENCENDO'`) |
| `dashboard.service.ts::getRecentes` | `/dashboard/recentes$` | **transformador** | ✓ | não lançava, mas `nmPet`/`nmTipoConsulta` saíam `undefined` e `sgStatus` sempre `'AGENDADA'` (campos do DTO raw — `nmPaciente`/`dsServico`/`stStatus` — não existiam no shape antigo) | **corrigido** — `recentes()` devolve `AgendamentoResumoApiDto[]` |
| `agenda.service.ts::getAgenda` | `/agenda$` | **transformador** | ✓ | `TypeError: Cannot read properties of undefined (reading 'map')` em `response.data.agendamentos.map(...)` — mock devolvia array nu de `AgendamentoResponse`, service espera `{dataInicio,dataFim,agendamentos}` | **corrigido** — `agenda()` devolve `AgendaApiResponseDto` |
| `eventos-clinicos.service.ts::criarConsulta` | `/eventos-clinicos/consultas$` | pass-through | ✓ | OK | nenhuma |
| `eventos-clinicos.service.ts::criarPrescricao` | `/eventos-clinicos/prescricoes$` | pass-through | leitura (mock já espelha o tipo exato) | OK | nenhuma |
| `eventos-clinicos.service.ts::getMedicamentos` | `/medicamentos$` | pass-through | ✓ | OK | nenhuma |
| `eventos-clinicos.service.ts::enviarTranscricao` | `/eventos-clinicos/\d+/transcricao$` | pass-through | leitura | OK | nenhuma |
| `eventos-clinicos.service.ts::confirmarSoap` | `/eventos-clinicos/\d+/soap$` | pass-through | leitura | OK | nenhuma |
| `eventos-clinicos.service.ts::gerarReceituario` | `/eventos-clinicos/\d+/receituario$` | pass-through | leitura | OK | nenhuma |
| `eventos-clinicos.service.ts::baixarEAbrirReceituario` | não passa pelo mock-adapter (usa `File.downloadFileAsync` direto, binário) | n/a | — | n/a | fora de escopo — nunca roteia por `apiClient`/`resolveMock` |
| `luna.service.ts::enviarWhatsApp` | `/whatsapp/enviar$` | pass-through (com try/catch próprio) | ✓ | OK | nenhuma |
| `luna.service.ts::getLunaHealth` | `/health$` | pass-through (com try/catch próprio) | ✓ | OK | nenhuma |
| `luna.service.ts::getRelatorioTriagens` | `/luna/triagens/relatorio$` | pass-through | leitura | OK | nenhuma |
| `teleconsulta.service.ts::criarOuObterSala` | `/teleconsulta/\d+/sala$` (POST, rota nova) | pass-through | ✓ | `Error: No mock for POST /api/v1/teleconsulta/{id}/sala` | **corrigido, TASK-71 (FIX_6)** — `sala()` novo em `src/mocks/teleconsulta.mock.ts`, despacha por `config.method`. POST devolve sala criada (`dsSalaUrl` preenchido). Sem `try/catch` na tela (`teleorientacao/[idPet].tsx`), esta era a rota de **maior risco** das 3 do backlog — a única que quebrava visivelmente. Fixture conferido campo a campo contra `TeleconsultaResponseDto.cs:3-10` (`backend-clinica-dotnet`) — os 5 campos batem exatamente (serialização camelCase padrão do ASP.NET Core, sem policy customizada). |
| `teleconsulta.service.ts::obterSala` | `/teleconsulta/\d+/sala$` (GET, mesma rota de `criarOuObterSala`) | pass-through | ✓ | `Error: No mock for GET /api/v1/teleconsulta/{id}/sala` | **corrigido, TASK-71 (FIX_6)** — mesmo handler `sala()`; GET devolve o estado "sala ainda não criada" (`dsSalaUrl: null`), espelhando o comportamento real antes do vet iniciar a chamada. |

### Achados corrigidos — árvore causal resumida

Todos os 4 seguem a mesma classe do B0.1: `dashboard.mock.ts`/`agenda.mock.ts` foram
escritos devolvendo os tipos **app-facing** (`DashboardHojeResponse`, `AlertaResponse[]`,
`RecentAppointmentResponse[]`, `AgendamentoResponse[]`) — o formato que os *mappers*
(`mapHoje`, `mapAlerta`, `mapRecente`, `mapAgendamentoItem`) **produzem** — quando os
services na verdade esperam o shape **raw** do `.NET` (`DashboardHojeApiDto`,
`AlertaApiDto[]`, `AgendamentoResumoApiDto[]`, `AgendaApiResponseDto`), que é o tipo de
**entrada** desses mesmos mappers. Os tipos raw eram `interface`s locais não exportadas
em `dashboard.service.ts`/`agenda.service.ts` — esta task as exportou (mesma decisão de
desenho da TASK-64 para `RegisterInviteApiResponse`: acoplar o mock ao service é correto
aqui, documentado no código).

`getHoje`/`getAgenda` **lançavam** (dashboard e agenda são, respectivamente, a tela
inicial e a tela de agenda do app da clínica — os dois achados mais graves desta
varredura, piores em impacto do que o `register()` que originou o backlog). `getAlertas`/
`getRecentes` não lançavam mas corrompiam silenciosamente os dados exibidos.

### Efeito colateral em teste existente

`tests/mock-adapter.test.ts` testava `resolveMock()` diretamente (sem passar pelo
service) e tinha 3 asserções escritas contra o shape **app-facing** antigo — ou seja,
**codificava o próprio bug como comportamento esperado** no nível do adapter. Corrigidas
para refletir o shape raw correto:
- `resolves /dashboard/hoje`: `data.metrics.nrConsultasHoje` → `data.totalConsultasHoje`
- `alerta sem idPet is present in alertas`: reescrito para verificar os dois subtipos raw
  reais (`tipo: 'TEMPERATURA'|'VACINA_VENCENDO'`) em vez de um campo (`idPet`) que não
  existe no shape raw; a garantia antiga (idPet sempre `undefined` pós-mapeamento) foi
  **preservada**, só que movida para `mock-contract-audit.test.ts` (nível do service, que
  é onde essa garantia realmente se aplica)
- contagem de itens de `/dashboard/alertas` mantida em 5 (adicionado 1 alerta ao fixture
  raw para não reduzir a riqueza dos dados de demo)

### TASK-71 (FIX_6) — fecha `criarOuObterSala`/`obterSala`

Era a rota de **maior risco** das 3 rotas sem mock do backlog: `teleorientacao/[idPet].tsx`
não tem `try/catch` próprio (usa `useTeleconsulta`/react-query, que captura a rejeição em
`.error`, mas sem normalização — `erro?.status` fica `undefined`, caindo no branch
genérico "Não foi possível carregar a sala de videochamada"). `sala()` (novo, em
`src/mocks/teleconsulta.mock.ts`) despacha por `config.method`: POST devolve a sala criada
(`dsSalaUrl` preenchido), GET devolve o estado "sala ainda não criada" (`dsSalaUrl: null`,
espelhando o comportamento real antes do veterinário iniciar a chamada — é esse estado
null que faz a tela mostrar o botão "Iniciar chamada" em vez de "Entrar na sala").

Fixture conferido campo a campo contra o DTO real do `.NET`
(`backend-clinica-dotnet/src/Kura.Application/DTOs/Teleconsulta/TeleconsultaResponseDto.cs:3-10`):
os 5 campos (`IdAgendamento`/`DsSalaUrl`/`DsProvedorVideo`/`DtInicioSessao`/
`StFallbackManual`) batem exatamente com `TeleconsultaResponse` (`teleconsulta.service.ts:4-10`)
em camelCase — serialização padrão do ASP.NET Core (System.Text.Json), sem
`JsonNamingPolicy` customizada no projeto. Rota real confirmada em
`TeleconsultaController.cs:26-49` (`POST`/`GET .../{idAgendamento:long}/sala`, ambos
`[Authorize]`).

Prova de mordida: `tests/mock-contract-audit.test.ts`, describe `'teleconsulta.service
(TASK-71, FIX_6)'` — os 3 testes falham contra o adapter antigo (`No mock for POST/GET
.../sala`) e passam depois do fix, incluindo um teste dedicado provando que POST e GET na
mesma URL não se confundem.

---

## Rotas sem mock — resumo operacional (plano B de demonstração)

Das 3 rotas sem mock que este documento listava, a TASK-71 (FIX_6) fechou 2. Só resta 1,
e por **decisão deliberada**, não por gap de cobertura:

| App | Ação do usuário | Sintoma em modo mock |
|---|---|---|
| tutor | Registro de push token | silencioso — já tratado (`try/catch` no service); sem mock por decisão (ver TASK-71 acima), não por lacuna |

`cancelarAgendamento` (tutor) e `criarOuObterSala`/`obterSala` (clínica) — as duas ações
que antes quebravam visivelmente em modo mock — **saíram desta tabela**: ambas têm mock
funcional desde a TASK-71, provado por teste que executa a função (não por leitura de
diff).

`registerDeviceToken` não é uma regressão nem um gap pendente — é a única das 3 rotas
sem mock que, examinada de novo à luz do estado pós-TASK-70, não precisava de mock
(justificativa completa na seção "TASK-71 (FIX_6)" acima). Não há candidato a task de
backlog futuro pendente desta auditoria.
