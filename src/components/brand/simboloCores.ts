import type { ColorTokens } from '@theme/tokens';
import spec from './simboloCores.json';

// ÂNCORA (regra 11): adaptado de mobile-clinica-rn `src/components/brand/simboloCores.ts` linhas 1-41,
// commit 773ae66, conferido em 2026-10-15. Reproduz:
//   git -C mobile-clinica-rn show 773ae66:src/components/brand/simboloCores.ts | sed -n '1,41p'
// Diferença: só a variante `sobreNeutro` (o tutor não tem fundo ocean) e o tipo dos tokens é `ColorTokens`.

/** Contextos em que o símbolo aparece (ver `simboloCores.json`). */
export type VarianteSimbolo = 'sobreNeutro';

export interface CoresSimbolo {
  corpo: string;
  corpoOpac: number;
  haste: string;
  hasteOpac: number;
  patas: string;
  lateraisOpac: number;
  contorno: string;
  contornoOpac: number;
  /** Cor da pata "acesa" (abertura). `amberInk`: o DS manda a tinta `ink` para ícone/texto. */
  pataAcesa: string;
}

/**
 * Resolve as cores do símbolo para uma variante e um tema, a partir de `simboloCores.json` (nomes de
 * token) e dos tokens do tema. O `gerar-assets.mjs` lê o MESMO json e os MESMOS tokens — splash, ícones
 * e componente não têm hex próprio.
 */
export function resolverSimbolo(variante: VarianteSimbolo, colors: ColorTokens): CoresSimbolo {
  const s = spec[variante];
  const cor = (nome: string) => colors[nome as keyof ColorTokens];
  return {
    corpo: cor(s.corpo),
    corpoOpac: s.corpoOpac,
    haste: cor(s.haste),
    hasteOpac: s.hasteOpac,
    patas: cor(s.patas),
    lateraisOpac: s.lateraisOpac,
    contorno: cor(s.contorno),
    contornoOpac: s.contornoOpac,
    pataAcesa: cor(s.pataAcesa),
  };
}
