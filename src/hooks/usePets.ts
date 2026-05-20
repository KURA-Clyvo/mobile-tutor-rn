import { useQuery } from '@tanstack/react-query';
import { listPets } from '../services/pets.service';
import { mapPetDto } from '../utils/mappers';

const STATUS_ORDER = { URGENTE: 0, ALERTA: 1, OK: 2 } as const;

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const data = await listPets();
      return data
        .map(mapPetDto)
        .sort((a, b) => STATUS_ORDER[a.statusGeral] - STATUS_ORDER[b.statusGeral]);
    },
    staleTime: 60_000,
  });
}
