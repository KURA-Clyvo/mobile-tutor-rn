// T-3 — o hook que substituiu o `useQueries` escrito dentro de `(tabs)/saude/index.tsx`.
//
// Por que este arquivo existe além do `SaudeScreen.test.tsx`: aquele teste mocka
// `useQueries` devolvendo `data: []` para os dois pets, então o pareamento
// pet ↔ vacina nunca é exercido — trocar os índices passaria verde. O risco é real:
// a versão anterior cruzava `pets[idx]` com `vacinasResults[idx]` na mão, na tela.
import { renderHook } from '@testing-library/react-native';
// `jest.mock` é içado acima dos imports pelo babel-jest, então importar `useQueries`
// aqui em cima já recebe o mock — não precisa (nem deve) importar no meio do arquivo.
import { useQueries } from '@tanstack/react-query';
import { useVacinasDosPets } from '../hooks/useVacinasDosPets';

const refetch1 = jest.fn();
const refetch2 = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQueries: jest.fn(),
}));
jest.mock('../services/vacinas.service', () => ({ getVacinas: jest.fn() }));

const useQueriesMock = useQueries as unknown as jest.Mock;

const PETS = [{ id: 1, nome: 'Bóbi' }, { id: 2, nome: 'Luna' }];
const V1 = { id: 10, nmVacina: 'V10', sgStatus: 'VENCENDO' };
const V2 = { id: 20, nmVacina: 'Antirrábica', sgStatus: 'EM_DIA' };

describe('useVacinasDosPets', () => {
  beforeEach(() => {
    refetch1.mockReset(); refetch2.mockReset();
    useQueriesMock.mockReset();
    useQueriesMock.mockReturnValue([
      { data: [V1], isLoading: false, refetch: refetch1 },
      { data: [V2], isLoading: false, refetch: refetch2 },
    ]);
  });

  it('devolve cada vacina no pet certo, na ordem recebida', () => {
    const { result } = renderHook(() => useVacinasDosPets(PETS));
    expect(result.current.vacinas).toEqual([
      { pet: PETS[0], vacinas: [V1] },
      { pet: PETS[1], vacinas: [V2] },
    ]);
  });

  it('monta uma query por pet, com a mesma queryKey de usePetVacinas', () => {
    renderHook(() => useVacinasDosPets(PETS));
    const { queries } = useQueriesMock.mock.calls[0]![0];
    expect(queries).toHaveLength(2);
    expect(queries[0].queryKey).toEqual(['pets', 1, 'vacinas']);
    expect(queries[1].queryKey).toEqual(['pets', 2, 'vacinas']);
  });

  it('pet sem dado ainda vira lista vazia, nunca undefined', () => {
    useQueriesMock.mockReturnValue([{ data: undefined, isLoading: true, refetch: refetch1 }]);
    const { result } = renderHook(() => useVacinasDosPets([PETS[0]!]));
    expect(result.current.vacinas[0]!.vacinas).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('refetch alcança todas as queries — é o pull-to-refresh da tela', () => {
    const { result } = renderHook(() => useVacinasDosPets(PETS));
    result.current.refetch();
    expect(refetch1).toHaveBeenCalledTimes(1);
    expect(refetch2).toHaveBeenCalledTimes(1);
  });

  it('sem pets, não monta query nenhuma', () => {
    useQueriesMock.mockReturnValue([]);
    const { result } = renderHook(() => useVacinasDosPets([]));
    expect(useQueriesMock.mock.calls[0]![0].queries).toEqual([]);
    expect(result.current.vacinas).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
