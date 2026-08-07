import type {
  PetTutorResponse, PetDetalheRaw, PageRaw, TimelineEventoRaw,
} from '../types/api';

export const PETS: PetTutorResponse[] = [
  {
    id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10',
    sgSexo: 'M', sgPorte: 'G', nmClinica: 'Clínica KURA Pinheiros', dsStatusGeral: 'URGENTE',
    nrAlertasAtivos: 1, nrConsultas: 8, dtUltimaConsulta: new Date(Date.now() - 6 * 86400_000).toISOString(),
    dtProximoAgendamento: new Date(Date.now() + 2 * 86400_000).toISOString(),
    chips: [{ tone: 'clay', label: '⚠ Retorno 2d' }, { tone: 'sage', label: 'Vacinado' }],
    condicoes: [{ label: 'Displasia de quadril', tone: 'clay', desde: '2023-05-01', observacao: 'Acompanhamento contínuo, evitar esforço nas patas traseiras.' }],
  },
  {
    id: 2, nmPet: 'Luna', nmEspecie: 'Gato', nmRaca: 'Siamesa', dtNascimento: '2019-07-22',
    sgSexo: 'F', sgPorte: 'P', nmClinica: 'Clínica KURA Pinheiros', dsStatusGeral: 'OK',
    nrAlertasAtivos: 0, nrConsultas: 12,
    dtProximoAgendamento: new Date(Date.now() + 20 * 86400_000).toISOString(),
    chips: [{ tone: 'sage', label: 'Vacinado' }, { tone: 'mute', label: 'Siamesa' }],
  },
  {
    id: 3, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'SRD', dtNascimento: '2023-01-15',
    sgSexo: 'M', sgPorte: 'M', nmClinica: 'Clínica KURA Pinheiros', dsStatusGeral: 'ALERTA',
    nrAlertasAtivos: 1, nrConsultas: 2,
    dtProximoAgendamento: new Date(Date.now() + 5 * 86400_000).toISOString(),
    chips: [{ tone: 'amber', label: '✨ Câmera Luna' }, { tone: 'mute', label: 'Em adaptação' }],
    condicoes: [{ label: 'Alergia alimentar', tone: 'amber', desde: '2024-02-10', observacao: 'Evitar ração com frango. Substituído por dieta hipoalergênica.' }],
  },
];

export async function list(): Promise<PetTutorResponse[]> { return PETS; }

// TASK-65 (FIX_5): devolve o shape RAW do Java (PetDetalheRaw — idPet, sgPorte
// restrito a P/M/G, nmVeterinarioResponsavel), que é o que getPetById()/
// mapPetDetailDto() de fato consomem. Antes devolvia PetTutorDetailResponse
// (app-facing, campo `id`), o mesmo bug de classe do B0.1/TASK-64 — `raw.idPet`
// dava undefined e peso/temperatura/condições eram descartados silenciosamente
// (mapPetDetailDto não lê nenhum desses campos do tipo errado).
export async function byId(config: { url?: string }): Promise<PetDetalheRaw> {
  const match = config.url?.match(/\/pets\/(\d+)$/);
  const id = match ? parseInt(match[1] ?? '1', 10) : 1;
  const found = PETS.find(p => p.id === id);
  if (!found) throw { response: { status: 404 } };
  return {
    idPet: found.id,
    nmPet: found.nmPet,
    nmEspecie: found.nmEspecie,
    nmRaca: found.nmRaca,
    sgSexo: found.sgSexo,
    dtNascimento: found.dtNascimento,
    // PetDetalheRaw não tem 'GG' (só P/M/G) — nenhum item de PETS usa 'GG' hoje,
    // mas o fallback documenta a decisão em vez de deixar um cast silencioso.
    sgPorte: found.sgPorte === 'GG' ? 'G' : found.sgPorte,
    nmClinica: found.nmClinica,
    nmVeterinarioResponsavel: null,
    nrConsultas: found.nrConsultas,
  };
}

// Dataset raw compartilhado entre timeline() (lista) e timelineDetail() (item).
// dsTipoEvento usa os mesmos literais de TimelineTutorEventResponse['nmTipo'] de
// propósito: mapTimelineEventoDto faz um cast direto (`raw.dsTipoEvento as
// TimelineTutorEventResponse['nmTipo']`), sem tabela de tradução — se os literais
// aqui divergirem dos do enum, o mock passa a "funcionar" mas exibe um nmTipo
// que a UI não reconhece.
const TIMELINE_ITEMS: Omit<TimelineEventoRaw, 'idPet' | 'nmPet'>[] = [
  { idEvento: 201, dtEvento: new Date(Date.now() - 6 * 86400_000).toISOString(), dsTipoEvento: 'CONSULTA', stStatus: 'REALIZADO', idClinica: 1, nmClinica: 'Clínica KURA Pinheiros' },
  { idEvento: 202, dtEvento: new Date(Date.now() - 30 * 86400_000).toISOString(), dsTipoEvento: 'VACINA', stStatus: 'REALIZADO', idClinica: 1, nmClinica: 'Clínica KURA Pinheiros' },
  { idEvento: 203, dtEvento: new Date(Date.now() - 3 * 86400_000).toISOString(), dsTipoEvento: 'TELEORIENTACAO', stStatus: 'REALIZADO', idClinica: 1, nmClinica: 'Clínica KURA Pinheiros' },
  { idEvento: 204, dtEvento: new Date(Date.now() - 10 * 86400_000).toISOString(), dsTipoEvento: 'PRESCRICAO', stStatus: 'REALIZADO', idClinica: 1, nmClinica: 'Clínica KURA Pinheiros' },
  { idEvento: 205, dtEvento: new Date(Date.now() - 15 * 86400_000).toISOString(), dsTipoEvento: 'EXAME', stStatus: 'REALIZADO', idClinica: 1, nmClinica: 'Clínica KURA Pinheiros' },
];

// TASK-65: devolve PageRaw<TimelineEventoRaw> (Spring Data Page — `.content`),
// que é o que getTimeline() de fato desembrulha (`r.data.content.map(...)`).
// Antes devolvia um array nu de TimelineTutorEventResponse (tipo app-facing) —
// `r.data.content` batia undefined e o `.map` seguinte lançava TypeError.
export async function timeline(config: { url?: string }): Promise<PageRaw<TimelineEventoRaw>> {
  const match = config.url?.match(/\/pets\/(\d+)\/timeline/);
  const idPet = match ? parseInt(match[1] ?? '1', 10) : 1;
  const nmPet = PETS.find(p => p.id === idPet)?.nmPet ?? 'Pet';
  const content: TimelineEventoRaw[] = TIMELINE_ITEMS.map(item => ({ ...item, idPet, nmPet }));
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length };
}

// TASK-65: rota nova — antes /timeline/:idEvento (getEventDetail) não tinha
// handler dedicado; a regex antiga do adapter (`/\/tutor\/pets\/\d+\/timeline/`,
// sem `$`) "sequestrava" essa URL para o handler de lista, que devolvia um
// array em vez do objeto único que TimelineEventoRaw espera — mapTimelineEventoDetailDto
// lia campos de um array e devolvia `{}` silenciosamente (nenhum lançava, mas o
// evento aparecia vazio na tela). Ver mock-adapter.ts para a rota anchorada nova.
export async function timelineDetail(config: { url?: string }): Promise<TimelineEventoRaw> {
  const match = config.url?.match(/\/pets\/(\d+)\/timeline\/(\d+)$/);
  const idPet = match ? parseInt(match[1] ?? '1', 10) : 1;
  const idEvento = match ? parseInt(match[2] ?? '0', 10) : 0;
  const nmPet = PETS.find(p => p.id === idPet)?.nmPet ?? 'Pet';
  const item = TIMELINE_ITEMS.find(i => i.idEvento === idEvento);
  if (!item) throw { response: { status: 404 } };
  return { ...item, idPet, nmPet };
}
