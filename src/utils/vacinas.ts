import { formatDateBR, parseData } from './date';

// BR-TUT-T06: UMA fonte para classificar vacina. Saúde e aba Vacinas do pet chamam estas funções — nenhuma tela
// decide "vencida / vencendo / em dia" por conta própria.
// ÂNCORA (regra 11): a janela de 30 dias espelha a view VIVA do Java — backend-tutor-java `main@d1522ee`,
// `db/migration-oracle/V21__vacinas_v2_notificacao_triagem_luna.sql:146-147` (VW_VACINAS_VENCENDO: `TRUNC(DT_PROXIMA_DOSE)` entre
// hoje e hoje + 30, dia de calendário em America/Sao_Paulo; a linha 145 exclui `DT_PROXIMA_DOSE` nula). A view só devolve doses
// de hoje a +30 dias: dose já vencida NÃO chega ao app. Conferido em 2026-10-16 com
//   sed -n '145,147p' backend-tutor-java/src/main/resources/db/migration-oracle/V21__vacinas_v2_notificacao_triagem_luna.sql
// e `timeline/api/dto/VacinaStatusResponse.java:13` ("EM_DIA se nenhuma pendência nos próximos 30 dias").
export const JANELA_VENCENDO_DIAS = 30;

/** SEM_DATA: data ausente ou ilegível — nunca vira "em dia" (ausência de dado não é afirmação positiva). */
export type EstadoVacina = 'VENCIDA' | 'VENCENDO' | 'EM_DIA' | 'SEM_DATA';
type VacinaData = { dtProximaDose?: string; dtAplicacao: string };

const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const proxima = (v: VacinaData) => v.dtProximaDose || v.dtAplicacao;

/** Dias de calendário até a próxima dose (negativo = já venceu); NaN se a data falta ou não é legível. */
export function diasAteVacina(v: VacinaData, now: Date = new Date()): number {
  return Math.round((dia(parseData(proxima(v))) - dia(now)) / 86_400_000);
}

export function classificarVacina(v: VacinaData, now: Date = new Date()): EstadoVacina {
  const d = diasAteVacina(v, now);
  if (!Number.isFinite(d)) return 'SEM_DATA';
  return d < 0 ? 'VENCIDA' : d <= JANELA_VENCENDO_DIAS ? 'VENCENDO' : 'EM_DIA';
}

const plural = (n: number) => `${n} dia${n === 1 ? '' : 's'}`;

/** "quando", sempre da mesma conta de `classificarVacina`. */
export function quandoVacina(v: VacinaData, now: Date = new Date()): string {
  const d = diasAteVacina(v, now);
  if (classificarVacina(v, now) === 'SEM_DATA') return 'sem data prevista';
  if (classificarVacina(v, now) === 'EM_DIA') return `em dia · próxima ${formatDateBR(proxima(v))}`;
  if (d < 0) return `venceu há ${plural(-d)}`;
  return d === 0 ? 'vence hoje' : `vence em ${plural(d)}`;
}

/** Pior estado de uma lista (vencida > vencendo > sem data > em dia). */
export function piorEstado(estados: EstadoVacina[]): EstadoVacina {
  return (['VENCIDA', 'VENCENDO', 'SEM_DATA'] as const).find(e => estados.includes(e)) ?? 'EM_DIA';
}

/** O que o servidor sustenta sobre uma lista sem pendência: a view só olha os próximos 30 dias. */
export const FRASE_NADA_VENCE = `Nenhuma vacina vence nos próximos ${JANELA_VENCENDO_DIAS} dias.`;

type ComPet = { petNome: string; vacina: VacinaData };

/** Voz do DS: "Thor tem uma vacina vencendo em 12 dias." / "2 vacinas pedem atenção." */
export function fraseSaude(atencao: ComPet[], now: Date = new Date()): string {
  const [unica] = atencao;
  if (atencao.length === 0 || !unica) return FRASE_NADA_VENCE;
  if (atencao.length > 1) return `${atencao.length} vacinas pedem atenção.`;
  const d = diasAteVacina(unica.vacina, now);
  const quando = d < 0 ? `vencida há ${plural(-d)}` : d === 0 ? 'vencendo hoje' : `vencendo em ${plural(d)}`;
  return `${unica.petNome} tem uma vacina ${quando}.`;
}
