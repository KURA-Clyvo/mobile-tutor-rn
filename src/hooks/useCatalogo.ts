import { useQuery } from '@tanstack/react-query';
import { listarCatalogo } from '../services/loja.service';

// A Loja pede o catálogo inteiro de uma vez (o recorte tem ~10 itens; o teto da API é size=50) e o filtro por categoria é
// feito na tela, sobre esta lista: trocar de chip não dispara rede nem derruba o aviso. Ordem = a da API (editorial).
// LIMITE CONHECIDO (G2 m-e): acima de 50 itens ativos o catálogo é TRUNCADO (o 51º não aparece e `hasNext` é ignorado); a
// paginação vem com o `F2`. Hoje são 10 itens.
export function useCatalogo() {
  return useQuery({
    queryKey: ['loja', 'catalogo'],
    queryFn: () => listarCatalogo({ size: 50 }),
    staleTime: 60_000,
  });
}
