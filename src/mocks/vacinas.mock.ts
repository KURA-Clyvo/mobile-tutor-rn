import type { VacinaVencendoRaw, VacinaStatusRaw } from '../types/api';

// TASK-65 (FIX_5): list()/status() devolviam VacinaTutorResponse[]/VacinaStatusResponse
// (tipos app-facing) onde getVacinas()/getVacinaStatus() esperam o shape RAW de
// VW_VACINAS_VENCENDO (VacinaVencendoRaw/VacinaStatusRaw) — mesma classe de bug do
// B0.1. Não lançava (mapVacinaDto/mapVacinaStatusDto só leem campos ausentes como
// undefined), mas corrompia silenciosamente os dados: `raw.idPet` undefined
// quebrava o hash de id, `raw.dtProximaDose` ausente na Antirrábica virava vacina
// sem data nenhuma, e todo item saía com sgStatus 'VENCENDO' fixo (mapVacinaDto
// sempre grava esse valor — condizente com VW_VACINAS_VENCENDO só listar
// pendências futuras, mas exige que o raw tenha os campos certos para o resto do
// mapeamento funcionar).
function extractIdPet(url?: string): number {
  const match = url?.match(/\/pets\/(\d+)\/vacinas/);
  return match ? parseInt(match[1] ?? '1', 10) : 1;
}

export async function list(config: { url?: string }): Promise<VacinaVencendoRaw[]> {
  const idPet = extractIdPet(config.url);
  const nmClinica = 'Clínica KURA';
  return [
    { idPet, nmVacina: 'Gripe Canina', dtProximaDose: new Date(Date.now() + 20 * 86400_000).toISOString(), idClinica: 1, nmClinica },
    { idPet, nmVacina: 'V10',          dtProximaDose: new Date(Date.now() + 335 * 86400_000).toISOString(), idClinica: 1, nmClinica },
  ];
}

export async function status(config: { url?: string }): Promise<VacinaStatusRaw> {
  const idPet = extractIdPet(config.url);
  return { idPet, qtdPendentes: 2, dtProximaDose: new Date(Date.now() + 20 * 86400_000).toISOString(), dsStatusGeral: 'ALERTA' };
}
