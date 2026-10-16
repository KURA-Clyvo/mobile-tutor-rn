import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';
import { KButton } from '@components/primitives/KButton';
import { KIcon } from '@components/primitives/KIcon';

// ÂNCORA (regra 11): cópia de mobile-clinica-rn `src/components/feedback/ErrorState.tsx`, linhas 1-72, commit 773ae66,
// conferida em 2026-10-15:
//   git -C mobile-clinica-rn show 773ae66:src/components/feedback/ErrorState.tsx | sed -n '1,72p'
// DIVERGÊNCIAS do tutor: (1) `useTheme()` do tutor devolve `{ colors, fonts, fontSize, spacing, radius }` direto e não
// há módulo `typography` — usa `fonts.*` + `fontSize.*`; (2) botão e ícone são `KButton`/`KIcon` do tutor (não KCButton/KCIcon);
// (3) o botão do bloco usa `md` (48) e o compacto `sm`+`ALVO_MINIMO` (o `sm` do KButton tem 40 — sobe a 44 aqui sem
// mexer no primitivo, que é da BR-TUT-T09); (4) `StyleSheet` por `makeStyles(theme)` porque fontes e espaços vêm do tema.
// Mantido igual: textos padrão, `accessibilityRole="alert"`, `testID` `error-state` / `error-state-retry`, API.
// Erro de carregamento (BR-TUT-T03): diz o que aconteceu SEM culpar a internet do usuário (a falha pode ser do servidor)
// e oferece a ação.
export const ERRO_TITULO_PADRAO = 'Não foi possível carregar';
export const ERRO_DESCRICAO_PADRAO = 'Os dados não chegaram. Tente de novo em instantes.';
export const ROTULO_TENTAR_DE_NOVO = 'Tentar de novo';
/** Alvo de toque mínimo (px) — Global Constraints do ciclo BRANDING. */
export const ALVO_MINIMO = 44;

export interface ErrorStateProps {
  titulo?: string;
  descricao?: string;
  onRetry: () => void;
  /** Rótulo do botão; padrão "Tentar de novo". */
  rotulo?: string;
  /** Linha curta (texto + botão) para dado auxiliar, em vez do bloco centrado. */
  compacto?: boolean;
  testID?: string;
}

type Tema = ReturnType<typeof useTheme>;

const makeStyles = ({ colors, fonts, fontSize, spacing }: Tema) =>
  StyleSheet.create({
    caixa: { alignItems: 'center', paddingVertical: spacing[8], paddingHorizontal: spacing[6], gap: spacing[2] },
    titulo: { fontFamily: fonts.bodyMedium, fontSize: fontSize.md, color: colors.text, textAlign: 'center', marginTop: spacing[2] },
    descricao: { fontFamily: fonts.body, fontSize: fontSize.base, color: colors.textSoft, textAlign: 'center' },
    acao: { marginTop: spacing[3] },
    linha: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing[2] },
    linhaTexto: { fontFamily: fonts.body, fontSize: fontSize.base, color: colors.text, flexShrink: 1 },
    alvo: { minHeight: ALVO_MINIMO },
  });

export function ErrorState({ titulo, descricao, onRetry, rotulo, compacto, testID = 'error-state' }: ErrorStateProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = makeStyles(theme);
  const rotuloAcao = rotulo ?? ROTULO_TENTAR_DE_NOVO;
  if (compacto) {
    return (
      <View style={styles.linha} testID={testID} accessibilityRole="alert">
        <Text style={styles.linhaTexto}>{titulo ?? ERRO_TITULO_PADRAO}.</Text>
        <KButton
          variant="ghost"
          size="sm"
          onPress={onRetry}
          style={styles.alvo}
          testID={`${testID}-retry`}
          accessibilityLabel={rotuloAcao}
        >
          {rotuloAcao}
        </KButton>
      </View>
    );
  }
  return (
    <View style={styles.caixa} testID={testID} accessibilityRole="alert">
      <KIcon name="alert" size={40} color={colors.textMuteInk} />
      <Text style={styles.titulo}>{titulo ?? ERRO_TITULO_PADRAO}</Text>
      <Text style={styles.descricao}>{descricao ?? ERRO_DESCRICAO_PADRAO}</Text>
      <KButton
        variant="secondary"
        onPress={onRetry}
        style={styles.acao}
        testID={`${testID}-retry`}
        accessibilityLabel={rotuloAcao}
      >
        {rotuloAcao}
      </KButton>
    </View>
  );
}
