# KURA · Mobile Tutor

App mobile para tutores de pets — FIAP Challenge 2026 · Clyvo Vet.

## O problema

Uma clínica veterinária de bairro administra a operação inteira em três lugares que não
conversam entre si: a **agenda** num caderno ou planilha, o **prontuário** em fichas de papel, e
a **comunicação com o tutor** no WhatsApp. O custo disso cai quase todo em cima do tutor:

- ele não sabe quando a vacina do pet vence, porque essa data só existe na ficha da clínica;
- para marcar uma consulta ele depende de alguém responder a mensagem no horário comercial;
- o histórico clínico do animal — o que foi diagnosticado, o que foi prescrito, quando foi o
  último retorno — some quando ele troca de clínica, ou quando a ficha se perde;
- quando um pet tem doença crônica, o acompanhamento vira memória de quem foi na consulta.

Para a clínica, o mesmo problema aparece como falta a consulta, retorno que ninguém cobra e
tempo de recepção gasto respondendo "que dia é mesmo a consulta do Bóbi?".

## A solução

**KURA** é um ecossistema de dois aplicativos e duas APIs sobre um banco Oracle compartilhado:

| Peça | O que faz |
|---|---|
| **`mobile-tutor-rn`** *(este repo)* | O app do tutor: pets, carteira de vacinas, histórico clínico, agendamento e consentimentos LGPD |
| `mobile-clinica-rn` | O app da clínica: agenda do dia, prontuário, atendimento |
| `backend-tutor-java` | BFF do tutor (Spring Boot 3, `/v1/tutor/**`) — autentica por JWT e expõe só o que é do tutor logado |
| `backend-clinica-dotnet` | API da clínica (.NET), dona do cadastro clínico e da teleconsulta |
| **Luna** | Triagem por IA no WhatsApp, para o primeiro contato fora do horário |

**Este app resolve o lado do tutor.** Ele dá ao tutor, no celular, o que hoje só existe na
clínica: a lista dos seus pets com o estado de saúde de cada um, as vacinas que estão vencendo,
a linha do tempo de consultas, a solicitação de agendamento sem depender de alguém responder
mensagem, e o controle explícito sobre o uso dos próprios dados (LGPD) — com direito a revogar
o que já foi aceito.

Duas fronteiras que valem entender antes de ler o código:

- **O app do tutor nunca fala com o `.NET` diretamente.** Os dois JWTs são independentes e a
  arquitetura não permite HTTP direto entre as APIs. O que o `.NET` escreve chega ao tutor
  porque o Java lê a mesma tabela — é assim que a URL da sala de teleconsulta aparece aqui.
- **O agendamento nasce como solicitação**, não como horário confirmado. Quem confirma é a
  clínica, pelo app dela.

## Tecnologias

| Camada | Ferramenta | Versão |
|---|---|---|
| Runtime | React Native | 0.81.5 |
| Plataforma | Expo SDK | 54 |
| Navegação | expo-router (file-based, 4 abas) | 6.0.23 |
| Estado de servidor | TanStack Query | 5.100.10 |
| Estado de sessão | Zustand (persist sobre AsyncStorage) | 5.0.13 |
| Formulários | react-hook-form + Zod | 7.75.0 · 4.4.3 |
| HTTP | Axios (interceptors de auth e de erro) | 1.16.1 |
| Linguagem | TypeScript (`strict`) | 5.3 |
| Testes | Jest + @testing-library/react-native | — |

Sem UI kit de terceiros: os componentes de `src/components/primitives/` são próprios, sobre os
tokens de `src/theme/`.

## Setup
1. `nvm use` (Node 20)
2. `npm install`
3. `cp .env.example .env`
4. `npm run start`

O `.env.example` já vem com `EXPO_PUBLIC_USE_MOCKS=true`: o app sobe e é navegável **sem
backend nenhum**, com dados de demonstração. Para apontar para a API real, troque para `false` e
preencha `EXPO_PUBLIC_API_BASE_URL` com a URL do `backend-tutor-java`.

## Env vars
| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | URL do BFF (`backend-tutor-java`, Spring Boot) |
| `EXPO_PUBLIC_USE_MOCKS` | `true` roda com dados locais, sem rede |

## Arquitetura em uma tela

```
src/app/          rotas (expo-router) — 12 telas + 7 layouts
src/hooks/        acesso a dados (TanStack Query) — a UI consome hook, não service
src/services/     HTTP e camada anticorrupção (o app não fala o dialeto do servidor)
src/store/        sessão (Zustand + SecureStore) e estado local
src/components/   primitivos próprios + componentes de domínio
src/theme/        tokens de cor, tipografia e espaçamento
```

Três regras dessa divisão são **travadas por teste**, não por convenção:
`src/__tests__/arquitetura-gate.test.ts` derruba o build se um hook do TanStack Query aparecer
dentro de `src/app/`, se uma tela importar função de `src/services/`, ou se a ordem de import
de `notifications.service.ts` (que é load-bearing) for reorganizada.

## Scripts
- `npm run start` — Expo dev server
- `npm run android` / `npm run ios`
- `npm run test` — Jest
- `npm run test:coverage` — Cobertura, com piso **verificado** pelo Jest
  (`coverageThreshold` no package.json: 78% stmts / 64% branches / 80% funcs / 81% lines).
  Antes o README prometia "≥ 60%" e nenhum limiar estava configurado — a promessa não
  era executável. Os números são um pouco abaixo do real de hoje (79.8 / 65.9 / 82.2 /
  82.7) de propósito: servem de catraca contra regressão, não de meta a perseguir.
- `npm run lint` — ESLint 9 com flat config (`eslint.config.js`), rodando `--max-warnings 0`.
  Antes o README prometia "0 warnings" e nada verificava; agora a build falha se aparecer um.
- `npm run type-check` — tsc --noEmit (0 erros)
- `npm run check:colors` / `npm run check:no-ocean` — trava a paleta do app tutor (nenhum
  hex fora dos tokens; nenhum token `--ocean`, que é contexto clínica). ⚠️ Os dois são
  scripts POSIX começando com `!`: rodam no Linux/macOS e no CI, mas falham no Windows,
  onde o `npm run` executa via `cmd.exe`.
- `bash scripts/f09-mutation-proof.sh` — prova de mutação das **regras 1 a 5** do gate de
  arquitetura: aplica cada regressão que elas cobrem e verifica que o gate derruba a build.
  Exige working tree limpa; reverte tudo no fim. As regras 6, 7 e 8 (acrescentadas depois)
  trazem a própria sentinela dentro de `src/__tests__/arquitetura-gate.test.ts`.
- `python3 scripts/gerar-assets-de-marca.py` — regera os PNGs de `assets/` (ícone, splash,
  adaptive, favicon) a partir da logomark de `Design KURA/` e dos tokens de
  `src/theme/tokens.ts`. Requer Pillow. Rodar quando um token de cor mudar.

## Navegação
Bottom Tab Bar (4 abas: Pets · Agenda · Saúde · Perfil).
Sem drawer — drawer é exclusivo do app clínica (Parte A).

As rotas internas (`(tabs)` e `notificacoes`) são declaradas sob `<Stack.Protected>`
(expo-router 6), com o `guard` ligado ao estado de sessão; `login` e `register` ficam no grupo
oposto — `register` de propósito, porque é alcançado por deep link de convite, com o tutor
ainda sem sessão. `src/__tests__/guarda-rotas.test.tsx` renderiza o layout raiz sem sessão e
afirma que `(tabs)` não monta.

Isto é **controle de acesso na navegação**, não proteção de dado: quem protege o dado é o JWT
validado pelo BFF a cada requisição.

## Segurança
O JWT de sessão fica no **SecureStore** (Keystore no Android, Keychain no iOS), não em
AsyncStorage — que grava em claro. Só o token vai para lá: o SecureStore tem limite de
2048 bytes por valor, e o resto do estado persistido (tutor, expiresAt, tema) não é
segredo. Quem já tinha o app instalado é migrado na primeira leitura, sem ser deslogado.
No alvo **web** o SecureStore não existe e o token continua em AsyncStorage — degradar
foi preferido a quebrar o alvo. Ver `src/store/authSecureStorage.ts`.

## Limitações conhecidas
Estão em [`docs/limitacoes-conhecidas.md`](docs/limitacoes-conhecidas.md), cada uma com a
medição e o comando que a produziu.
