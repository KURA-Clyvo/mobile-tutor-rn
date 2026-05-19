import type { VacinaTutorResponse, VacinaStatusResponse } from '../types/api';
export async function list(): Promise<VacinaTutorResponse[]> {
  return [
    { id: 1, nmVacina: 'V10', dtAplicacao: new Date(Date.now() - 30 * 86400_000).toISOString(), nmClinica: 'Clínica KURA', nmVeterinario: 'Dr. José Neto', nrLote: 'KR2026-01', dtProximaDose: new Date(Date.now() + 335 * 86400_000).toISOString(), sgStatus: 'EM_DIA' },
    { id: 2, nmVacina: 'Antirrábica', dtAplicacao: new Date(Date.now() - 370 * 86400_000).toISOString(), nmClinica: 'Clínica KURA', sgStatus: 'VENCIDA' },
    { id: 3, nmVacina: 'Gripe Canina', dtAplicacao: new Date(Date.now() - 340 * 86400_000).toISOString(), nmClinica: 'Clínica KURA', dtProximaDose: new Date(Date.now() + 20 * 86400_000).toISOString(), sgStatus: 'VENCENDO' },
    { id: 4, nmVacina: 'Giardia', dtAplicacao: new Date(Date.now() - 60 * 86400_000).toISOString(), nmClinica: 'Clínica KURA', sgStatus: 'EM_DIA' },
  ];
}
export async function status(): Promise<VacinaStatusResponse> {
  return { nrAplicadas: 4, nrTotal: 6, dsStatusGeral: 'ALERTA', dtUltimaAplicacao: new Date(Date.now() - 30 * 86400_000).toISOString(), nmUltimaVacina: 'V10' };
}
