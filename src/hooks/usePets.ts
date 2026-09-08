import { useQuery } from '@tanstack/react-query';
import { listPets } from '../services/pets.service';
import { mapPetDto } from '../utils/mappers';

const STATUS_ORDER = { URGENTE: 0, ALERTA: 1, OK: 2 } as const;

// T-2: pet sem status apurado vai para o fim da lista, não para o meio: o topo é
// reservado a quem tem urgência CONHECIDA. Ordenar um desconhecido como se fosse
// 'OK' seria decidir por ele.
const SEM_STATUS = 3;
const ordemDe = (p: { statusGeral?: keyof typeof STATUS_ORDER }) =>
  p.statusGeral ? STATUS_ORDER[p.statusGeral] : SEM_STATUS;

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const data = await listPets();
      return data
        .map(mapPetDto)
        .sort((a, b) => ordemDe(a) - ordemDe(b));
    },
    staleTime: 60_000,
  });
}
