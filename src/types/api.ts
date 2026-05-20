// ─── Auth ─────────────────────────────────────────────────────
export interface LoginRequest { dsEmail: string; dsSenha: string; }
export interface LoginResponse { accessToken: string; expiresAt: string; tutor: TutorMe; }
export interface RegisterTutorRequest { inviteToken: string; nmTutor: string; dsSenha: string; dsTelefone: string; }
export interface RegisterTutorResponse { idTutor: number; accessToken: string; expiresAt: string; }
export interface TutorMe { id: number; nmTutor: string; dsEmail: string; dsTelefone: string; dtCadastro: string; }

// ─── Pets ─────────────────────────────────────────────────────
export interface PetTutorResponse {
  id: number; nmPet: string; nmEspecie: string; nmRaca: string; dtNascimento: string;
  sgSexo: 'M' | 'F'; sgPorte: 'P' | 'M' | 'G' | 'GG'; nmClinica: string;
  dsStatusGeral: 'OK' | 'ALERTA' | 'URGENTE'; nrAlertasAtivos: number; nrConsultas: number;
  dtUltimaConsulta?: string; dtProximoAgendamento?: string;
  chips: Array<{ tone: 'sage' | 'amber' | 'clay' | 'ocean' | 'mute'; label: string }>;
}
export interface PetTutorDetailResponse extends PetTutorResponse {
  dsObservacoes?: string; dsFotoUrl?: string; nrPesoKg?: number; nrTemperaturaC?: number; nrFreqCardiacaBpm?: number;
}

// ─── Timeline (read-only) ─────────────────────────────────────
export interface TimelineTutorEventResponse {
  idEventoClinico: number;
  nmTipo: 'CONSULTA' | 'VACINA' | 'PRESCRICAO' | 'EXAME' | 'TELEORIENTACAO';
  dtEvento: string; nmVeterinario?: string; nrCRMV?: string; nmClinica: string;
  sgTipoAtendimento?: 'pres' | 'tele'; dsResumoPublico: string;
}
export interface TimelineTutorEventDetailResponse {
  idEventoClinico: number;
  nmTipo: 'CONSULTA' | 'VACINA' | 'PRESCRICAO' | 'EXAME' | 'TELEORIENTACAO';
  dtEvento: string; nrDuracaoMin?: number; sgTipoAtendimento?: 'pres' | 'tele';
  nmVeterinario?: string; nrCRMV?: string; dsEspecialidade?: string; nmClinica: string;
  nrPesoKg?: number; nrTemperaturaC?: number; nrFreqCardiacaBpm?: number;
  dsResumoPublico?: string; dsDiagnostico?: string; dsCID10Vet?: string; dsPlano?: string;
  prescricoes?: Array<{ nmMedicamento: string; dsPosologia: string; nrDuracaoDias?: number }>;
  dtRetornoAgendado?: string; dsRetornoInstrucao?: string;
}

// ─── Vacinas ─────────────────────────────────────────────────
export interface VacinaTutorResponse {
  id: number; nmVacina: string; dtAplicacao: string; nmClinica: string;
  nmVeterinario?: string; nrLote?: string; dtProximaDose?: string;
  sgStatus: 'EM_DIA' | 'VENCENDO' | 'VENCIDA';
}
export interface VacinaStatusResponse {
  nrAplicadas: number; nrTotal: number; dsStatusGeral: 'EM_DIA' | 'ALERTA' | 'VENCIDA';
  dtUltimaAplicacao?: string; nmUltimaVacina?: string;
}

// ─── Agendamentos ─────────────────────────────────────────────
export interface AgendamentoTutorResponse {
  id: number; dtInicio: string; nrDuracaoMinutos: number;
  sgStatus: 'SOLICITADO' | 'AGENDADO' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO';
  sgTipoConsulta: 'RETORNO' | 'ROTINA' | 'URGENCIA' | 'TELEORIENTACAO';
  pet: { id: number; nmPet: string; nmEspecie: string; nmRaca: string };
  nmClinica: string; dsMotivo: string; nmVeterinario?: string; dsMensagemClinica?: string;
}
export interface SolicitarAgendamentoRequest {
  idPet: number; sgTipoConsulta: 'RETORNO' | 'ROTINA' | 'URGENCIA' | 'TELEORIENTACAO';
  dsMotivo: string; dtPreferida: string; dtAlternativa?: string; idClinica?: number;
}
export interface SolicitarAgendamentoResponse { id: number; sgStatus: 'SOLICITADO'; dtSolicitacao: string; }
export interface CancelarAgendamentoResponse { id: number; sgStatus: 'CANCELADO'; }

// ─── Consentimentos LGPD ──────────────────────────────────────
export interface ConsentimentoResponse {
  id: number;
  dsTipoConsentimento: 'COMUNICACAO_WHATSAPP' | 'DADOS_CLINICOS_IA' | 'COMPARTILHAMENTO_LABORATORIO';
  sgStatus: 'ATIVO' | 'REVOGADO'; dtConsentimento: string; dtRevogacao?: string;
}
export interface AssinarConsentimentoRequest {
  dsTipoConsentimento: 'COMUNICACAO_WHATSAPP' | 'DADOS_CLINICOS_IA' | 'COMPARTILHAMENTO_LABORATORIO';
  dsAceite: 'SIM'; // STRING not boolean — LGPD audit requirement
}
export interface AssinarConsentimentoResponse {
  id: number; sgStatus: 'ATIVO'; dtConsentimento: string; dsIdempotencyKey: string;
}
export interface RevogarConsentimentoResponse { id: number; sgStatus: 'REVOGADO'; dtRevogacao: string; }

// ─── Notificações ─────────────────────────────────────────────
export interface NotificacaoTutorResponse {
  id: number;
  dsTipo: 'VACINA_VENCENDO' | 'RETORNO_PENDENTE' | 'AGENDAMENTO_CONFIRMADO' | 'AGENDAMENTO_CANCELADO' | 'COMUNICADO_CLINICA' | 'RESULTADO_EXAME';
  dsTitulo: string; dsMensagem: string; dtEnvio: string; flLida: boolean;
  idPet?: number; nmPet?: string; idAgendamento?: number;
}
export interface MarcarLidaResponse { id: number; flLida: true; }
export interface RegisterPushTokenRequest { dsPushToken: string; dsPlatform: 'ios' | 'android'; }

// ─── Erros ───────────────────────────────────────────────────
export interface ApiError { status: number; code: string; message: string; details?: Record<string, string[]>; }
