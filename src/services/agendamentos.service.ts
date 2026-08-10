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

// TASK-74b (FIX_7, rodada de fix 1): `dtAgendamento` é `LocalDateTime` no Java —
// relógio de parede, SEM fuso. `req.dtPreferida` chega como ISO com sufixo `Z`
// (`agenda/novo.tsx::dtPreferida`, monta um `Date` com o horário LOCAL escolhido
// via `setHours` e serializa com `.toISOString()`, que converte pra UTC). O
// Jackson do lado Java desserializa esse `Z` de forma leniente e **descarta o
// offset em silêncio** (`LocalDateTime.ofInstant(Instant.parse(...), UTC)`) — sem
// 400, sem crash, só grava a hora ERRADA: tutor escolhe 10:30 em UTC-3, o servidor
// grava 13:30. Achado pela revisão da rodada 1 (commit `5bb05d7`), com
// `TZ=America/Sao_Paulo` confirmado.
//
// Fix: desfazer a conversão UTC feita pela tela, sem tocar na tela (mesmo
// argumento que levou toda a tradução de shape pra cá). `new Date(isoComZ)`
// recria o mesmo instante; os getters LOCAIS (`getHours`/`getMinutes`/...)
// devolvem de volta os valores de relógio de parede que `novo.tsx` tinha
// escolhido — porque o service roda no MESMO processo/fuso que criou a string
// (React Native é single-thread; não há troca de fuso entre a tela e esta
// chamada). O resultado é formatado sem `Z`/offset (`YYYY-MM-DDTHH:mm:ss`), como
// `LocalDateTime` do Java espera.
function paraLocalDateTimeJava(isoComOffset: string): string {
  const d = new Date(isoComOffset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
         `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const solicitarAgendamento = (req: SolicitarAgendamentoRequest) =>
  apiClient.post<SolicitarAgendamentoResponse>('/api/v1/tutor/agendamentos', {
    idPet:         req.idPet,
    dtAgendamento: paraLocalDateTimeJava(req.dtPreferida),
    tipo:          mapTipoParaJava(req.sgTipoConsulta),
    observacoes:   montarObservacoes(req),
  } satisfies AgendamentoRequestJava).then(r => r.data);

export const cancelarAgendamento = (id: number) =>
  apiClient.delete<CancelarAgendamentoResponse>(`/api/v1/tutor/agendamentos/${id}`).then(r => r.data);
