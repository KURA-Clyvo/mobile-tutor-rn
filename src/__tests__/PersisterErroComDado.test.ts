// BR-TUT-G4 I-3: refetch falho 2x seguidas não pode apagar o cache salvo (dado salvo + faixa, não erro cheio).
import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
import { dehydrateOptions } from '../services/queryClient';
import fs from 'node:fs';
import path from 'node:path';

const novo = () => new QueryClient({ defaultOptions: { queries: { retry: 0, gcTime: Infinity } } });

describe('persister — query em erro', () => {
  it('ciclo: sucesso, depois 2 refetches falhos ⇒ o que foi persistido ainda traz o dado', async () => {
    const c = novo();
    await c.fetchQuery({ queryKey: ['pets'], queryFn: () => Promise.resolve(['Thor']) });
    for (let i = 0; i < 2; i++) await c.fetchQuery({ queryKey: ['pets'], queryFn: () => Promise.reject(new Error('offline')), staleTime: 0 }).catch(() => undefined);
    expect(c.getQueryState(['pets'])?.status).toBe('error');
    const salvo = dehydrate(c, dehydrateOptions);
    expect(salvo.queries).toHaveLength(1);
    const c2 = novo();
    hydrate(c2, salvo);
    expect(c2.getQueryData(['pets'])).toEqual(['Thor']);
  });
  it('query em erro SEM dado não é persistida', async () => {
    const c = novo();
    await c.fetchQuery({ queryKey: ['x'], queryFn: () => Promise.reject(new Error('offline')) }).catch(() => undefined);
    expect(c.getQueryState(['x'])?.status).toBe('error');
    expect(dehydrate(c, dehydrateOptions).queries).toHaveLength(0);
  });
  it('a raiz do app passa as opções ao persistidor', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'app', '_layout.tsx'), 'utf8');
    expect(src).toMatch(/persistOptions=\{\{[^}]*dehydrateOptions[^}]*\}\}/);
  });
});
