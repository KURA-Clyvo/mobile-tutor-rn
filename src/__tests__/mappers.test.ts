import { mapPetDto, mapAgendamentoDto, mapPetListaDto } from '../utils/mappers';
import type { PetTutorResponse, AgendamentoRaw, PetListaRaw } from '../types/api';

const dto: PetTutorResponse = {
  id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador', dtNascimento: '2021-03-10',
  sgSexo: 'M', sgPorte: 'G', nmClinica: 'Clínica KURA', dsStatusGeral: 'URGENTE',
  nrAlertasAtivos: 1, nrConsultas: 5,
  chips: [{ tone: 'clay', label: '⚠ Retorno 2d' }, { tone: 'sage', label: 'Vacinado' }],
};

describe('mapPetDto', () => {
  it('maps all fields', () => {
    const pet = mapPetDto(dto);
    expect(pet.nome).toBe('Bóbi');
    expect(pet.statusGeral).toBe('URGENTE');
    expect(pet.chips).toHaveLength(2);
    expect(pet.nascimento).toBeInstanceOf(Date);
    expect(typeof pet.idadeAnos).toBe('number');
  });
});

// ─── T-2 — mappers das listas paginadas ──────────────────────────────────────
// O JSON abaixo é o `AgendamentoResponse`/`PetResponse` de
// `backend-tutor-java @ 3290687`, campo a campo (transcrição conferida com a trilha
// Java em 08/09). Os `record` são serializados pelo Jackson com o nome do
// componente, então estes são os nomes que chegam no aparelho.
const AGENDAMENTO_JAVA: AgendamentoRaw = {
  idAgendamento: 1, idTutor: 1, idPet: 7, nmPet: 'Bóbi',
  idClinica: 1, idVeterinario: null,
  dtAgendamento: '2026-09-20T10:30:00', nrDuracaoMinutos: 30,
  tipo: 'CONSULTA', status: 'AGENDADO', origem: 'APP',
  observacoes: 'Check-up anual',
  dtCriacao: '2026-09-01T09:00:00', dtConfirmacao: null, dtCancelamento: null,
  nrVersion: 0, dsSalaUrl: null,
};

describe('mapAgendamentoDto', () => {
  it('renomeia os campos que o app consome', () => {
    const a = mapAgendamentoDto(AGENDAMENTO_JAVA);
    expect(a.id).toBe(1);
    expect(a.dtInicio).toBe('2026-09-20T10:30:00');
    expect(a.nrDuracaoMinutos).toBe(30);
    expect(a.dsMotivo).toBe('Check-up anual');
    expect(a.pet).toEqual({ id: 7, nmPet: 'Bóbi' });
    expect(a.nrVersion).toBe(0);
  });

  it('traduz os status que o app não conhece', () => {
    const de = (status: string) => mapAgendamentoDto({ ...AGENDAMENTO_JAVA, status }).sgStatus;
    expect(de('INTENCAO')).toBe('SOLICITADO');
    expect(de('AGENDADO')).toBe('AGENDADO');
    expect(de('CONFIRMADO')).toBe('CONFIRMADO');
    expect(de('REALIZADO')).toBe('CONCLUIDO');
    expect(de('CANCELADO')).toBe('CANCELADO');
    expect(de('NAO_COMPARECEU')).toBe('CONCLUIDO');
  });

  it('status nulo ou desconhecido não vaza para a UI', () => {
    // `fromEntity` guarda contra `stStatus` nulo, então `null` é possível no JSON.
    expect(mapAgendamentoDto({ ...AGENDAMENTO_JAVA, status: null }).sgStatus).toBe('SOLICITADO');
    expect(mapAgendamentoDto({ ...AGENDAMENTO_JAVA, status: 'VALOR_NOVO' }).sgStatus).toBe('SOLICITADO');
  });

  it('traduz o tipo, inclusive os que a UI do tutor não oferece', () => {
    const de = (tipo: string) => mapAgendamentoDto({ ...AGENDAMENTO_JAVA, tipo }).sgTipoConsulta;
    expect(de('CONSULTA')).toBe('ROTINA');
    expect(de('RETORNO')).toBe('RETORNO');
    expect(de('TELEORIENTACAO')).toBe('TELEORIENTACAO');
    expect(de('VACINA')).toBe('ROTINA');
    expect(de('EXAME')).toBe('ROTINA');
    expect(de('PROCEDIMENTO')).toBe('ROTINA');
  });

  it('campo ausente fica AUSENTE — nunca string vazia nem placeholder', () => {
    const a = mapAgendamentoDto(AGENDAMENTO_JAVA);
    expect(a.nmClinica).toBeUndefined();
    expect(a.pet.nmEspecie).toBeUndefined();
    expect(a.pet.nmRaca).toBeUndefined();
    expect(a.dsSalaUrl).toBeUndefined();
    // `nmVeterinario` ficou fora da SJ3-10 de propósito e nenhuma tela o renderiza.
    expect(a.nmVeterinario).toBeUndefined();
  });

  it('lê os 3 campos que a SJ3-10 acrescenta, no nível raiz', () => {
    const a = mapAgendamentoDto({
      ...AGENDAMENTO_JAVA, nmEspecie: 'Cão', nmRaca: 'Labrador', nmClinica: 'Clínica KURA Pinheiros',
    });
    expect(a.pet.nmEspecie).toBe('Cão');
    expect(a.pet.nmRaca).toBe('Labrador');
    expect(a.nmClinica).toBe('Clínica KURA Pinheiros');
  });
});

describe('mapPetListaDto', () => {
  const PET_JAVA: PetListaRaw = {
    idPet: 3, nmPet: 'Thor', nmEspecie: 'Cão', nmRaca: 'SRD',
    sgSexo: 'M', dtNascimento: '2023-01-15', sgPorte: 'M',
  };

  it('renomeia idPet para id e preserva os 7 campos que existem', () => {
    const p = mapPetListaDto(PET_JAVA);
    expect(p.id).toBe(3);
    expect(p.nmPet).toBe('Thor');
    expect(p.nmEspecie).toBe('Cão');
    expect(p.nmRaca).toBe('SRD');
    expect(p.sgSexo).toBe('M');
    expect(p.sgPorte).toBe('M');
    expect(p.dtNascimento).toBe('2023-01-15');
  });

  it('não inventa status, alertas nem chips — o Java não tem esses dados', () => {
    const p = mapPetListaDto(PET_JAVA);
    expect(p.dsStatusGeral).toBeUndefined();
    expect(p.nrAlertasAtivos).toBeUndefined();
    expect(p.chips).toBeUndefined();
    expect(p.nmClinica).toBeUndefined();
    expect(p.nrConsultas).toBeUndefined();
  });
});
