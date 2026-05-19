import type { NotificacaoTutorResponse } from '../types/api';
export async function list(): Promise<NotificacaoTutorResponse[]> {
  return [
    { id: 1, dsTipo: 'RETORNO_PENDENTE', dsTitulo: 'Retorno do Bóbi', dsMensagem: 'Bóbi tem retorno marcado em 2 dias. Não esqueça!', dtEnvio: new Date(Date.now() - 3600_000).toISOString(), flLida: false, idPet: 1, nmPet: 'Bóbi' },
    { id: 2, dsTipo: 'VACINA_VENCENDO', dsTitulo: 'Vacina vencendo', dsMensagem: 'A Gripe Canina do Bóbi vence em 20 dias. Agende já!', dtEnvio: new Date(Date.now() - 7200_000).toISOString(), flLida: false, idPet: 1, nmPet: 'Bóbi' },
    { id: 3, dsTipo: 'AGENDAMENTO_CONFIRMADO', dsTitulo: 'Agendamento confirmado', dsMensagem: 'Check-up da Luna confirmado para daqui 7 dias.', dtEnvio: new Date(Date.now() - 86400_000).toISOString(), flLida: true, idPet: 2, nmPet: 'Luna', idAgendamento: 2 },
  ];
}
