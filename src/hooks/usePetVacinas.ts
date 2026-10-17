import { useQuery } from '@tanstack/react-query';
import { getVacinas } from '../services/vacinas.service';

/**
 * Lista de vacinas do pet (aba Vacinas). BR-TUT-T06: a query do resumo `/vacinas/status` saiu - nada na tela a usava e a falha
 * dela derrubava a aba inteira. Mesma chave da Saude (`['pets', id, 'vacinas']`): as duas telas dividem o cache.
 */
export function usePetVacinas(id: number) {
  return useQuery({
    queryKey: ['pets', id, 'vacinas'],
    queryFn: () => getVacinas(id),
    staleTime: 60_000,
    enabled: id > 0,
  });
}
