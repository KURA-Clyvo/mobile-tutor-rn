import type { PetTutorResponse, PetTutorDetailResponse, TimelineTutorEventResponse } from '../types/api';

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

export async function byId(config: { url?: string }): Promise<PetTutorDetailResponse> {
  const match = config.url?.match(/\/pets\/(\d+)$/);
  const id = match ? parseInt(match[1] ?? '1', 10) : 1;
  const found = PETS.find(p => p.id === id);
  if (!found) throw { response: { status: 404 } };
  return { ...found, nrPesoKg: 28.5, nrTemperaturaC: 38.6, nrFreqCardiacaBpm: 92 };
}

export async function timeline(): Promise<TimelineTutorEventResponse[]> {
  return [
    { idEventoClinico: 201, nmTipo: 'CONSULTA', dtEvento: new Date(Date.now() - 6 * 86400_000).toISOString(), nmVeterinario: 'Dra. Ana Ferreira', nrCRMV: 'SP-12345', nmClinica: 'Clínica KURA Pinheiros', sgTipoAtendimento: 'pres', dsResumoPublico: 'Consulta de rotina. Animal saudável, peso estável.' },
    { idEventoClinico: 202, nmTipo: 'VACINA', dtEvento: new Date(Date.now() - 30 * 86400_000).toISOString(), nmVeterinario: 'Dr. José Neto', nrCRMV: 'SP-67890', nmClinica: 'Clínica KURA Pinheiros', sgTipoAtendimento: 'pres', dsResumoPublico: 'V10 aplicada — lote KR2026-01. Próxima dose em 12 meses.' },
    { idEventoClinico: 203, nmTipo: 'TELEORIENTACAO', dtEvento: new Date(Date.now() - 3 * 86400_000).toISOString(), nmVeterinario: 'Dra. Ana Ferreira', nrCRMV: 'SP-12345', nmClinica: 'Clínica KURA Pinheiros', sgTipoAtendimento: 'tele', dsResumoPublico: 'Orientação sobre alimentação pós-cirúrgica e cuidados em casa.' },
    { idEventoClinico: 204, nmTipo: 'PRESCRICAO', dtEvento: new Date(Date.now() - 10 * 86400_000).toISOString(), nmVeterinario: 'Dra. Ana Ferreira', nrCRMV: 'SP-12345', nmClinica: 'Clínica KURA Pinheiros', sgTipoAtendimento: 'pres', dsResumoPublico: 'Amoxicilina 250mg 2x/dia por 7 dias.' },
    { idEventoClinico: 205, nmTipo: 'EXAME', dtEvento: new Date(Date.now() - 15 * 86400_000).toISOString(), nmClinica: 'Clínica KURA Pinheiros', dsResumoPublico: 'Hemograma completo — resultado dentro dos parâmetros normais.' },
  ];
}
