import { apiClient } from './api/client';
import type { AgendamentoTutorResponse, SolicitarAgendamentoRequest, SolicitarAgendamentoResponse, CancelarAgendamentoResponse, AgendamentoRequestJava } from '../types/api';

export const listAgendamentos    = () =>
  apiClient.get<AgendamentoTutorResponse[]>('/api/v1/tutor/agendamentos').then(r => r.data);

// TASK-74b (FIX_7): camada anti-corrupção, mesmo padrão de `consentimentos.service.ts`
// (TASK-73) e `auth.service.ts` (TASK-55/61) — a tela (`agenda/novo.tsx`) e o tipo
// app-facing `SolicitarAgendamentoRequest` continuam falando `sgTipoConsulta`/
// `dsMotivo`/`dtPreferida`; é aqui que o corpo vira o shape real do Java
// (`AgendamentoRequestJava`: `idPet`/`dtAgendamento`/`tipo`/`observacoes`). Antes
// desta task o service mandava o corpo cru da tela — `dtPreferida`, `sgTipoConsulta`
// e `dsMotivo` não existem no Java (`dtAgendamento`/`tipo`/`observacoes`), então os 3
// campos obrigatórios chegavam nulos e o POST devolvia 400 sempre (achado do Bloco 0
// do FIX_7, verificado na fonte pelo maestro).
//
// `idClinica` NUNCA é enviado (decisão do Felipe, task-74-brief.md item 1): o Java
// deriva a clínica a partir do pet. O app não teria esse dado de qualquer forma —
// nenhum DTO de pet do BFF expõe `idClinica`. `idVeterinario`/`duracaoMinutos`
// também ficam de fora: a tela não coleta esse dado, e inventar valor não é opção.
//
// Mapeamento de tipo (decisão do Felipe, item 2): `DsTipoConsulta` é string livre
// nos dois lados (sem `@Pattern` no Java, sem CHECK no Oracle — verificado), então
// `ROTINA` cru apareceria ao lado de `CONSULTA` na agenda da clínica se fosse
// enviado como está. `ROTINA` e `URGENCIA` mapeiam para `CONSULTA` (único valor de
// `AgendamentoRequest.tipo` que cobre consulta presencial); `RETORNO` e
// `TELEORIENTACAO` já são valores válidos no Java e não mudam. A urgência não pode
// se perder nesse mapeamento: quando o tutor escolhe `URGENCIA`, o prefixo
// `PREFIXO_URGENCIA` entra no início de `observacoes` — `CONSULTA` sozinho apagaria
// essa informação.
const PREFIXO_URGENCIA = '[URGENTE] ';

function mapTipoParaJava(sgTipoConsulta: SolicitarAgendamentoRequest['sgTipoConsulta']): AgendamentoRequestJava['tipo'] {
  if (sgTipoConsulta === 'ROTINA' || sgTipoConsulta === 'URGENCIA') return 'CONSULTA';
  return sgTipoConsulta; // RETORNO | TELEORIENTACAO — já válidos no Java, sem tradução
}

function montarObservacoes(req: SolicitarAgendamentoRequest): string {
  return req.sgTipoConsulta === 'URGENCIA' ? `${PREFIXO_URGENCIA}${req.dsMotivo}` : req.dsMotivo;
}

export const solicitarAgendamento = (req: SolicitarAgendamentoRequest) =>
  apiClient.post<SolicitarAgendamentoResponse>('/api/v1/tutor/agendamentos', {
    idPet:         req.idPet,
    dtAgendamento: req.dtPreferida,
    tipo:          mapTipoParaJava(req.sgTipoConsulta),
    observacoes:   montarObservacoes(req),
  } satisfies AgendamentoRequestJava).then(r => r.data);

export const cancelarAgendamento = (id: number) =>
  apiClient.delete<CancelarAgendamentoResponse>(`/api/v1/tutor/agendamentos/${id}`).then(r => r.data);
