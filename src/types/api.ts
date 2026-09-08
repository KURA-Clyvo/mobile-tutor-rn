// ─── Auth ─────────────────────────────────────────────────────
export interface LoginRequest { dsEmail: string; dsSenha: string; }
export interface LoginResponse { accessToken: string; expiresAt: string; tutor: TutorMe; }
// TASK-61: aceiteLembretes é obrigatório (bloqueia submit no cliente — consentimento
// LGPD real, não mais `aceites: []` fixo); aceiteTeleorientacao é opcional. Nomes
// app-facing — o mapeamento para o shape Java (TipoConsentimento/versaoTermo) fica
// isolado dentro de auth.service.ts (camada anti-corrupção, ver TASK-55).
export interface RegisterTutorRequest {
  inviteToken: string; nmTutor: string; dsSenha: string; dsTelefone: string;
  aceiteLembretes: boolean; aceiteTeleorientacao: boolean;
}
export interface RegisterTutorResponse { idTutor: number; accessToken: string; expiresAt: string; }
export interface TutorMe { id: number; nmTutor: string; dsEmail: string; dsTelefone: string; dtCadastro: string; }

// ─── Pets ─────────────────────────────────────────────────────
// T-2: os campos abaixo viraram OPCIONAIS porque o servidor real não os tem —
// medido em `PetResponse.java` (7 campos: idPet, nmPet, nmEspecie, nmRaca, sgSexo,
// dtNascimento, sgPorte). `nmClinica`/`nrConsultas` existem só no DTO de DETALHE;
// `dsStatusGeral` e `chips` não existem em lugar nenhum do Java, e `nrAlertasAtivos`
// é alerta de IoT, que é dado do backend .NET — não é campo que falta num DTO, é
// dado que este backend não possui.
//
// Opcional aqui NÃO é frouxidão: é o que permite a tela ocultar a seção em vez de
// exibir um valor inventado. `dsStatusGeral: 'OK'` por padrão diria ao tutor
// "tudo certo" sobre um pet cujo estado ninguém calculou.
export interface PetTutorResponse {
  id: number; nmPet: string; nmEspecie: string; nmRaca: string; dtNascimento: string;
  sgSexo: 'M' | 'F'; sgPorte: 'P' | 'M' | 'G' | 'GG';
  nmClinica?: string;
  dsStatusGeral?: 'OK' | 'ALERTA' | 'URGENTE'; nrAlertasAtivos?: number; nrConsultas?: number;
  dtUltimaConsulta?: string; dtProximoAgendamento?: string;
  chips?: { tone: 'sage' | 'amber' | 'clay' | 'ocean' | 'mute'; label: string }[];
  condicoes?: { label: string; tone: 'amber' | 'clay'; desde?: string; observacao?: string }[];
}
export interface PetTutorDetailResponse extends PetTutorResponse {
  dsObservacoes?: string; dsFotoUrl?: string; nrPesoKg?: number; nrTemperaturaC?: number; nrFreqCardiacaBpm?: number;
}

// ─── Timeline (read-only) ─────────────────────────────────────
export interface TimelineTutorEventResponse {
  idEventoClinico: number;
  nmTipo: 'CONSULTA' | 'VACINA' | 'PRESCRICAO' | 'EXAME' | 'PROCEDIMENTO' | 'TELEORIENTACAO';
  dtEvento: string; nmVeterinario?: string; nrCRMV?: string; nmClinica: string;
  // dsResumoPublico é opcional (TASK-31): o backend real (VW_TIMELINE_PET, derivada
  // de AGENDAMENTO) não tem um resumo clínico estruturado — só existe quando/se um
  // dia a timeline passar a agregar EVENTO_CLINICO/SOAP confirmado.
  sgTipoAtendimento?: 'pres' | 'tele'; dsResumoPublico?: string;
}
export interface TimelineTutorEventDetailResponse {
  idEventoClinico: number;
  nmTipo: 'CONSULTA' | 'VACINA' | 'PRESCRICAO' | 'EXAME' | 'PROCEDIMENTO' | 'TELEORIENTACAO';
  dtEvento: string; nrDuracaoMin?: number; sgTipoAtendimento?: 'pres' | 'tele';
  nmVeterinario?: string; nrCRMV?: string; dsEspecialidade?: string; nmClinica: string;
  nrPesoKg?: number; nrTemperaturaC?: number; nrFreqCardiacaBpm?: number;
  dsResumoPublico?: string; dsDiagnostico?: string; dsCID10Vet?: string; dsPlano?: string;
  prescricoes?: { nmMedicamento: string; dsPosologia: string; nrDuracaoDias?: number }[];
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
// T-2: `nmEspecie`/`nmRaca` do pet e `nmClinica` são OPCIONAIS — a `SJ3-10` do
// backend vai acrescentá-los a `AgendamentoResponse` (nomes já travados, no nível
// raiz do objeto), e até lá o servidor não os manda. `nmVeterinario` foi
// explicitamente deixado FORA daquela task: `Agendamento` tem `@Column Long
// idVeterinario`, sem `@ManyToOne`, então ele não sai de `@EntityGraph` — exigiria
// mapeamento novo numa entidade compartilhada com o .NET. Nenhuma tela deste app o
// renderiza (medido: `grep -rn nmVeterinario src/app` → 0).
export interface AgendamentoTutorResponse {
  id: number; dtInicio: string; nrDuracaoMinutos?: number;
  sgStatus: 'SOLICITADO' | 'AGENDADO' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO';
  sgTipoConsulta: 'RETORNO' | 'ROTINA' | 'URGENCIA' | 'TELEORIENTACAO';
  pet: { id: number; nmPet: string; nmEspecie?: string; nmRaca?: string };
  nmClinica?: string; dsMotivo?: string; nmVeterinario?: string; dsMensagemClinica?: string;
  // `nrVersion` do optimistic locking do Java — viaja do GET até o PUT de remarcar
  // (409 em conflito). Opcional porque o mock não o produz.
  nrVersion?: number;
  // Sala de teleconsulta (Daily.co), preenchida pelo backend-clinica-dotnet — null até o
  // veterinário iniciar a chamada (ver TASK-10/TASK-11). Só relevante quando
  // sgTipoConsulta === 'TELEORIENTACAO'.
  dsSalaUrl?: string | null;
}
export interface SolicitarAgendamentoRequest {
  idPet: number; sgTipoConsulta: 'RETORNO' | 'ROTINA' | 'URGENCIA' | 'TELEORIENTACAO';
  dsMotivo: string; dtPreferida: string; dtAlternativa?: string; idClinica?: number;
}
export interface SolicitarAgendamentoResponse { id: number; sgStatus: 'SOLICITADO'; dtSolicitacao: string; }

// T-7a: remarcar. `nrVersion` é obrigatório — é o optimistic lock do Java, e ele
// viaja do GET (via `mapAgendamentoDto`) até aqui. Sem ele o backend devolve 400.
export interface RemarcarAgendamentoRequest {
  id: number; dtPreferida: string; nrVersion: number;
}

// T-7a: shape real de `PUT /v1/tutor/agendamentos/{id}` — `AgendamentoUpdateRequest.java`.
// ⚠️ Os nomes NÃO são os mesmos do POST: aqui é `dsTipoConsulta`/`dsObservacoes`, lá é
// `tipo`/`observacoes`. Mesma entidade, dois vocabulários — a tradução mora no service.
// Campo nulo é IGNORADO pelo domínio (`Agendamento.atualizar` só sobrescreve o que vem
// não-nulo), então mandar só data + versão remarca sem apagar motivo nem tipo.
export interface AgendamentoUpdateRequestJava {
  dtAgendamento?: string; dsTipoConsulta?: string; dsObservacoes?: string;
  idVeterinario?: number; nrVersion: number;
}
export interface CancelarAgendamentoResponse { id: number; sgStatus: 'CANCELADO'; }

// TASK-74b (FIX_7): shape real de POST /v1/tutor/agendamentos — AgendamentoRequest.java
// (backend-tutor-java/.../agendamento/api/dto/AgendamentoRequest.java). `idPet`/
// `dtAgendamento`/`tipo` são obrigatórios (@NotNull/@Future/@NotBlank); `idClinica`/
// `idVeterinario`/`duracaoMinutos`/`observacoes` são opcionais. O app nunca manda
// `idClinica` (decisão do Felipe, task-74-brief.md item 1: o Java deriva a clínica
// do pet) nem `idVeterinario`/`duracaoMinutos` (a tela não tem esse dado — não
// inventar valor). A tradução de `SolicitarAgendamentoRequest` (app-facing) para
// este shape mora em `agendamentos.service.ts` (camada anti-corrupção, mesmo
// padrão de `consentimentos.service.ts`/TASK-73).
export interface AgendamentoRequestJava {
  idPet: number;
  idClinica?: number;
  idVeterinario?: number;
  // TASK-74b (FIX_7, rodada de fix 1): `LocalDateTime` no Java — relógio de parede,
  // SEM fuso. Formato esperado: `YYYY-MM-DDTHH:mm:ss`, SEM sufixo `Z` e SEM offset.
  // Um ISO com `Z` (`Date.toISOString()`) é aceito sem erro pelo Jackson (leniente),
  // mas o offset é descartado em silêncio — o valor gravado vira a hora UTC, não a
  // hora local que o tutor escolheu. Conversão feita em
  // `agendamentos.service.ts::paraLocalDateTimeJava`, nunca `.toISOString()` direto.
  dtAgendamento: string;
  tipo: 'CONSULTA' | 'RETORNO' | 'VACINA' | 'EXAME' | 'PROCEDIMENTO' | 'TELEORIENTACAO';
  duracaoMinutos?: number;
  observacoes?: string;
}

// ─── Consentimentos LGPD ──────────────────────────────────────
// TASK-73 (FIX_7): reescrito para o shape real do Java (ConsentimentoRequest/
// ConsentimentoResponse, backend-tutor-java/.../consentimento/api/dto). O shape
// anterior (dsTipoConsentimento/dsAceite:'SIM'|'NAO'/sgStatus/dtConsentimento) não
// batia com NENHUM campo do backend real — todo POST devolvia 400 (campo
// obrigatório ausente: tipo/versaoTermo/aceito) e todo GET nunca casava "ativo"
// (B0.1, KURA_BACKLOG_FIX_7). `TipoConsentimentoApi` é a mesma lista fechada de 5
// valores que `constants/lgpd.ts::TipoConsentimento` usa como chave — enum Java
// (TipoConsentimento.java) e CHECK constraint do Oracle (V1__initial_schema.sql:
// 241-243).
export type TipoConsentimentoApi =
  'TELEORIENTACAO' | 'LEMBRETES' | 'DADOS_ANONIMOS' | 'COMPARTILHAR_SEGURADORA' | 'MARKETING';

// GET e POST /api/v1/tutor/consentimentos devolvem o mesmo shape
// (ConsentimentoResponse.java) — POST 201 ao criar, 200 em replay idempotente.
export interface ConsentimentoResponse {
  idConsentimento: number;
  tipo: TipoConsentimentoApi;
  versaoTermo: string;
  aceito: boolean;
  ativo: boolean;
  dtAceite: string;
  dtRevogacao: string | null;
}

// O que vai no fio do POST (ConsentimentoRequest.java) — `aceito` aqui é STRING
// 'S'|'N' (@Pattern("[SN]")), diferente de ConsentimentoResponse.aceito, que É
// boolean na resposta. `textoTermo` é opcional, não usado pelo app hoje.
export interface ConsentimentoRequest {
  tipo: TipoConsentimentoApi;
  versaoTermo: string;
  aceito: 'S' | 'N';
  textoTermo?: string;
}

// ─── Notificações ─────────────────────────────────────────────
export interface NotificacaoTutorResponse {
  id: number;
  dsTipo: 'VACINA_VENCENDO' | 'RETORNO_PENDENTE' | 'AGENDAMENTO_CONFIRMADO' | 'AGENDAMENTO_CANCELADO' | 'COMUNICADO_CLINICA' | 'RESULTADO_EXAME';
  dsTitulo: string; dsMensagem: string; dtEnvio: string; flLida: boolean;
  idPet?: number; nmPet?: string; idAgendamento?: number;
}
export interface MarcarLidaResponse { id: number; flLida: true; }
// TASK-70: campo é `dsPlatforma` (PT-BR) no DTO Java real
// (PushTokenRequest.java:19) — este tipo estava declarado com `dsPlatform`
// (inglês), mesmo erro do payload que o service mandava e nunca foi pego
// porque o tipo nunca era importado em lugar nenhum (achado ao corrigir
// notifications.service.ts::registerDeviceToken).
export interface RegisterPushTokenRequest { dsPushToken: string; dsPlatforma: 'ios' | 'android'; }

// ─── Erros ───────────────────────────────────────────────────
export interface ApiError { status: number; code: string; message: string; details?: Record<string, string[]>; }

// ─── Wire types reais do backend-tutor-java (TASK-31) ─────────────────────────
// Os tipos acima (PetTutorDetailResponse, TimelineTutorEventResponse, etc.) são o
// contrato *consumido pela UI* — nem sempre 1:1 com o JSON que o Java retorna hoje.
// Os tipos abaixo espelham fielmente os DTOs Java (bff/api/*, timeline/api/dto/*,
// notificacao/api/dto/*); `utils/mappers.ts` converte Raw → UI, preenchendo como
// ausente (undefined/[]) qualquer campo que a UI espera mas o backend não tem hoje
// (nunca inventa dado clínico). Ver docs/INT-01-contract-map.md.
export interface PageRaw<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
// ─── Shapes CRUS do BFF Java (T-2) ────────────────────────────
// Transcritos de `backend-tutor-java @ 3290687`, campo a campo. Os `record` do Java
// são serializados pelo Jackson com o nome do componente, então estes nomes são os
// que chegam no JSON.

/** `PetResponse.java` — item de `Page<PetResponse>` em `GET /v1/tutor/pets`. 7 campos, só. */
export interface PetListaRaw {
  idPet: number; nmPet: string; nmEspecie: string;
  /** `"SRD"` literal quando a raça é nula no banco — não vem `null`. */
  nmRaca: string;
  sgSexo: 'M' | 'F'; dtNascimento: string; sgPorte: 'P' | 'M' | 'G';
}

/**
 * `AgendamentoResponse.java` — item de `Page<AgendamentoResponse>` em
 * `GET /v1/tutor/agendamentos`. Os 3 campos opcionais no fim chegam com a `SJ3-10`;
 * o app já os lê para não precisar de uma segunda rodada quando o backend subir.
 */
export interface AgendamentoRaw {
  idAgendamento: number; idTutor: number; idPet: number; nmPet: string;
  idClinica: number; idVeterinario: number | null;
  dtAgendamento: string; nrDuracaoMinutos: number | null;
  tipo: 'CONSULTA' | 'RETORNO' | 'VACINA' | 'EXAME' | 'PROCEDIMENTO' | 'TELEORIENTACAO' | string;
  /** Pode vir `null`: o `fromEntity` do Java guarda contra `stStatus` nulo. */
  status: 'INTENCAO' | 'AGENDADO' | 'CONFIRMADO' | 'REALIZADO' | 'CANCELADO' | 'NAO_COMPARECEU' | string | null;
  origem: string | null; observacoes: string | null;
  dtCriacao: string | null; dtConfirmacao: string | null; dtCancelamento: string | null;
  nrVersion: number | null; dsSalaUrl: string | null;
  nmEspecie?: string | null; nmRaca?: string | null; nmClinica?: string | null;
}

export interface PetDetalheRaw {
  idPet: number; nmPet: string; nmEspecie: string; nmRaca: string;
  sgSexo: 'M' | 'F'; dtNascimento: string; sgPorte: 'P' | 'M' | 'G';
  nmClinica: string; nmVeterinarioResponsavel: string | null; nrConsultas: number;
}
export interface TimelineEventoRaw {
  idEvento: number; idPet: number; nmPet: string; dtEvento: string;
  dsTipoEvento: string; stStatus: string; idClinica: number; nmClinica: string;
}
export interface VacinaVencendoRaw {
  idPet: number; nmVacina: string; dtProximaDose: string; idClinica: number; nmClinica: string;
}
export interface VacinaStatusRaw {
  idPet: number; qtdPendentes: number; dtProximaDose: string | null;
  dsStatusGeral: 'EM_DIA' | 'ALERTA';
}
export interface NotificacaoRaw {
  idNotificacao: number; dsTitulo: string; dsMensagem: string; dtCriacao: string; flLida: boolean;
}
