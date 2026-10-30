import type { AgendamentoTutorResponse } from '../types/api';

// S4-MOB-03: regra da notificação local "a clínica mudou o seu agendamento". Pura, sem I/O: recebe o
// último status visto de cada agendamento (persistido) e a lista que acabou de chegar da API.
export type Status = AgendamentoTutorResponse['sgStatus'];
export type Snapshot = Record<string, Status>;

export interface Aviso { idAgendamento: number; titulo: string; corpo: string }

// Só transições que o tutor quer saber. Agendamento NOVO não avisa (foi o próprio tutor que pediu).
const TEXTO: Partial<Record<Status, (a: AgendamentoTutorResponse) => { titulo: string; corpo: string }>> = {
  AGENDADO:   a => ({ titulo: 'Horário marcado pela clínica', corpo: `${a.pet.nmPet}: ${quando(a)} em ${a.nmClinica}.` }),
  CONFIRMADO: a => ({ titulo: 'Consulta confirmada', corpo: `${a.pet.nmPet}: ${quando(a)} em ${a.nmClinica}.` }),
  CANCELADO:  a => ({ titulo: 'Consulta cancelada pela clínica', corpo: `${a.pet.nmPet}: o horário de ${quando(a)} foi cancelado.` }),
  CONCLUIDO:  a => ({ titulo: 'Atendimento concluído', corpo: `${a.pet.nmPet} foi atendido em ${a.nmClinica}.` }),
};

function quando(a: AgendamentoTutorResponse): string {
  const d = new Date(a.dtInicio);
  if (Number.isNaN(d.getTime())) return 'horário a confirmar';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function snapshotDe(lista: AgendamentoTutorResponse[]): Snapshot {
  return Object.fromEntries(lista.map(a => [String(a.id), a.sgStatus]));
}

// `anterior === null` = primeira leitura deste aparelho: só grava, não avisa (senão o primeiro login
// despejaria uma notificação por agendamento antigo).
export function detectarMudancas(anterior: Snapshot | null, atual: AgendamentoTutorResponse[]): Aviso[] {
  if (!anterior) return [];
  return atual.flatMap(a => {
    const antes = anterior[String(a.id)];
    if (!antes || antes === a.sgStatus) return [];
    const texto = TEXTO[a.sgStatus];
    return texto ? [{ idAgendamento: a.id, ...texto(a) }] : [];
  });
}
