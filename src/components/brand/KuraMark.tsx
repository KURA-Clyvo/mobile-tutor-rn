import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { resolverSimbolo, type VarianteSimbolo } from './simboloCores';

// ÂNCORA (regra 11): a forma (viewBox, `d=` dos paths, círculos) e a lógica de variante/patas são copiadas de
// mobile-clinica-rn `src/components/brand/KuraMark.tsx`, commit 773ae66, conferido em 2026-10-15 (lógica de variante/patas = linhas 52-61; 37-51 são constantes e doc; 62-95 o JSX do Svg):
//   git -C mobile-clinica-rn show 773ae66:src/components/brand/KuraMark.tsx | sed -n '37,95p'
// Diferenças do tutor: cor de contexto sage (tokens do tutor), só a variante `sobreNeutro`, e o desenho vem
// embrulhado num <View accessibilityRole="image" accessibilityLabel="KURA"> (o texto "Kura." que ele
// substitui era lido pelo leitor de tela; a marca precisa continuar lida).

export interface KuraMarkProps {
  /**
   * Largura do mark, em px. A altura é sempre derivada como `size * 48/40` para preservar a proporção 5:6
   * do brand book — width/height não são aceitos como props independentes de propósito.
   */
  size?: number;
  /** Cor do mark, sempre por token (`useTheme()`), nunca hex literal. Default: `colors.primary` (sage). */
  color?: string;
  /**
   * Cores por contexto, de `simboloCores.json` — a mesma fonte do `gerar-assets.mjs`. `sobreNeutro`: sage
   * sobre areia/Noite, corpo `primarySoft` SÓLIDO. Quando passada, `color` é ignorado. Sem `variante`, o
   * desenho é o de sempre (corpo a 18%, haste a 50%, tudo em `color`).
   */
  variante?: VarianteSimbolo;
  /**
   * Cores por pata, na ordem [central, esquerda, direita] — usadas pela abertura para acender as patas em
   * âmbar uma a uma. Default: as patas da variante (ou `color`).
   */
  patas?: [string, string, string];
  /** Rótulo lido pelo leitor de tela. Default "KURA". */
  accessibilityLabel?: string;
}

const VIEWBOX_WIDTH = 40;
const VIEWBOX_HEIGHT = 48;
const DEFAULT_SIZE = 32;

/**
 * `KuraMark` — marca canônica do KURA (brand book `brandbook-logo.jsx:3-28`): viewBox 40×48, corpo de
 * folha/semente + 3 círculos ("patas/cabeças"). Restrições do brand book: proporção 5:6, mínimo 24px
 * digital / 48px em UI, sem sombra/glow/bisel, sem rotação, círculos sempre preenchidos.
 */
export function KuraMark({ size = DEFAULT_SIZE, color, variante, patas, accessibilityLabel = 'KURA' }: KuraMarkProps) {
  const { colors } = useTheme();
  const height = size * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH);
  const c = color ?? colors.primary;
  const v = variante ? resolverSimbolo(variante, colors) : undefined;
  const base = v?.patas ?? c;
  const [pataCentral, pataEsq, pataDir] = patas ?? [base, base, base];
  const lateraisOpac = v ? v.lateraisOpac : patas ? 1 : 0.85;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} width={size} height={height} fill="none">
        {/* corpo */}
        <Path
          d="M20 44 C8 44 4 34 4 24 C4 10 12 4 20 4 C28 4 36 10 36 24 C36 34 32 44 20 44Z"
          fill={v ? v.corpo : c}
          fillOpacity={v ? v.corpoOpac : 0.18}
        />
        {/* haste */}
        <Path
          d="M20 44 L20 16"
          stroke={v ? v.haste : c}
          strokeWidth="1.2"
          opacity={v ? v.hasteOpac : 0.5}
          strokeLinecap="round"
        />
        {/* 3 "patas/cabeças" */}
        <Circle cx="20" cy="8" r="3.5" fill={pataCentral} />
        <Circle cx="13" cy="12" r="2.8" fill={pataEsq} opacity={lateraisOpac} />
        <Circle cx="27" cy="12" r="2.8" fill={pataDir} opacity={lateraisOpac} />
        {/* contorno do corpo */}
        <Path
          d="M20 44 C8 44 4 34 4 24 C4 10 12 4 20 4 C28 4 36 10 36 24 C36 34 32 44 20 44Z"
          stroke={v ? v.contorno : c}
          strokeWidth="1.5"
          fill="none"
          opacity={v ? v.contornoOpac : 0.7}
        />
      </Svg>
    </View>
  );
}
