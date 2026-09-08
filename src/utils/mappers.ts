import type {
  PetTutorResponse, PetTutorDetailResponse, PetDetalheRaw,
  PetListaRaw, AgendamentoRaw, AgendamentoTutorResponse,
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

// ─── T-2 — listas paginadas: Java cru → shape app-facing ──────────────────────
// Fonte: `backend-tutor-java @ 3290687`, DTOs lidos campo a campo (transcrição em
// `src/types/api.ts`). Envelope `Page<T>` fica com `desembrulharPagina`; aqui é só
// tradução de NOME e de VALOR — as duas divergências são independentes.

/** Item de `GET /v1/tutor/pets` (`PetResponse`) → o shape que as telas consomem. */
export function mapPetListaDto(raw: PetListaRaw): PetTutorResponse {
  return {
    id: raw.idPet,
    nmPet: raw.nmPet,
    nmEspecie: raw.nmEspecie,
    nmRaca: raw.nmRaca,
    dtNascimento: raw.dtNascimento,
    sgSexo: raw.sgSexo,
    sgPorte: raw.sgPorte,
    // nmClinica, dsStatusGeral, nrAlertasAtivos, nrConsultas, chips e condicoes NÃO
    // existem em `PetResponse` — ficam ausentes, nunca preenchidos com valor de
    // enfeite. `dsStatusGeral: 'OK'` diria "tudo certo" sobre um pet cujo estado
    // ninguém calculou, e `nrAlertasAtivos` é dado de IoT, que mora no backend .NET.
  };
}

/**
 * `status` do Java → `sgStatus` do app. As duas listas NÃO são a mesma:
 * o Java tem `INTENCAO`/`REALIZADO`/`NAO_COMPARECEU`, que o app não conhece, e o app
 * tem `SOLICITADO`/`CONCLUIDO`, que o Java não emite. A tradução mora aqui, no app, por
 * decisão da trilha Java: renomear valor no Java quebraria o Swagger e os testes de lá.
 *
 * `NAO_COMPARECEU` cai em `CONCLUIDO` porque, do ponto de vista do tutor, é um
 * agendamento que já passou e não vai acontecer de novo — não é cancelamento (que ele
 * mesmo poderia ter feito) nem compromisso futuro. É a aproximação menos errada com os
 * 5 valores que a UI tem hoje.
 */
const STATUS_JAVA_PARA_APP: Record<string, AgendamentoTutorResponse['sgStatus']> = {
  INTENCAO:       'SOLICITADO',
  AGENDADO:       'AGENDADO',
  CONFIRMADO:     'CONFIRMADO',
  REALIZADO:      'CONCLUIDO',
  CANCELADO:      'CANCELADO',
  NAO_COMPARECEU: 'CONCLUIDO',
};

/**
 * `tipo` do Java → `sgTipoConsulta` do app. É o inverso do `mapTipoParaJava` de
 * `agendamentos.service.ts`, e a volta é lossy de propósito: `ROTINA` e `URGENCIA`
 * viajam como `CONSULTA`, então tudo que volta como `CONSULTA` vira `ROTINA`. A
 * urgência não se perde para o tutor — ela vive no prefixo `[URGENTE]` de
 * `observacoes`, que é o que a tela mostra como motivo.
 *
 * `VACINA`, `EXAME` e `PROCEDIMENTO` existem no Java e não têm equivalente na UI do
 * tutor (que só oferece presencial e teleorientação); caem em `ROTINA`, o rótulo
 * neutro, em vez de sumirem da lista.
 */
const TIPO_JAVA_PARA_APP: Record<string, AgendamentoTutorResponse['sgTipoConsulta']> = {
  CONSULTA:       'ROTINA',
  RETORNO:        'RETORNO',
  TELEORIENTACAO: 'TELEORIENTACAO',
  VACINA:         'ROTINA',
  EXAME:          'ROTINA',
  PROCEDIMENTO:   'ROTINA',
};

/** Item de `GET /v1/tutor/agendamentos` (`AgendamentoResponse`) → shape app-facing. */
export function mapAgendamentoDto(raw: AgendamentoRaw): AgendamentoTutorResponse {
  return {
    id:        raw.idAgendamento,
    dtInicio:  raw.dtAgendamento,
    sgStatus:  STATUS_JAVA_PARA_APP[raw.status ?? ''] ?? 'SOLICITADO',
    sgTipoConsulta: TIPO_JAVA_PARA_APP[raw.tipo] ?? 'ROTINA',
    pet: {
      id:    raw.idPet,
      nmPet: raw.nmPet,
      // Chegam com a SJ3-10 do backend; até lá a linha secundária do card fica vazia.
      ...(raw.nmEspecie ? { nmEspecie: raw.nmEspecie } : {}),
      ...(raw.nmRaca    ? { nmRaca:    raw.nmRaca    } : {}),
    },
    ...(raw.nrDuracaoMinutos != null ? { nrDuracaoMinutos: raw.nrDuracaoMinutos } : {}),
    ...(raw.nmClinica  ? { nmClinica:  raw.nmClinica  } : {}),
    ...(raw.observacoes ? { dsMotivo:  raw.observacoes } : {}),
    ...(raw.dsSalaUrl  ? { dsSalaUrl:  raw.dsSalaUrl  } : {}),
    ...(raw.nrVersion != null ? { nrVersion: raw.nrVersion } : {}),
    // `nmVeterinario` NÃO é mapeado: não existe em `AgendamentoResponse` e ficou fora
    // da SJ3-10 (a entidade não tem associação com Veterinario, só `Long
    // idVeterinario`). Nenhuma tela deste app o renderiza.
  };
}
