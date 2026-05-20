import { useQuery } from '@tanstack/react-query';
import { getTimeline, getEventDetail } from '../services/timeline.service';

export function usePetTimeline(idPet: number) {
  return useQuery({
    queryKey: ['pets', idPet, 'timeline'],
    queryFn: () => getTimeline(idPet),
    staleTime: 30_000,
    enabled: idPet > 0,
  });
}

export function usePetTimelineEvent(idPet: number, idEvento: number) {
  return useQuery({
    queryKey: ['pets', idPet, 'timeline', idEvento],
    queryFn: () => getEventDetail(idPet, idEvento),
    staleTime: 60_000,
    enabled: idPet > 0 && idEvento > 0,
  });
}
