// Preço da Loja: a API manda CENTAVOS inteiros (ItemCatalogoResponse.preco, backend-tutor-java 98fb53e). Formatação manual e
// determinística (sem Intl): 4990 -> "R$ 49,90"; 123456 -> "R$ 1.234,56". Entrada inválida não vira número inventado.
export function formatarPrecoCentavos(centavos: number): string {
  if (!Number.isFinite(centavos) || centavos < 0) return '';
  const total = Math.round(centavos);
  const reais = Math.floor(total / 100);
  const cents = String(total % 100).padStart(2, '0');
  const milhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${milhar},${cents}`;
}

// NX-04 — a API devolve o caminho da foto RELATIVO (`/api/loja/imagens/...`); o `<Image>` precisa de URL absoluta. A base é a
// mesma do apiClient (no túnel já carrega o prefixo `/tutor`). Sem base (mock sem backend), devolve o caminho cru: a carga
// falha e o card cai no placeholder (`onError`).
export function urlImagemLoja(caminho: string, base: string | undefined = process.env.EXPO_PUBLIC_API_BASE_URL): string {
  const raiz = (base ?? '').replace(/\/+$/, '');
  return `${raiz}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
}
