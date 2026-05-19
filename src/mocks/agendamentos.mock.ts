import type { AgendamentoTutorResponse } from '../types/api';
export async function list(): Promise<AgendamentoTutorResponse[]> {
  return [
    { id: 1, dtInicio: new Date(Date.now() + 2 * 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'SOLICITADO', sgTipoConsulta: 'RETORNO', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'Clínica KURA Pinheiros', dsMotivo: 'Retorno pós-consulta' },
    { id: 2, dtInicio: new Date(Date.now() + 7 * 86400_000).toISOString(), nrDuracaoMinutos: 60, sgStatus: 'CONFIRMADO', sgTipoConsulta: 'ROTINA', pet: { id: 2, nmPet: 'Luna', nmEspecie: 'Gato', nmRaca: 'Siamesa' }, nmClinica: 'Clínica KURA Pinheiros', dsMotivo: 'Check-up anual', nmVeterinario: 'Dra. Ana Ferreira' },
    { id: 3, dtInicio: new Date(Date.now() - 15 * 86400_000).toISOString(), nrDuracaoMinutos: 30, sgStatus: 'CONCLUIDO', sgTipoConsulta: 'ROTINA', pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' }, nmClinica: 'Clínica KURA Pinheiros', dsMotivo: 'Vacina V10' },
  ];
}
export async function criar(): Promise<{ id: number; sgStatus: 'SOLICITADO'; dtSolicitacao: string }> {
  return { id: Math.floor(Math.random() * 9000 + 1000), sgStatus: 'SOLICITADO', dtSolicitacao: new Date().toISOString() };
}
