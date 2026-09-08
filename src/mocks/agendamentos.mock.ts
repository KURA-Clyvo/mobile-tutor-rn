import type { InternalAxiosRequestConfig } from 'axios';
import type { AgendamentoRaw, PageRaw, CancelarAgendamentoResponse } from '../types/api';
// T-2: shape RAW do Java (`Page<AgendamentoResponse>` — `idAgendamento`, `status`,
// `tipo`, `observacoes`), não mais o app-facing. A tradução de nome e de valor é do
// `mapAgendamentoDto`; o mock existe para exercitá-la, não para pulá-la.
//
// `nmEspecie`/`nmRaca`/`nmClinica` entram porque a SJ3-10 do backend os acrescenta a
// `AgendamentoResponse`, com estes nomes, no nível raiz — decisão travada pela trilha
// Java em 08/09. `nmVeterinario` NÃO entra: ficou fora daquela task de propósito
// (a entidade só tem `Long idVeterinario`, sem associação).
const CLINICA = 'Clínica KURA Pinheiros';

function linha(over: Partial<AgendamentoRaw> & Pick<AgendamentoRaw, 'idAgendamento' | 'idPet' | 'nmPet' | 'dtAgendamento' | 'tipo' | 'status'>): AgendamentoRaw {
  return {
    idTutor: 1, idClinica: 1, idVeterinario: null,
    nrDuracaoMinutos: 30, origem: 'APP', observacoes: null,
    dtCriacao: new Date().toISOString(), dtConfirmacao: null, dtCancelamento: null,
    nrVersion: 0, dsSalaUrl: null, nmClinica: CLINICA,
    nmEspecie: null, nmRaca: null,
    ...over,
  };
}

export async function list(): Promise<PageRaw<AgendamentoRaw>> {
  const content: AgendamentoRaw[] = [
    linha({ idAgendamento: 1, idPet: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador',
            dtAgendamento: new Date(Date.now() + 2 * 86400_000).toISOString(),
            tipo: 'RETORNO', status: 'INTENCAO', observacoes: 'Retorno pós-consulta' }),
    linha({ idAgendamento: 2, idPet: 2, nmPet: 'Luna', nmEspecie: 'Gato', nmRaca: 'Siamesa',
            dtAgendamento: new Date(Date.now() + 7 * 86400_000).toISOString(),
            tipo: 'CONSULTA', status: 'CONFIRMADO', nrDuracaoMinutos: 60,
            observacoes: 'Check-up anual' }),
    linha({ idAgendamento: 4, idPet: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador',
            dtAgendamento: new Date(Date.now() + 1 * 86400_000).toISOString(),
            tipo: 'TELEORIENTACAO', status: 'CONFIRMADO',
            observacoes: 'Teleorientação de rotina',
            dsSalaUrl: 'https://kura.daily.co/room-4' }),
    linha({ idAgendamento: 3, idPet: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador',
            dtAgendamento: new Date(Date.now() - 15 * 86400_000).toISOString(),
            tipo: 'VACINA', status: 'REALIZADO', observacoes: 'Vacina V10' }),
  ];
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length };
}

// TASK-74b (FIX_7): antes desta task `criar()` não recebia `config` e ignorava o
// corpo inteiro — devolvia sucesso fixo mesmo que `agendamentos.service.ts`
// mandasse o shape antigo da tela (`dtPreferida`/`sgTipoConsulta`/`dsMotivo`, que
// não existem no Java real). Foi exatamente essa complacência que mascarou o 400
// permanente do modo real por 6 ciclos (regra de ouro v5, G4b: o mock é o segundo
// consumidor da mesma função de resposta). Agora valida a presença dos 3 campos
// obrigatórios do shape Java real (`AgendamentoRequest`: `idPet`/`dtAgendamento`/
// `tipo` — `@NotNull`/`@Future`/`@NotBlank`) para que um regresso ao shape antigo
// (ou qualquer shape incompleto) quebre o modo mock em vez de passar em silêncio.
export async function criar(config: InternalAxiosRequestConfig): Promise<{ id: number; sgStatus: 'SOLICITADO'; dtSolicitacao: string }> {
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data ?? {});
  if (body.idPet == null || !body.dtAgendamento || !body.tipo) {
    throw new Error('[MockAdapter] agendamentos.mock.criar: corpo não bate com AgendamentoRequest (idPet/dtAgendamento/tipo obrigatórios)');
  }
  return { id: Math.floor(Math.random() * 9000 + 1000), sgStatus: 'SOLICITADO', dtSolicitacao: new Date().toISOString() };
}

// TASK-71 (FIX_6): cancelarAgendamento (DELETE) — rota ausente do adapter até esta
// task (TASK-65 documentou, não corrigiu). `agendamentos.service.ts::cancelarAgendamento`
// é pass-through puro (`.then(r => r.data)`, sem mapper) e o tipo de entrada É o tipo
// app-facing `CancelarAgendamentoResponse` — não há camada anti-corrupção a respeitar
// aqui (diferente do B0.1/register()). Extrai o id da URL só pra devolver um valor
// coerente com o que foi cancelado, sem estado real (mesmo padrão observável de list()).
//
// Nota de contrato (fora do escopo desta task, registrada em docs/mock-contract-audit.md):
// o endpoint real (`AgendamentoBffController.java:84-99`, `backend-tutor-java`) devolve
// HTTP 204 sem corpo, não `{id, sgStatus}` — o tipo `CancelarAgendamentoResponse`
// declarado no app não bate com o backend real. Isso é um mismatch de MODO REAL, não de
// modo mock — o mock aqui espelha o contrato TypeScript já declarado no app (mesma
// disciplina dos pass-throughs existentes), não o contrato real do Java.
// T-7a: `PUT /tutor/agendamentos/{id}`. Valida `nrVersion` como o Java valida
// (`@NotNull` no DTO, e 400 sem ele) — se o app parar de mandar a versão, o modo mock
// quebra aqui em vez de passar verde e falhar só contra o servidor real. Mesma
// disciplina do `criar()`, que a TASK-74b instalou depois de o mock complacente
// mascarar um 400 permanente por 6 ciclos.
export async function remarcar(config: InternalAxiosRequestConfig): Promise<AgendamentoRaw> {
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data ?? {});
  if (body.nrVersion == null) {
    throw new Error('[MockAdapter] agendamentos.mock.remarcar: `nrVersion` é obrigatório no PUT (AgendamentoUpdateRequest, @NotNull) — sem ele o Java devolve 400.');
  }
  if (!body.dtAgendamento) {
    throw new Error('[MockAdapter] agendamentos.mock.remarcar: `dtAgendamento` ausente — remarcar sem data nova não muda nada.');
  }
  const match = config.url?.match(/\/tutor\/agendamentos\/(\d+)$/);
  const id = match ? Number(match[1]) : 0;
  // O Java devolve o agendamento salvo, com `nrVersion` incrementado pelo @Version.
  return linha({
    idAgendamento: id, idPet: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador',
    dtAgendamento: String(body.dtAgendamento), tipo: 'CONSULTA', status: 'AGENDADO',
    nrVersion: Number(body.nrVersion) + 1,
  });
}

export async function cancelar(config: InternalAxiosRequestConfig): Promise<CancelarAgendamentoResponse> {
  const match = config.url?.match(/\/tutor\/agendamentos\/(\d+)$/);
  const id = match ? Number(match[1]) : 0;
  return { id, sgStatus: 'CANCELADO' };
}
