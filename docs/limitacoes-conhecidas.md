# Limitações conhecidas — app do tutor

Cada item aqui foi **medido**, com o comando ao lado. Item que virou incerteza ("pode não
ter", "a confirmar") não entra: ou se mede, ou não se escreve.

Medições de **2026-09-08**, contra `backend-tutor-java @ 3290687` (clonado localmente) e
`mobile-tutor-rn @ fix/auditoria-codigo`.

## 1. Cadastro de pet não tem endpoint de escrita

`POST /v1/tutor/pets` **não existe**.
`grep -rn "PostMapping" .../bff/api/TutorBffController.java` → **0 ocorrências**.
Controle positivo: `AgendamentoBffController:62` **tem** `@PostMapping`, então o instrumento
enxerga.

A criação de pet esbarra em regra de propriedade da tabela `PET` no backend `.NET`. Por isso a
tela `(tabs)/pets/novo.tsx` **orienta o tutor a procurar a clínica** em vez de simular um
cadastro que não seria gravado. É uma tela honesta, não um placeholder.

## 2. Horários da agenda são a agenda deste tutor, não a disponibilidade da clínica

A partir da T-6, `useHorariosOcupados` cruza a grade de horário comercial
(`src/constants/agenda.ts`) com os agendamentos que `GET /v1/tutor/agendamentos` devolve.

O que isso **não** é: disponibilidade real. O app só enxerga os agendamentos do tutor logado —
um horário livre aqui pode estar ocupado por outro tutor. Não existe endpoint de
disponibilidade no BFF, e a confirmação continua sendo da clínica (o agendamento nasce como
solicitação).

## 3. Push exige `extra.eas.projectId` no `app.json`, que ainda não existe

`grep -n "eas\|projectId" app.json` → **0 ocorrências**.

Sem essa chave, `Notifications.getExpoPushTokenAsync()` lança
`ERR_NOTIFICATIONS_NO_EXPERIENCE_ID` e nenhum build registra push — nem dev, nem loja.
`getDeviceToken()` devolve `null` e **reporta o motivo no console** em vez de falhar em
silêncio (`src/services/notifications.service.ts`).

Para resolver: `eas init` na raiz (grava a chave sozinho) ou copiar o ID do projeto em
expo.dev. Em iOS, push também exige EAS Build — não funciona no Expo Go desde o SDK 53.

## 4. Notificação "lida" é estado local, por decisão

O backend **não tem** endpoint de escrita para marcar notificação como lida: a tabela
`NOTIFICACAO` é escrita pelo `.NET`, e o BFF Java só a lê (`NotificacaoBffController:44`, só
`@GetMapping`). O servidor responde sempre `flLida: false`.

Por isso "lida" mora em `src/store/notificacoesLidasStore.ts`, e **não** na cache do
react-query — cache é espelho do servidor, então qualquer refetch apagaria a marcação. Ver
`src/__tests__/notificacoes-lidas.test.tsx`.

## 5. Luna (triagem por IA) não é consumida por este app

Nenhuma tela chama o serviço. O `lunaClient` e as duas variáveis de ambiente
(`EXPO_PUBLIC_LUNA_BASE_URL`, `EXPO_PUBLIC_LUNA_API_KEY`) existiam sem consumidor e foram
removidos. Voltam com a integração; o esquema de autenticação (JWT ou API key) se define
quando ela entrar.

## 6. Teleconsulta abre no navegador do aparelho, não em SDK embutido

O botão "Entrar na teleconsulta" (`AgendamentoItem.tsx`, exibido quando
`sgTipoConsulta === 'TELEORIENTACAO'` e `dsSalaUrl` já foi criada pela clínica) abre a sala do
Daily.co com `Linking.openURL`.

Decisão, não pendência — a mesma do app da clínica: `@daily-co/react-native-daily-js` exige
dev-build, e `Linking` funciona no Expo Go sem dependência nova. `dsSalaUrl` chega pela própria
BFF do tutor (`AgendamentoResponse.dsSalaUrl`); o app do tutor **nunca** chama o `.NET`
diretamente — o Java lê a coluna que o `.NET` escreve na tabela `AGENDAMENTO` compartilhada.

## 7. Divergência de contrato ainda aberta nas listas de pets e agendamentos

O envelope `Page<T>` do Spring está resolvido (`src/services/api/pagina.ts`). Os **nomes de
campo** não: `AgendamentoResponse.java` expõe `idAgendamento`/`dtAgendamento`/`tipo`/`status` e
**não** tem `nmEspecie`, `nmRaca`, `nmClinica` nem `nmVeterinario`. Detalhe campo a campo e a
decisão pendente estão em `docs/sprint3-entrega.md`.
