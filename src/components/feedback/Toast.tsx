import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { KIcon, type IconName } from '@components/primitives/KIcon';

// BR-TUT-T05 — retorno não-decisório de uma ação ("Horário solicitado", "Consentimento revogado").
// Âncora: `mobile-clinica-rn/src/components/feedback/Toast.tsx` (BR-CLI-T02, main@8e721ee), mesma API
// (`useToast().show({tipo, texto})`, canal por módulo). Diferença: tokens/ícones do tutor.
// O toast NÃO afirma sucesso antes de o servidor responder: quem chama só usa 'sucesso' depois do `await`.
export type TipoToast = 'sucesso' | 'erro' | 'info';
export type OpcoesToast = { tipo: TipoToast; texto: string };

const DURACAO_MS = 4000;
const D_BASE_MS = 220;

type Ouvinte = (t: OpcoesToast) => void;
let ouvinte: Ouvinte | null = null;

export function registrarOuvinteToast(o: Ouvinte): () => void {
  ouvinte = o;
  return () => {
    if (ouvinte === o) ouvinte = null;
  };
}

export function mostrarToast(o: OpcoesToast): void {
  if (!ouvinte) {
    if (__DEV__) console.warn('toast: nenhum ToastProvider montado:', o.texto);
    return;
  }
  ouvinte(o);
}

export function useToast(): { show(o: OpcoesToast): void } {
  const show = useCallback((o: OpcoesToast) => mostrarToast(o), []);
  return useMemo(() => ({ show }), [show]);
}

const ICONE: Record<TipoToast, IconName> = { sucesso: 'check', erro: 'alert', info: 'bell' };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors, fonts, fontSize, spacing, radius } = useTheme();
  const [toast, setToast] = useState<OpcoesToast | null>(null);
  const opacidade = useRef(new Animated.Value(0)).current;
  const reduzir = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = AccessibilityInfo.isReduceMotionEnabled?.();
    p?.then((v) => {
      reduzir.current = !!v;
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const desregistrar = registrarOuvinteToast((t) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(t);
      opacidade.setValue(0);
      Animated.timing(opacidade, {
        toValue: 1,
        duration: reduzir.current ? 0 : D_BASE_MS,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => setToast(null), DURACAO_MS);
    });
    return () => {
      desregistrar();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [opacidade]);

  const cor = toast
    ? toast.tipo === 'sucesso' ? colors.success : toast.tipo === 'erro' ? colors.danger : colors.info
    : colors.border;

  return (
    <>
      {children}
      {toast ? (
        <View style={[styles.faixa, { left: spacing[4], right: spacing[4], bottom: spacing[6] }]} pointerEvents="none">
          <Animated.View
            style={[
              styles.toast,
              {
                borderColor: cor,
                opacity: opacidade,
                backgroundColor: colors.bgElev,
                borderRadius: radius.md,
                gap: spacing[3],
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[4],
              },
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            testID="toast"
          >
            <KIcon name={ICONE[toast.tipo]} size={18} color={cor} />
            <Text style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.text, flexShrink: 1 }}>{toast.texto}</Text>
          </Animated.View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  faixa: { position: 'absolute', alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', maxWidth: 480, minHeight: 44, borderWidth: 1 },
});
