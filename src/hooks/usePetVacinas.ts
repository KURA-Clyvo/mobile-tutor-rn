import { useQuery } from '@tanstack/react-query';
import { getVacinas, getVacinaStatus } from '../services/vacinas.service';
import type { QueryLike } from '@components/feedback/QueryState';
import type { VacinaTutorResponse, VacinaStatusResponse } from '../types/api';

export type DadosVacinasPet = { vacinas: VacinaTutorResponse[]; status: VacinaStatusResponse };

/**
 * BR-TUT-T04: a aba Vacinas precisa da lista E do resumo (faixa "N/M"). Os dois viram UM `QueryLike`: `data` só existe quando
 * os dois responderam, então a falha de um nunca vira "sem registro de vacinas" nem faixa "em dia" inventada. Mesmo desenho da
 * Saúde (agregado entregue ao `QueryState`).
 */
export function usePetVacinas(id: number): QueryLike<DadosVacinasPet> {
  const list = useQuery({
    queryKey: ['pets', id, 'vacinas'],
    queryFn: () => getVacinas(id),
    staleTime: 60_000,
    enabled: id > 0,
  });
  const status = useQuery({
    queryKey: ['pets', id, 'vacinaStatus'],
    queryFn: () => getVacinaStatus(id),
    staleTime: 60_000,
    enabled: id > 0,
  });
  const fetchStatus = [list.fetchStatus, status.fetchStatus];
  return {
    data: list.data !== undefined && status.data !== undefined ? { vacinas: list.data, status: status.data } : undefined,
    isLoading: list.isLoading || status.isLoading,
    isError: list.isError || status.isError,
    refetch: () => Promise.all([list.refetch(), status.refetch()]),
    fetchStatus: fetchStatus.includes('paused') ? 'paused' : fetchStatus.includes('fetching') ? 'fetching' : 'idle',
    dataUpdatedAt: Math.min(list.dataUpdatedAt, status.dataUpdatedAt) || undefined,
  };
}
