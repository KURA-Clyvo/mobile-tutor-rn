// TASK-81 (KURA_BACKLOG_FIX_7). Registry de cobertura do smoke-contratos.sh
// (DevOps-Cloud) para as funções de `src/services/*.service.ts` deste app que fazem
// chamada HTTP real — ver `discover-network-consumers.ts` para como a LISTA de chaves
// é derivada do código (não escrita à mão) e `smoke-coverage.test.ts` para como este
// registry é verificado nos dois sentidos: (1) toda função descoberta tem que ter
// entrada aqui, (2) toda entrada aqui tem que corresponder a uma função descoberta de
// verdade (sem órfã) e (3) todo valor `coberto` tem que ser um nome de check que
// EXISTE de fato em `DevOps-Cloud/scripts/smoke-contratos.sh` — não uma alegação.
//
// Isto não é o manifesto "documentação que garante o que o código não faz" que já
// reprovou task neste projeto (ver CLAUDE.md, lição do FIX_6): a lista de CHAVES é
// derivada por AST, e o valor `coberto` de cada uma é validado contra o script real
// sempre que `DevOps-Cloud` está disponível como repo irmão (ver nota em
// smoke-coverage.test.ts sobre a limitação em CI de checkout único).
export type CoverageEntry =
  | { coberto: string }
  | { naoCoberto: string };

export const SMOKE_COVERAGE_REGISTRY: Record<string, CoverageEntry> = {
  // agendamentos.service.ts
  'agendamentos.service.ts::listAgendamentos': { coberto: 'tutor/agendamentos (GET lista)' },
  'agendamentos.service.ts::solicitarAgendamento': {
    coberto: 'tutor/agendamentos (POST — AG1, para teleconsulta)',
  },
  'agendamentos.service.ts::cancelarAgendamento': {
    coberto: 'tutor/agendamentos (DELETE — cancelar AG2)',
  },

  // auth.service.ts
  'auth.service.ts::login': { coberto: 'tutor/auth/login' },
  'auth.service.ts::register': { coberto: 'tutor/auth/register-invite' },

  // consentimentos.service.ts
  'consentimentos.service.ts::listConsentimentos': { coberto: 'tutor/consentimentos (GET lista)' },
  'consentimentos.service.ts::assinar': {
    coberto: 'tutor/consentimentos (POST — assinar MARKETING)',
  },
  'consentimentos.service.ts::revogar': {
    coberto: 'tutor/consentimentos (POST — revogar MARKETING)',
  },

  // notifications.service.ts
  'notifications.service.ts::getNotificacoes': { coberto: 'tutor/notificacoes (GET)' },
  'notifications.service.ts::registerDeviceToken': { coberto: 'tutor/me/push-token (PATCH)' },

  // pets.service.ts
  'pets.service.ts::listPets': { coberto: 'tutor/pets (GET lista)' },
  'pets.service.ts::getPetById': { coberto: 'tutor/pets/{id} (GET detalhe)' },

  // timeline.service.ts
  'timeline.service.ts::getTimeline': { coberto: 'tutor/pets/{id}/timeline (GET)' },
  'timeline.service.ts::getEventDetail': {
    coberto: 'tutor/pets/{id}/timeline/{idEvento} (GET detalhe)',
  },

  // vacinas.service.ts
  'vacinas.service.ts::getVacinas': { coberto: 'tutor/pets/{id}/vacinas (GET)' },
  'vacinas.service.ts::getVacinaStatus': { coberto: 'tutor/pets/{id}/vacinas/status (GET)' },
};
