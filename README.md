# KURA · Mobile Tutor

App mobile para tutores de pets — FIAP Challenge 2026 · Clyvo Vet.

## Link Vídeo Youtube
 https://youtu.be/F62_LPbJORQ


## Setup
1. `nvm use` (Node 20)
2. `npm install`
3. `cp .env.example .env` (preencher variáveis)
4. `npm run start`

## Env vars
| Variável | Descrição |
|---|---|
| EXPO_PUBLIC_API_BASE_URL | Java Spring Boot backend |
| EXPO_PUBLIC_LUNA_BASE_URL | Python Luna service |
| EXPO_PUBLIC_USE_MOCKS | `true` para usar mocks locais |
| EXPO_PUBLIC_LUNA_API_KEY | API key da Luna (pendente Felipe) |

## Scripts
- `npm run start` — Expo dev server
- `npm run android` / `npm run ios`
- `npm run test` — Jest
- `npm run test:coverage` — Cobertura (≥ 60%)
- `npm run lint` — ESLint (0 warnings)
- `npm run type-check` — tsc --noEmit (0 erros)

## Navegação
Bottom Tab Bar (5 abas: Pets · Agenda · Saúde · Loja · Perfil).
Sem drawer — drawer é exclusivo do app clínica (Parte A).

## Loja (pré-lançamento)
A aba **Loja** (entre Saúde e Perfil) é uma vitrine do catálogo de **produtos de exemplo** do KURA. Ela não vende nada: não há carrinho, pedido nem pagamento, e a ação de cada card é "Em breve", desabilitada. Texto literal do aviso, sempre visível no topo da tela (vem da API em `GET /api/v1/loja/catalogo`; antes da resposta o app usa a constante ancorada em `src/types/loja.ts`):

Pré-lançamento: pagamento e entrega serão ativados quando os parceiros logísticos concluírem a integração. Nenhuma cobrança é feita.

- Todo card traz o selo **Exemplo** e o preço como **Preço de referência** (o catálogo é dado de demonstração, sem marca nem foto real).
- Fonte: `loja.service.ts::listarCatalogo` (shape cru da API, preço em centavos); modo mock em `src/mocks/loja.mock.ts`.
- Filtro por categoria no próprio app (Tudo, Alimentação, Higiene, Acessórios, Brinquedos); a ordem dos produtos é a da API.
- O check do smoke de contrato para essa rota nasce na LOJA-04 (`DevOps-Cloud`); até lá o registry marca `naoCoberto`.

## Limitações v1
1. Slots de agenda mockados — pendente endpoint GET /tutor/agenda/disponivel (Felipe #1)
2. Cadastro de pet pode não ter endpoint POST /tutor/pets (Felipe #4)
3. Auth scheme da Luna a confirmar — JWT ou API key (Felipe #3)
4. GET /tutor/notificacoes pode não estar exposto ainda (Felipe #7)
5. Push notifications requerem EAS Build em iOS (não funciona no Expo Go desde SDK 53)
6. Teleconsulta (TASK-11): o botão "Entrar na teleconsulta" (exibido quando
   `sgTipoConsulta === 'TELEORIENTACAO'` e `dsSalaUrl` já foi criada pela clínica) abre a sala
   do Daily.co no navegador do aparelho (`Linking.openURL`), não em SDK nativo embutido — mesma
   decisão do app clínica (ver `mobile-clinica-rn/README.md#teleconsulta`): o SDK
   `@daily-co/react-native-daily-js` exige dev-build, e `Linking` funciona no Expo Go sem
   dependências novas. `dsSalaUrl` chega pela própria BFF do tutor
   (`GET /api/v1/tutor/agendamentos`) — o app tutor nunca chama o .NET diretamente (arquitetura
   do projeto não permite HTTP direto entre as duas APIs); o Java só lê a coluna que o .NET
   escreve na tabela `AGENDAMENTO` compartilhada.
