import { useQuery } from '@tanstack/react-query';
import { getPetById } from '../services/pets.service';

export function usePetDetail(id: number) {
  return useQuery({
    queryKey: ['pets', id],
    queryFn: () => getPetById(id),
    staleTime: 30_000,
    enabled: !!id && id > 0 && !isNaN(id),
  });
}
