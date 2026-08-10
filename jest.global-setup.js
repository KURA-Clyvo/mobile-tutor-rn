// TASK-74b (FIX_7, rodada de fix 2): fixa o fuso horário do processo do Jest ANTES
// de os workers subirem — diferente de mutar `process.env.TZ` dentro de `beforeAll`
// (dentro de um arquivo de teste), que a rodada de fix 1 verificou empiricamente que
// NÃO funciona neste ambiente (o V8 de cada worker resolve e cacheia o fuso na
// primeira chamada a `Date`/`Intl`, disparada pelo bootstrap do jest-expo antes do
// corpo do teste rodar, e ignora mutações posteriores feitas de dentro do próprio
// processo do worker).
//
// `globalSetup` roda no processo PRINCIPAL do Jest, antes de qualquer worker ser
// criado (fork/thread) — mutar `process.env.TZ` aqui é herdado pelos workers no
// momento em que sobem, então a primeira chamada a `Date`/`Intl` de cada worker já
// enxerga o fuso fixado, mesmo que a variável de ambiente do processo que invocou o
// `npx jest` (ex.: `TZ=UTC` de um runner de CI) diga outra coisa — o valor setado
// aqui VENCE.
//
// Fixado em America/Sao_Paulo: é o fuso dos usuários do produto (mercado brasileiro)
// e é o que torna `agendamentos.timezone.test.ts` significativo em qualquer máquina,
// inclusive um runner de CI que rode em UTC por padrão (ubuntu-latest, o caso deste
// repo — `.github/workflows/ci.yml` não fixava TZ nenhum antes desta task).
module.exports = async function globalSetup() {
  process.env.TZ = 'America/Sao_Paulo';
};
