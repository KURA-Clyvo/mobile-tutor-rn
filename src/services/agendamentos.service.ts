import { apiClient } from './api/client';
import type { AgendamentoTutorResponse, SolicitarAgendamentoRequest, SolicitarAgendamentoResponse, CancelarAgendamentoResponse } from '../types/api';

export const listAgendamentos    = () =>
  apiClient.get<AgendamentoTutorResponse[]>('/api/v1/tutor/agendamentos').then(r => r.data);

export const solicitarAgendamento = (req: SolicitarAgendamentoRequest) =>
  apiClient.post<SolicitarAgendamentoResponse>('/api/v1/tutor/agendamentos', req).then(r => r.data);

export const cancelarAgendamento  = (id: number) =>
  apiClient.delete<CancelarAgendamentoResponse>(`/api/v1/tutor/agendamentos/${id}`).then(r => r.data);
