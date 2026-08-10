// TASK-74b (FIX_7) — prova de mordida do contrato real de "Solicitar agendamento".
//
// Contrato Java (AgendamentoRequest, backend-tutor-java/.../agendamento/api/dto/
// AgendamentoRequest.java — ver task-74-brief.md):
//   POST /v1/tutor/agendamentos exige {idPet: Long @NotNull, dtAgendamento:
//   LocalDateTime @NotNull @Future, tipo: String @NotBlank (allowableValues
//   CONSULTA/RETORNO/VACINA/EXAME/PROCEDIMENTO/TELEORIENTACAO)}. `idClinica`/
//   `idVeterinario`/`duracaoMinutos`/`observacoes` são opcionais.
//
// O código anterior a esta task mandava o corpo cru da tela — {idPet,
// sgTipoConsulta, dsMotivo, dtPreferida} — e NENHUM dos 3 nomes obrigatórios do
// Java (dtAgendamento/tipo) batia (dtPreferida≠dtAgendamento, sgTipoConsulta≠tipo);
// `observacoes` também nunca era mandado (ficava undefined, o que é aceitável por
// ser opcional, mas o app perdia o motivo do tutor). Isso fazia o POST devolver 400
// sempre — o CTA central "Solicitar agendamento" do app do tutor. Este teste falha
// contra o código antigo e passa depois do fix.
import { solicitarAgendamento } from '../services/agendamentos.service';
import { apiClient } from '../services/api/client';

jest.mock('../services/api/client', () => ({
  apiClient: { post: jest.fn() },
}));

describe('agendamentos.service — contrato real do Java (TASK-74b)', () => {
  beforeEach(() => {
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { id: 42, sgStatus: 'SOLICITADO', dtSolicitacao: new Date().toISOString() },
    });
  });

  it('manda idPet/dtAgendamento/tipo (não idPet/dtPreferida/sgTipoConsulta) para tipo ROTINA', async () => {
    await solicitarAgendamento({
      idPet: 1, sgTipoConsulta: 'ROTINA', dsMotivo: 'Check-up anual', dtPreferida: '2026-09-01T10:30:00.000Z',
    });
    const body = (apiClient.post as jest.Mock).mock.calls[0]![1];
    expect(body.idPet).toBe(1);
    expect(body.dtAgendamento).toBe('2026-09-01T10:30:00.000Z');
    expect(body.tipo).toBe('CONSULTA'); // ROTINA -> CONSULTA (decisão do Felipe, item 2)
    expect(body.observacoes).toBe('Check-up anual');
    expect(body.dtPreferida).toBeUndefined();
    expect(body.sgTipoConsulta).toBeUndefined();
    expect(body.dsMotivo).toBeUndefined();
  });

  it('nunca manda idClinica (decisão do Felipe, item 1: o Java deriva a clínica do pet)', async () => {
    await solicitarAgendamento({
      idPet: 1, sgTipoConsulta: 'RETORNO', dsMotivo: 'Retorno pós-cirúrgico', dtPreferida: '2026-09-01T10:30:00.000Z',
      idClinica: 999, // mesmo se a tela um dia passasse isso, o service não deve repassar
    });
    const body = (apiClient.post as jest.Mock).mock.calls[0]![1];
    expect(body.idClinica).toBeUndefined();
  });

  it('RETORNO e TELEORIENTACAO viajam sem tradução (já são valores válidos no Java)', async () => {
    await solicitarAgendamento({ idPet: 1, sgTipoConsulta: 'RETORNO', dsMotivo: 'x', dtPreferida: '2026-09-01T10:30:00.000Z' });
    expect((apiClient.post as jest.Mock).mock.calls[0]![1].tipo).toBe('RETORNO');

    (apiClient.post as jest.Mock).mockClear();
    await solicitarAgendamento({ idPet: 1, sgTipoConsulta: 'TELEORIENTACAO', dsMotivo: 'x', dtPreferida: '2026-09-01T10:30:00.000Z' });
    expect((apiClient.post as jest.Mock).mock.calls[0]![1].tipo).toBe('TELEORIENTACAO');
  });

  it('URGENCIA mapeia para CONSULTA e preserva a urgência no início de observacoes (senão a informação se perde)', async () => {
    await solicitarAgendamento({
      idPet: 1, sgTipoConsulta: 'URGENCIA', dsMotivo: 'Vômito e apatia desde ontem', dtPreferida: '2026-09-01T10:30:00.000Z',
    });
    const body = (apiClient.post as jest.Mock).mock.calls[0]![1];
    expect(body.tipo).toBe('CONSULTA');
    expect(body.observacoes.startsWith('[URGENTE]')).toBe(true);
    expect(body.observacoes).toContain('Vômito e apatia desde ontem');
  });

  it('bate na URL certa (/api/v1/tutor/agendamentos)', async () => {
    await solicitarAgendamento({ idPet: 1, sgTipoConsulta: 'ROTINA', dsMotivo: 'x', dtPreferida: '2026-09-01T10:30:00.000Z' });
    expect((apiClient.post as jest.Mock).mock.calls[0]![0]).toBe('/api/v1/tutor/agendamentos');
  });
});
