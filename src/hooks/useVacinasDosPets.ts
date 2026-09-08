import { useQueries } from '@tanstack/react-query';
import { getVacinas } from '../services/vacinas.service';
import type { VacinaTutorResponse } from '../types/api';

/** Uma linha por pet, na MESMA ordem recebida — a tela não precisa cruzar índices. */
export interface VacinasDoPet<P> {
  pet: P;
  vacinas: VacinaTutorResponse[];
}

/**
 * T-3 — as vacinas de vários pets de uma vez (uma query por pet).
 *
 * Existe porque este `useQueries` morava dentro de `(tabs)/saude/index.tsx`, com
 * `queryKey`/`queryFn` escritos na tela: era o único dos 8 hooks de dados do app
 * fora de `src/hooks/`, e o critério da disciplina pede que hooks de TanStack Query
 * fiquem isolados da camada de UI. A tela também deixa de importar
 * `vacinas.service` — quem fala com a camada de dados é o hook.
 *
 * `queryKey` idêntica à de `usePetVacinas` (`['pets', id, 'vacinas']`) de propósito:
 * as duas telas leem o MESMO recurso, então compartilham cache e uma invalidação
 * atinge as duas. Divergir a chave aqui criaria duas cópias do mesmo dado.
 *
 * Genérico em `P` para não amarrar o hook ao tipo de domínio da tela de saúde —
 * qualquer coisa com `id` numérico serve, e o chamador recebe seu próprio tipo de
 * volta, sem cast.
 */
export function useVacinasDosPets<P extends { id: number }>(pets: P[]) {
  const resultados = useQueries({
    queries: pets.map(pet => ({
      queryKey: ['pets', pet.id, 'vacinas'],
      queryFn:  () => getVacinas(pet.id),
      staleTime: 60_000,
      enabled:  pet.id > 0,
    })),
  });

  const vacinas: VacinasDoPet<P>[] = pets.map((pet, i) => ({
    pet,
    vacinas: resultados[i]?.data ?? [],
  }));

  return {
    vacinas,
    isLoading: resultados.some(r => r.isLoading),
    // Sem `useCallback`: `resultados` é array novo a cada render, então a
    // memoização não seguraria identidade nenhuma — daria só a ilusão de estabilidade.
    refetch: () => { resultados.forEach(r => { void r.refetch(); }); },
  };
}
