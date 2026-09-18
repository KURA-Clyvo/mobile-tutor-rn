import { mapListaPets } from '../services/pets.service';
import { mapListaAgendamentos } from '../services/agendamentos.service';

// Corpos medidos contra a API Java real: páginas do Spring, não arrays.
const pagina = <T,>(content: T[]) => ({ content, totalElements: content.length, totalPages: 1, number: 0 });

describe('listas paginadas da API Java', () => {
  it('pets: desembrulha content e traduz idPet → id', () => {
    const [pet] = mapListaPets(pagina([
      { idPet: 103, nmPet: 'Thor', nmEspecie: 'Cao', nmRaca: 'Labrador', sgSexo: 'M' as const, dtNascimento: '2021-05-10', sgPorte: 'G' as const },
    ]) as never);
    expect(pet).toBeDefined();
    expect(pet?.id).toBe(103);
    expect(pet?.nmPet).toBe('Thor');
    expect(pet?.chips).toEqual([]);
  });

  it('agendamentos: desembrulha content e traduz status/tipo Java', () => {
    const [ag] = mapListaAgendamentos(pagina([{
      idAgendamento: 5, idPet: 103, nmPet: 'Thor', nmEspecie: 'Cao', nmRaca: 'Labrador',
      nmClinica: 'Clínica Demo', dtAgendamento: '2026-09-20T10:00:00', nrDuracaoMinutos: 30,
      tipo: 'VACINA', status: 'INTENCAO', observacoes: null, dsSalaUrl: null,
    }]) as never);
    expect(ag).toMatchObject({ id: 5, sgStatus: 'SOLICITADO', sgTipoConsulta: 'ROTINA', dsMotivo: '' });
    expect(ag?.pet.id).toBe(103);
  });

  it('array (mock-adapter) passa direto', () => {
    expect(mapListaPets([])).toEqual([]);
    expect(mapListaAgendamentos([])).toEqual([]);
  });
});
