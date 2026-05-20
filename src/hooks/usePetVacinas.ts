import { useQuery } from '@tanstack/react-query';
import { getVacinas, getVacinaStatus } from '../services/vacinas.service';

export function usePetVacinas(id: number) {
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
  return { list, status };
}
