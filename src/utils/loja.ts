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
