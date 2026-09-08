// T-2 — prova de mordida do envelope `Page<T>` do Spring nas listas do BFF Java.
//
// Fonte do shape: os testes do próprio backend asseguram `$.content[0]` e
// `$.totalElements` (`AgendamentoBffControllerTest:81-82`, `TutorBffControllerTest:83-85`,
// citados no backlog da Sprint 3). Duas listas deste app já desembrulhavam `.content`
// na mão desde a TASK-31 (`timeline.service.ts`, `notifications.service.ts`) — o que
// prova que o envelope é real, e que pets/agendamentos ficaram de fora por descuido,
// não por o servidor responder diferente nessas rotas.
//
// Antes do fix, `listPets`/`listAgendamentos` eram `.then(r => r.data)` puro: com o
// envelope, devolviam o OBJETO `{content, totalElements}`, e `usePets` chamava `.map`
// nele — `data.map is not a function`, a primeira e a segunda aba do app. Os dois
// primeiros testes deste arquivo falham contra aquele código e passam depois.
//
// O que este arquivo NÃO prova: que os NOMES dos campos dentro de `content` batem com
// o tipo app-facing. Eles não batem (`idAgendamento`≠`id`, `dtAgendamento`≠`dtInicio`,
// `status`≠`sgStatus`), e o mapper de campo só pode ser escrito com
// `AgendamentoResponse.java`/`PetResponse.java` na mão — nenhum dos dois está nesta
// máquina. Envelope e nomes são duas divergências independentes; esta fecha a primeira.
import { listPets } from '../services/pets.service';
import { listAgendamentos } from '../services/agendamentos.service';
import { listConsentimentos } from '../services/consentimentos.service';
import { desembrulharPagina } from '../services/api/pagina';
import { apiClient } from '../services/api/client';

jest.mock('../services/api/client', () => ({
  apiClient: { get: jest.fn() },
}));

const get = apiClient.get as jest.Mock;

describe('desembrulharPagina', () => {
  it('desembrulha o envelope Page<T> do Spring', () => {
    expect(desembrulharPagina({ content: [1, 2], totalElements: 2, totalPages: 1, number: 0, size: 20 }))
      .toEqual([1, 2]);
  });

  it('aceita array cru — é o que os mocks devolvem, e quebrá-los trocaria um bug por outro', () => {
    expect(desembrulharPagina([1, 2])).toEqual([1, 2]);
  });

  it('trata corpo ausente (204/sem body) como lista vazia', () => {
    expect(desembrulharPagina(null)).toEqual([]);
    expect(desembrulharPagina(undefined)).toEqual([]);
  });

  // Sentinela: lista vazia é indistinguível de sucesso na tela. Um shape que não é
  // nem array nem Page tem que gritar, não virar `[]` silencioso — foi o silêncio
  // que deixou divergência de contrato sobreviver ciclos inteiros neste projeto.
  it('grita em shape desconhecido em vez de devolver lista vazia', () => {
    expect(() => desembrulharPagina({ items: [1] } as never)).toThrow(/não é array nem Page/);
  });
});

describe('services de lista contra o envelope real do Java', () => {
  beforeEach(() => get.mockReset());

  it('listAgendamentos devolve lista a partir de {content,totalElements}', async () => {
    // JSON literal que `AgendamentoBffControllerTest:81-82` assegura.
    get.mockResolvedValue({
      data: {
        content: [{ idAgendamento: 1, dtAgendamento: '2026-09-20T10:30:00', tipo: 'CONSULTA', status: 'AGENDADO', nrVersion: 0 }],
        totalElements: 1, totalPages: 1, number: 0, size: 20,
      },
    });
    const lista = await listAgendamentos();
    expect(Array.isArray(lista)).toBe(true);
    expect(lista).toHaveLength(1);
  });

  it('listPets devolve lista a partir de {content,totalElements}', async () => {
    get.mockResolvedValue({
      data: { content: [{ idPet: 1, nmPet: 'Bóbi' }], totalElements: 1, totalPages: 1, number: 0, size: 20 },
    });
    const lista = await listPets();
    expect(Array.isArray(lista)).toBe(true);
    expect(lista).toHaveLength(1);
  });

  it('listConsentimentos devolve lista a partir de {content,totalElements}', async () => {
    get.mockResolvedValue({
      data: { content: [{ idConsentimento: 7 }], totalElements: 1, totalPages: 1, number: 0, size: 20 },
    });
    expect(await listConsentimentos()).toHaveLength(1);
  });

  // Controle: o modo mock (array nu) não pode regredir por causa do fix do modo real.
  it('as mesmas 3 listas continuam funcionando com array nu (modo mock)', async () => {
    get.mockResolvedValue({ data: [{ id: 1 }] });
    expect(await listPets()).toHaveLength(1);
    expect(await listAgendamentos()).toHaveLength(1);
    expect(await listConsentimentos()).toHaveLength(1);
  });
});
