import { mapListaPets } from '../services/pets.service';
import { mapListaAgendamentos } from '../services/agendamentos.service';

// Corpos medidos contra a API Java real: páginas do Spring, não arrays.
// G2 FT-09 (I-1): `size` faltava aqui e só não quebrava o tsc porque o
// chamador de pets usava `as never` — sem o cast, o próprio type-check
// aponta o campo do contrato de página que faltava neste helper.
const pagina = <T,>(content: T[]) => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: content.length || 1 });

describe('listas paginadas da API Java', () => {
  // G2 FT-09 (I-1): este é o ÚNICO ramo que roda em modo real (o Java
  // devolve `Page<PetResponse>` -> `{content:[...]}`) — sem este teste, a
  // linha que apaga `dsFotoThumbUrl` no ramo PageRaw sobrevive com suite e
  // tsc verdes (fixture antiga não tinha o campo e usava `as never`, que
  // escondia a divergência de contrato do próprio tsc). Fixture tipada de
  // verdade agora — sem `as never` — com um pet com thumb literal e outro
  // sem foto (`null`).
  it('pets: desembrulha content, traduz idPet → id e propaga a foto (thumb) por pet', () => {
    const [thor, mel] = mapListaPets(pagina([
      { idPet: 103, nmPet: 'Thor', nmEspecie: 'Cao', nmRaca: 'Labrador', sgSexo: 'M' as const, dtNascimento: '2021-05-10', sgPorte: 'G' as const, dsFotoThumbUrl: 'https://cdn.kura.test/fotos/thor_256.webp' },
      { idPet: 104, nmPet: 'Mel', nmEspecie: 'Gato', nmRaca: 'SRD', sgSexo: 'F' as const, dtNascimento: '2020-01-01', sgPorte: 'P' as const, dsFotoThumbUrl: null },
    ]));
    expect(thor).toBeDefined();
    expect(thor?.id).toBe(103);
    expect(thor?.nmPet).toBe('Thor');
    expect(thor?.chips).toEqual([]);
    expect(thor?.dsFotoThumbUrl).toBe('https://cdn.kura.test/fotos/thor_256.webp');
    expect(mel?.dsFotoThumbUrl).toBeNull();
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
