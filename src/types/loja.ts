// S4-LOJA-05 — contrato CRU de GET /api/v1/loja/catalogo (shape que o Java devolve; o app não renomeia nada).
//
// ÂNCORA (regra 11): cópia de regra de negócio do repo backend-tutor-java, commit 98fb53e (origin/main), conferida em 2026-10-17.
// Prefixo: src/main/java/br/com/clyvo/kura/tutor/loja/
//   - bff/api/dto/CatalogoResponse.java:9-14      envelope { aviso, content, page, size, hasNext }
//   - bff/api/dto/ItemCatalogoResponse.java:12-20 item { slug, nome, descricao?, categoria, preco (CENTAVOS), moeda, exemplo, dados }
//   - bff/api/LojaCatalogoController.java:23,35-51 GET /v1/loja/catalogo (context-path /api), JWT, params categoria/page/size
// Reproduz: git -C D:/FIAP/KURA/backend-tutor-java show 98fb53e:src/main/java/br/com/clyvo/kura/tutor/loja/bff/api/dto/ItemCatalogoResponse.java | sed -n '12,20p'
//
// NX-04 — ÂNCORA (regra 11) do campo `imagem`: backend-tutor-java, commit 5f98cf8 (branch feat/nx-04-imagem-produto; vira o hash
// do merge em main depois do G2), src/main/java/br/com/clyvo/kura/tutor/loja/bff/api/dto/ItemCatalogoResponse.java (campo `imagem`
// do record, `record Imagem(url, urlThumb, alt)` e PREFIXO_IMAGENS), conferida em 2026-10-18.
// Reproduz: git -C D:/FIAP/KURA/backend-tutor-java show 5f98cf8:src/main/java/br/com/clyvo/kura/tutor/loja/bff/api/dto/ItemCatalogoResponse.java | grep -n "imagem\|Imagem\|PREFIXO_IMAGENS"

export type CategoriaLoja = 'ALIMENTACAO' | 'HIGIENE' | 'ACESSORIOS' | 'BRINQUEDOS';

export interface ItemCatalogoRaw {
  slug: string;
  nome: string;
  /** Omitida pela API quando ausente (`@JsonInclude(NON_NULL)`). */
  descricao?: string;
  categoria: CategoriaLoja;
  /** CENTAVOS, inteiro (4990 = R$ 49,90). */
  preco: number;
  moeda: 'BRL';
  /** true = item de demonstração: a tela mostra o selo "Exemplo" (D-LOJA-10). */
  exemplo: boolean;
  dados: Record<string, unknown>;
  /** Omitida pela API quando o item não tem foto (`NON_NULL`): o card usa o placeholder da categoria. */
  imagem?: ImagemItemRaw;
}

/** Caminhos RELATIVOS à base da API (montados no Java; o app só junta a base): `/api/loja/imagens/<chave>[_256].webp`. */
export interface ImagemItemRaw {
  url: string;
  urlThumb: string;
  /** Texto alternativo: vira o `accessibilityLabel` da foto. */
  alt: string;
}

export interface CatalogoLojaRaw {
  aviso: string;
  content: ItemCatalogoRaw[];
  page: number;
  size: number;
  hasNext: boolean;
}

/** Ordem e rótulo dos chips; a ordem dos produtos é a da API (campo `ordem`, editorial e estável). */
export const CATEGORIAS_LOJA: { valor: CategoriaLoja; rotulo: string }[] = [
  { valor: 'ALIMENTACAO', rotulo: 'Alimentação' },
  { valor: 'HIGIENE', rotulo: 'Higiene' },
  { valor: 'ACESSORIOS', rotulo: 'Acessórios' },
  { valor: 'BRINQUEDOS', rotulo: 'Brinquedos' },
];

// ÂNCORA (regra 11): constante do aviso de pré-lançamento (D-S4-6). Cópia BYTE A BYTE de
// backend-tutor-java 98fb53e, src/main/java/br/com/clyvo/kura/tutor/loja/application/LojaAviso.java:10-12 (campo TEXTO),
// conferida em 2026-10-17. Reproduz: git -C D:/FIAP/KURA/backend-tutor-java show 98fb53e:src/main/java/br/com/clyvo/kura/tutor/loja/application/LojaAviso.java | sed -n '10,12p'
// Usada quando NÃO há resposta da API (carregando, erro sem dado); havendo resposta, a tela mostra o `aviso` que a API mandou.
export const AVISO_LOJA_PRE_LANCAMENTO =
  'Pré-lançamento: pagamento e entrega serão ativados quando os parceiros logísticos concluírem a integração. Nenhuma cobrança é feita.';
