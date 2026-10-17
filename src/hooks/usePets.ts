import { useQuery } from '@tanstack/react-query';
import { listPets } from '../services/pets.service';
import { mapPetDto } from '../utils/mappers';

const STATUS_ORDER = { URGENTE: 0, ALERTA: 1, OK: 2 } as const;
// status desconhecido (lista paginada do Java) vai depois dos conhecidos
const ordem = (s?: keyof typeof STATUS_ORDER) => (s ? STATUS_ORDER[s] : 3);

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const data = await listPets();
      return data
        .map(mapPetDto)
        .sort((a, b) => ordem(a.statusGeral) - ordem(b.statusGeral));
    },
    staleTime: 60_000,
  });
}
