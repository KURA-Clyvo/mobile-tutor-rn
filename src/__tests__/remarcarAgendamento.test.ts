// T-7a — remarcar agendamento: o `U` que faltava no CRUD.
//
// Contrato real: `PUT /v1/tutor/agendamentos/{id}`, exposto no BFF pela SJ3-10
// (`AgendamentoBffController:85`), com corpo `AgendamentoUpdateRequest`:
//   { dtAgendamento: LocalDateTime @Future, dsTipoConsulta: String,
//     dsObservacoes: String, idVeterinario: Long, nrVersion: Long @NotNull }
//
// 🔴 Os nomes NÃO são os mesmos do POST: lá é `tipo`/`observacoes`, aqui é
// `dsTipoConsulta`/`dsObservacoes`. Um `PUT` montado por analogia com o `POST`
// mandaria `tipo` e o Jackson o ignoraria em silêncio — sem 400, sem crash, e o
// agendamento seria salvo sem a mudança. É o mesmo formato de bug que a TASK-74b
// corrigiu no POST, onde 3 campos obrigatórios chegavam nulos.
import { remarcarAgendamento } from '../services/agendamentos.service';
import { apiClient } from '../services/api/client';

jest.mock('../services/api/client', () => ({ apiClient: { put: jest.fn() } }));

const put = apiClient.put as jest.Mock;

const RESPOSTA_JAVA = {
  idAgendamento: 42, idTutor: 1, idPet: 7, nmPet: 'Bóbi', idClinica: 1, idVeterinario: null,
  dtAgendamento: '2026-09-25T15:00:00', nrDuracaoMinutos: 30,
  tipo: 'CONSULTA', status: 'AGENDADO', origem: 'APP', observacoes: 'Check-up anual',
  dtCriacao: '2026-09-01T09:00:00', dtConfirmacao: null, dtCancelamento: null,
  nrVersion: 1, dsSalaUrl: null,
};

describe('remarcarAgendamento', () => {
  beforeEach(() => {
    put.mockReset();
    put.mockResolvedValue({ data: RESPOSTA_JAVA });
  });

  it('bate na url do agendamento, com PUT', async () => {
    await remarcarAgendamento({ id: 42, dtPreferida: '2026-09-25T18:00:00.000Z', nrVersion: 0 });
    expect(put.mock.calls[0]![0]).toBe('/api/v1/tutor/agendamentos/42');
  });

  it('manda nrVersion — sem ele o Java devolve 400 (@NotNull)', async () => {
    await remarcarAgendamento({ id: 42, dtPreferida: '2026-09-25T18:00:00.000Z', nrVersion: 3 });
    expect(put.mock.calls[0]![1]).toMatchObject({ nrVersion: 3 });
  });

  it('manda `dtAgendamento` — não `dtPreferida`, que não existe no Java', async () => {
    await remarcarAgendamento({ id: 42, dtPreferida: '2026-09-25T18:00:00.000Z', nrVersion: 0 });
    const body = put.mock.calls[0]![1];
    expect(body.dtAgendamento).toBeDefined();
    expect(body.dtPreferida).toBeUndefined();
  });

  it('serializa como LocalDateTime — sem Z, sem offset', async () => {
    await remarcarAgendamento({ id: 42, dtPreferida: '2026-09-25T18:00:00.000Z', nrVersion: 0 });
    const { dtAgendamento } = put.mock.calls[0]![1];
    // O Jackson desserializa um sufixo `Z` de forma leniente e DESCARTA o offset em
    // silêncio — gravaria a hora errada, sem erro. Mesma armadilha da TASK-74b.
    expect(dtAgendamento).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    expect(dtAgendamento).not.toMatch(/Z|[+-]\d{2}:\d{2}$/);
  });

  it('não manda motivo nem tipo: o domínio ignora campo nulo e preserva os originais', async () => {
    await remarcarAgendamento({ id: 42, dtPreferida: '2026-09-25T18:00:00.000Z', nrVersion: 0 });
    const body = put.mock.calls[0]![1];
    // `Agendamento.atualizar` só sobrescreve o que chega não-nulo. Mandar string vazia
    // aqui APAGARIA o motivo que o tutor escreveu ao solicitar.
    expect(body.dsObservacoes).toBeUndefined();
    expect(body.dsTipoConsulta).toBeUndefined();
    expect(Object.keys(body).sort()).toEqual(['dtAgendamento', 'nrVersion']);
  });

  it('devolve o agendamento já traduzido para o shape do app', async () => {
    const res = await remarcarAgendamento({ id: 42, dtPreferida: '2026-09-25T18:00:00.000Z', nrVersion: 0 });
    expect(res.id).toBe(42);
    expect(res.dtInicio).toBe('2026-09-25T15:00:00');
    expect(res.sgStatus).toBe('AGENDADO');
    expect(res.sgTipoConsulta).toBe('ROTINA');
    // `nrVersion` volta incrementado pelo @Version do JPA — é ele que faz o PRÓXIMO
    // remarcar funcionar sem 409.
    expect(res.nrVersion).toBe(1);
  });
});
