import type {
  PetTutorResponse, PetTutorDetailResponse, PetDetalheRaw,
  TimelineTutorEventResponse, TimelineTutorEventDetailResponse, TimelineEventoRaw,
  VacinaTutorResponse, VacinaVencendoRaw, VacinaStatusResponse, VacinaStatusRaw,
  NotificacaoTutorResponse, NotificacaoRaw,
} from '../types/api';
import type { PetDomain } from '../types/domain';

function calcIdade(dtNascimento: string): number {
  return Math.floor((Date.now() - new Date(dtNascimento).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export function mapPetDto(dto: PetTutorResponse): PetDomain {
  return {
    id: dto.id, nome: dto.nmPet, especie: dto.nmEspecie, raca: dto.nmRaca,
    nascimento: new Date(dto.dtNascimento), sexo: dto.sgSexo, porte: dto.sgPorte,
    nmClinica: dto.nmClinica, statusGeral: dto.dsStatusGeral,
    alertasAtivos: dto.nrAlertasAtivos, idadeAnos: calcIdade(dto.dtNascimento),
    nrConsultas: dto.nrConsultas, chips: dto.chips, condicoes: dto.condicoes,
    dtProximoAgendamento: dto.dtProximoAgendamento ? new Date(dto.dtProximoAgendamento) : undefined,
    dtUltimaConsulta: dto.dtUltimaConsulta ? new Date(dto.dtUltimaConsulta) : undefined,
  };
}

// ─── TASK-31 — mappers Raw (Java real) → UI ───────────────────────────────────
// O backend hoje não tem dado para chips/condições/vitais/diagnóstico/prescrições/
// histórico de vacina aplicada — nenhum desses campos é inventado; ficam ausentes
// e os componentes (já preparados com guards opcionais) simplesmente ocultam a
// seção correspondente. Ver docs/INT-01-contract-map.md para o detalhe por campo.

/** Detalhe do pet (GET /pets/{id}) — TASK-31. */
export function mapPetDetailDto(raw: PetDetalheRaw): PetTutorDetailResponse {
  return {
    id: raw.idPet, nmPet: raw.nmPet, nmEspecie: raw.nmEspecie, nmRaca: raw.nmRaca,
    dtNascimento: raw.dtNascimento, sgSexo: raw.sgSexo, sgPorte: raw.sgPorte,
    nmClinica: raw.nmClinica,
    dsStatusGeral: 'OK', nrAlertasAtivos: 0, nrConsultas: raw.nrConsultas,
    chips: [],
  };
}

/** Item de timeline (lista e detalhe usam o mesmo DTO Java) — TASK-31. */
export function mapTimelineEventoDto(raw: TimelineEventoRaw): TimelineTutorEventResponse {
  return {
    idEventoClinico: raw.idEvento,
    nmTipo: raw.dsTipoEvento as TimelineTutorEventResponse['nmTipo'],
    dtEvento: raw.dtEvento,
    nmClinica: raw.nmClinica,
  };
}

/** Detalhe de evento — hoje mesma fonte de dado da lista (sem SOAP/diagnóstico estruturado). */
export function mapTimelineEventoDetailDto(raw: TimelineEventoRaw): TimelineTutorEventDetailResponse {
  return {
    idEventoClinico: raw.idEvento,
    nmTipo: raw.dsTipoEvento as TimelineTutorEventDetailResponse['nmTipo'],
    dtEvento: raw.dtEvento,
    nmClinica: raw.nmClinica,
  };
}

/** Hash simples e estável — só para gerar uma key numérica de vacina (VW não tem PK própria). */
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Vacina pendente (GET /pets/{id}/vacinas) — TASK-31.
 * VW_VACINAS_VENCENDO só lista pendências futuras (nunca aplicadas/vencidas) —
 * por isso sgStatus aqui é sempre 'VENCENDO'. dtAplicacao não existe como conceito
 * nesta fonte; usamos a própria dtProximaDose (mais honesto que "Invalid Date").
 */
export function mapVacinaDto(raw: VacinaVencendoRaw): VacinaTutorResponse {
  return {
    id: hashId(`${raw.idPet}-${raw.nmVacina}-${raw.dtProximaDose}`),
    nmVacina: raw.nmVacina,
    dtAplicacao: raw.dtProximaDose,
    dtProximaDose: raw.dtProximaDose,
    nmClinica: raw.nmClinica,
    sgStatus: 'VENCENDO',
  };
}

/** Resumo de vacinação (GET /pets/{id}/vacinas/status) — TASK-31. */
export function mapVacinaStatusDto(raw: VacinaStatusRaw): VacinaStatusResponse {
  return {
    nrAplicadas: 0,
    nrTotal: raw.qtdPendentes,
    dsStatusGeral: raw.dsStatusGeral,
  };
}

/**
 * Notificação (GET /notificacoes) — TASK-31.
 * NOTIFICACAO (.NET owned) não tem coluna de tipo/idPet/idAgendamento — dsTipo
 * cai no bucket genérico 'COMUNICADO_CLINICA' (não inventamos uma categoria mais
 * específica sem dado para sustentá-la).
 */
export function mapNotificacaoDto(raw: NotificacaoRaw): NotificacaoTutorResponse {
  return {
    id: raw.idNotificacao,
    dsTipo: 'COMUNICADO_CLINICA',
    dsTitulo: raw.dsTitulo,
    dsMensagem: raw.dsMensagem,
    dtEnvio: raw.dtCriacao,
    flLida: raw.flLida,
  };
}
