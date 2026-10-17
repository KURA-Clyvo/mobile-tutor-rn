// BR-TUT-T07: dias e períodos que o pedido de horário oferece. Função pura (o relógio entra por parâmetro).
// O pedido é uma PREFERÊNCIA: o servidor recebe um instante âncora por período e a clínica marca o horário real.
// ÂNCORA (regra 11): `dtAgendamento` é `@NotNull @Future` no Java — `backend-tutor-java` `AgendamentoRequest.java:22`
// (commit d1522ee, conferida em 2026-10-16: `grep -n "@Future" $(find src/main -name AgendamentoRequest.java)`).
// Por isso um período só é oferecido se o instante âncora ainda está no futuro (a manhã de hoje às 10:00 daria 400).
// Fim de semana não é oferecido (aceite da T07); feriado e expediente da clínica o app não conhece e não inventa.

export type Periodo = 'MANHA' | 'TARDE';

export const PERIODOS: { key: Periodo; rotulo: string; hora: number }[] = [
  { key: 'MANHA', rotulo: 'Manhã', hora: 9 },
  { key: 'TARDE', rotulo: 'Tarde', hora: 14 },
];

export interface DiaOferecido { data: Date; periodos: Periodo[] }

export function instanteDoPeriodo(dia: Date, periodo: Periodo): Date {
  const d = new Date(dia);
  d.setHours(PERIODOS.find((p) => p.key === periodo)!.hora, 0, 0, 0);
  return d;
}

/** Próximos `max` dias úteis com pelo menos um período ainda no futuro, a partir de `agora`. */
export function diasOferecidos(agora: Date, max = 5): DiaOferecido[] {
  const out: DiaOferecido[] = [];
  for (let i = 0; i < 21 && out.length < max; i++) {
    const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i);
    const dow = data.getDay();
    if (dow === 0 || dow === 6) continue;
    const periodos = PERIODOS.filter((p) => instanteDoPeriodo(data, p.key).getTime() > agora.getTime()).map((p) => p.key);
    if (periodos.length) out.push({ data, periodos });
  }
  return out;
}
