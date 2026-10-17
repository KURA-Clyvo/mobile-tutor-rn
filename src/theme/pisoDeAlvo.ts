import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { touchTarget } from './tokens';

/**
 * Piso de alvo de toque (BR-TUT-T09, M-3 da G2). Vai por ÚLTIMO no array de style: o chamador pode SUBIR
 * `minHeight`/`minWidth`, nunca baixar abaixo de `base` (padrão `touchTarget.min`).
 */
export function pisoDeAlvo(style: StyleProp<ViewStyle>, base: number = touchTarget.min): ViewStyle {
  const f = StyleSheet.flatten(style) ?? {};
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  return {
    minHeight: Math.max(base, num(f.minHeight)),
    minWidth: Math.max(touchTarget.min, num(f.minWidth)),
  };
}
