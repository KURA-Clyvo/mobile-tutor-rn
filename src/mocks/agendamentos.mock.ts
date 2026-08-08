import type { InternalAxiosRequestConfig } from 'axios';
import type { AgendamentoTutorResponse, CancelarAgendamentoResponse } from '../types/api';
export async function list(): Promise<AgendamentoTutorResponse[]> {
  return [
    { id: 1, dtInicio: new Date(Date.now() + 2 * 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'RETORNO', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'Clínica KURA Pinheiros', dsMotivo: 'Retorno pós-consulta' },
    { id: 2, dtInicio: new Date(Date.now() + 7 * 86400_000).toISOString(), nrDuracaoMinutos: 60, sgStatus: 'CONFIRMADO', sgTipoConsulta: 'ROTINA', pet: { id: 2, nmPet: 'Luna', nmEspecie: 'Gato', nmRaca: 'Siamesa' }, nmClinica: 'Clínica KURA Pinheiros', dsMotivo: 'Check-up anual', nmVeterinario: 'Dra. Ana Ferreira' },
    { id: 4, dtInicio: new Date(Date.now() + 1 * 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'CONFIRMADO', sgTipoConsulta: 'TELEORIENTACAO', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'Clínica KURA Pinheiros', dsMotivo: 'Teleorientação de rotina', nmVeterinario: 'Dra. Ana Ferreira', dsSalaUrl: 'https://kura.daily.co/room-4' },
    { id: 3, dtInicio: new Date(Date.now() - 15 * 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'CONCLUIDO', sgTipoConsulta: 'ROTINA', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'Clínica KURA Pinheiros', dsMotivo: 'Vacina V10' },
  ];
}
export async function criar(): Promise<{ id: number; sgStatus: 'SOLICITADO'; dtSolicitacao: string }> {
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
export async function cancelar(config: InternalAxiosRequestConfig): Promise<CancelarAgendamentoResponse> {
  const match = config.url?.match(/\/tutor\/agendamentos\/(\d+)$/);
  const id = match ? Number(match[1]) : 0;
  return { id, sgStatus: 'CANCELADO' };
}
