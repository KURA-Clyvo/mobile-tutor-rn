import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 5 * 60_000, retry: 2, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'KURA_TUTOR_QUERY_CACHE',
  throttleTime: 1000,
});

// BR-TUT-G4 I-3: o padrão do TanStack só persiste query com status 'success'. Um refetch que falha (2 tentativas)
// põe a query em 'error' MANTENDO o último dado; sem isto o cache salvo some e o app reaberto offline cai no erro
// cheio em vez de "dado salvo + faixa". Persiste também a query em erro QUE TEM dado; nunca a sem dado.
export const dehydrateOptions = {
  shouldDehydrateQuery: (q: { state: { status: string; data: unknown } }) =>
    q.state.status === 'success' || (q.state.status === 'error' && q.state.data !== undefined),
};
