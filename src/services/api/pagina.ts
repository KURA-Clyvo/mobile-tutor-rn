import type { PageRaw } from '../../types/api';

/**
 * T-2 — desembrulha o envelope `Page<T>` do Spring Data que o BFF Java devolve em
 * TODAS as listas paginadas: `{ content: [...], totalElements, totalPages, number, size }`.
 *
 * Por que existe: o app declarava e consumia array cru nas listas, então no dia em
 * que o modo mock fosse desligado `data.map(...)` receberia um objeto e quebraria a
 * tela inteira. Duas listas já faziam `.content` na mão (`timeline.service.ts` e
 * `notifications.service.ts`, TASK-31) — a regra existia, mas espalhada e não
 * nomeada, então as listas de pets e agendamentos ficaram de fora sem ninguém ver.
 * Este helper é o único lugar do app que precisa saber que o servidor pagina.
 *
 * Por que aceita `T[]` também: os mocks (`src/mocks/*.mock.ts`) devolvem array nu, e
 * quebrar o modo mock para consertar o modo real trocaria um bug por outro. As duas
 * formas são legítimas neste app.
 *
 * Por que NÃO devolve `[]` em silêncio para shape desconhecido: lista vazia é
 * indistinguível de sucesso na tela, e foi exatamente assim que divergências de
 * contrato sobreviveram vários ciclos aqui. Corpo ausente (204 / sem body) é o único
 * caso silencioso, porque aí "nada" é a resposta correta.
 */
export function desembrulharPagina<T>(corpo: PageRaw<T> | T[] | null | undefined): T[] {
  if (corpo == null) return [];
  if (Array.isArray(corpo)) return corpo;
  const conteudo = (corpo as PageRaw<T>).content;
  if (Array.isArray(conteudo)) return conteudo;
  throw new Error(
    '[desembrulharPagina] corpo não é array nem Page<T> do Spring (sem `content`): ' +
      `recebi ${Object.prototype.toString.call(corpo)} com chaves [${Object.keys(corpo as object).join(', ')}]`,
  );
}
