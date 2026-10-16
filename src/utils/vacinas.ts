import { formatDateBR } from './date';

// BR-TUT-T06: UMA fonte para classificar vacina. Saúde e aba Vacinas do pet chamam estas funções — nenhuma tela
// decide "vencida / vencendo / em dia" por conta própria.
// ÂNCORA (regra 11): a janela de 30 dias espelha a view do Java — backend-tutor-java
// `db/migration/V1__initial_schema.sql:351` ("Vacinas agendadas nos próximos 30 dias") e
// `timeline/api/dto/VacinaStatusResponse.java:13` ("EM_DIA se nenhuma pendência nos próximos 30 dias"). Conferido em 2026-10-16:
//   grep -n "30 dias" backend-tutor-java/src/main/resources/db/migration/V1__initial_schema.sql
export const JANELA_VENCENDO_DIAS = 30;

export type EstadoVacina = 'VENCIDA' | 'VENCENDO' | 'EM_DIA';
type VacinaData = { dtProximaDose?: string; dtAplicacao: string };

const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const proxima = (v: VacinaData) => v.dtProximaDose ?? v.dtAplicacao;

/** Dias de calendário até a próxima dose (negativo = já venceu). */
export function diasAteVacina(v: VacinaData, now: Date = new Date()): number {
  return Math.round((dia(new Date(proxima(v))) - dia(now)) / 86_400_000);
}

export function classificarVacina(v: VacinaData, now: Date = new Date()): EstadoVacina {
  const d = diasAteVacina(v, now);
  return d < 0 ? 'VENCIDA' : d <= JANELA_VENCENDO_DIAS ? 'VENCENDO' : 'EM_DIA';
}

const plural = (n: number) => `${n} dia${n === 1 ? '' : 's'}`;

/** "quando", sempre da mesma conta de `classificarVacina`. */
export function quandoVacina(v: VacinaData, now: Date = new Date()): string {
  const d = diasAteVacina(v, now);
  if (classificarVacina(v, now) === 'EM_DIA') return `em dia · próxima ${formatDateBR(proxima(v))}`;
  if (d < 0) return `venceu há ${plural(-d)}`;
  return d === 0 ? 'vence hoje' : `vence em ${plural(d)}`;
}

/** Pior estado de uma lista (vencida > vencendo > em dia). */
export function piorEstado(estados: EstadoVacina[]): EstadoVacina {
  return estados.includes('VENCIDA') ? 'VENCIDA' : estados.includes('VENCENDO') ? 'VENCENDO' : 'EM_DIA';
}

type ComPet = { petNome: string; vacina: VacinaData };

/** Voz do DS: "Thor tem uma vacina vencendo em 12 dias." / "2 vacinas pedem atenção." */
export function fraseSaude(atencao: ComPet[], now: Date = new Date()): string {
  const [unica] = atencao;
  if (atencao.length === 0 || !unica) return 'Nenhuma vacina pedindo atenção.';
  if (atencao.length > 1) return `${atencao.length} vacinas pedem atenção.`;
  const d = diasAteVacina(unica.vacina, now);
  const quando = d < 0 ? `vencida há ${plural(-d)}` : d === 0 ? 'vencendo hoje' : `vencendo em ${plural(d)}`;
  return `${unica.petNome} tem uma vacina ${quando}.`;
}
