export const lightColors = {
  primary:         '#4A6944',
  primaryLight:    '#7B9E76',
  primarySoft:     '#E0ECDB',
  textOnPrimary:   '#FFFCF7',
  amber:           '#C8810D',  // DS amber (preenchimento/grafismo). Texto usa amberInk.
  amberBright:     '#E89C20',
  amberInk:        '#96610A',  // texto/ícone de aviso (DS amber-ink)
  amberPale:       '#FBF0DB',
  clay:            '#D9624A',  // DS clay (preenchimento/grafismo). Texto usa clayInk.
  clayInk:         '#A34A38',  // texto de urgência (DS clay-ink)
  clayPale:        '#F7E5DF',
  ocean:           '#1A3A52',
  oceanSoft:       '#2D5E7E',
  oceanPale:       '#D8E8F2',
  bg:              '#F8F2E6',
  bgElev:          '#FFFCF7',
  bgSunk:          '#EDE3CD',
  surface:         '#FFFCF7',
  surface2:        '#F2EBDB',
  border:          '#EDE3CD',
  borderStrong:    '#D9CDB0',
  borderControl:   '#93856A',  // limite de campo/checkbox/switch (WCAG 1.4.11, DS border-control)
  borderFocus:     '#4A6944',
  text:            '#1B1006',
  textSoft:        '#4A3418',
  textMute:        '#8A7458',  // canônico do DS: só grafismo/texto >= 24px. Texto usa textMuteInk.
  textMuteInk:     '#7C684F',
  textOnSage:      '#FFFCF7',
  textOnAmber:     '#1B1006',
  textOnOcean:     '#FFFCF7',
  success:         '#4A6944',
  successBg:       '#E0ECDB',
  warning:         '#C8810D',  // alias de amber (DS): não serve a texto
  warningBg:       '#FBF0DB',
  danger:          '#B14A2F',
  dangerBg:        '#F7E5DF',
  info:            '#2D5E7E',
  infoBg:          '#D8E8F2',
  // Tokens com alfa (bordas de chip, véu de modal): ficam aqui para nenhuma tela escrever rgba literal.
  chipBorderSage:  'rgba(74,105,68,0.22)',
  chipBorderAmber: 'rgba(200,129,13,0.22)',
  chipBorderClay:  'rgba(217,98,74,0.22)',
  chipBorderOcean: 'rgba(26,58,82,0.22)',
  clayTint:        'rgba(217,98,74,0.15)',
  scrim:           'rgba(0,0,0,0.4)',
  scrimDialog:     'rgba(0,0,0,0.45)',
} as const;

export const darkColors = {
  primary:         '#8FB088',
  primaryLight:    '#A8C4A1',
  primarySoft:     '#1F2A1B',
  textOnPrimary:   '#14110C',
  amber:           '#E89C20',
  amberBright:     '#FFB539',
  amberInk:        '#E89C20',
  amberPale:       '#3A2810',
  clay:            '#E07D62',
  clayInk:         '#E07D62',
  clayPale:        '#3A1E16',
  ocean:           '#6FA8C8',
  oceanSoft:       '#4A8AAB',
  oceanPale:       '#1A2A38',
  bg:              '#14110C',
  bgElev:          '#1F1A12',
  bgSunk:          '#0E0C08',
  surface:         '#1F1A12',
  surface2:        '#2A2418',
  border:          '#2A2418',
  borderStrong:    '#3D3424',
  borderControl:   '#7A6C50',
  borderFocus:     '#E89C20',
  text:            '#F0E8D8',
  textSoft:        '#C8BCA0',
  textMute:        '#8A7E62',
  textMuteInk:     '#9A8E72',  // DS text-mute-ink escuro (clareia para passar 4.5 sobre surface)
  textOnSage:      '#14110C',
  textOnAmber:     '#14110C',
  textOnOcean:     '#14110C',
  success:         '#8FB088',
  successBg:       '#1F2A1B',
  warning:         '#E89C20',
  warningBg:       '#3A2810',
  danger:          '#E07D62',
  dangerBg:        '#3A1E16',
  info:            '#6FA8C8',
  infoBg:          '#1A2A38',
  // Tokens com alfa (bordas de chip, véu de modal): ficam aqui para nenhuma tela escrever rgba literal.
  chipBorderSage:  'rgba(74,105,68,0.22)',
  chipBorderAmber: 'rgba(200,129,13,0.22)',
  chipBorderClay:  'rgba(217,98,74,0.22)',
  chipBorderOcean: 'rgba(26,58,82,0.22)',
  clayTint:        'rgba(217,98,74,0.15)',
  scrim:           'rgba(0,0,0,0.4)',
  scrimDialog:     'rgba(0,0,0,0.66)',
} as const;

// BR-TUT-T09 — alvo mínimo de toque (WCAG 2.5.8 AA = 24; 2.5.5 AAA e HIG/Material = 44). Fonte única: o gate
// `__tests__/a11y-alvos-gate.test.tsx` exige este valor (ou literal >= 44) em todo tocável. Mesmo nome e valor da clínica (`tokens.ts:135`).
export const touchTarget = { min: 44 } as const;

export const spacing  = { 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64 } as const;
export const radius   = { sm:6, md:10, lg:14, xl:20, '2xl':28, full:9999 } as const;
export const fontSize = { xs:11, sm:13, base:15, md:17, lg:20, xl:26, '2xl':34, '3xl':44 } as const;
export const fonts = {
  display:    'Cormorant_500Medium',
  body:       'Lexend_400Regular',
  bodyMedium: 'Lexend_500Medium',
  mono:       'JetBrainsMono_400Regular',
} as const;
export type ColorTokens = { [K in keyof typeof lightColors]: string };
export type Theme = { colors: ColorTokens; spacing: typeof spacing; radius: typeof radius; fontSize: typeof fontSize; fonts: typeof fonts; isDark: boolean };
