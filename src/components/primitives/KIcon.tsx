import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '@theme/index';

// 17 icons: Tab (4) + Navigation (4) + Action (6) + Domain (3)
export type IconName =
  | 'pets' | 'agenda' | 'saude' | 'perfil'
  | 'back' | 'close' | 'arrowR' | 'chevR'
  | 'bell' | 'check' | 'alert' | 'plus' | 'share' | 'download'
  | 'vaccine' | 'calendar' | 'search';

interface KIconProps {
  name:         IconName;
  size?:        number;
  strokeWidth?: number;
  color?:       string;
  style?:       import('react-native').StyleProp<import('react-native').ViewStyle>;
}

export function KIcon({ name, size = 18, strokeWidth = 1.7, color, style }: KIconProps) {
  const theme = useTheme();
  const c = color ?? theme.colors.text;
  const s = { stroke: c, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const vb = '0 0 24 24';

  const icons: Record<IconName, React.ReactNode> = {
    // ─── Tab icons ────────────────────────────────────────────
    pets: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Circle cx="7"    cy="9"  r="2"   {...s}/>
        <Circle cx="17"   cy="9"  r="2"   {...s}/>
        <Circle cx="4.5"  cy="14" r="1.5" {...s}/>
        <Circle cx="19.5" cy="14" r="1.5" {...s}/>
        <Path d="M12 21c-3 0-7-2-7-6 0-2 2-3 4-3h6c2 0 4 1 4 3 0 4-4 6-7 6z" {...s}/>
      </Svg>
    ),
    agenda: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Rect x="3" y="4" width="18" height="17" rx="2" {...s}/>
        <Path d="M16 2v4M8 2v4M3 10h18" {...s}/>
      </Svg>
    ),
    saude: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Path d="M22 12h-4l-3 9L9 3l-3 9H2" {...s}/>
      </Svg>
    ),
    perfil: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Circle cx="12" cy="8" r="4" {...s}/>
        <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" {...s}/>
      </Svg>
    ),

    // ─── Navigation ───────────────────────────────────────────
    back:   <Svg width={size} height={size} viewBox={vb} fill="none"><Path d="M15 6l-6 6 6 6" {...s}/></Svg>,
    close:  <Svg width={size} height={size} viewBox={vb} fill="none"><Path d="M18 6L6 18M6 6l12 12" {...s}/></Svg>,
    arrowR: <Svg width={size} height={size} viewBox={vb} fill="none"><Path d="M5 12h14M13 6l6 6-6 6" {...s}/></Svg>,
    chevR:  <Svg width={size} height={size} viewBox={vb} fill="none"><Path d="M9 6l6 6-6 6" {...s}/></Svg>,

    // ─── Action ───────────────────────────────────────────────
    bell: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" {...s}/>
      </Svg>
    ),
    check:    <Svg width={size} height={size} viewBox={vb} fill="none"><Path d="M20 6L9 17l-5-5" {...s}/></Svg>,
    alert: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Circle cx="12" cy="12" r="9" {...s}/>
        <Path d="M12 8v4M12 16h.01" {...s}/>
      </Svg>
    ),
    plus:     <Svg width={size} height={size} viewBox={vb} fill="none"><Path d="M12 5v14M5 12h14" {...s}/></Svg>,
    share: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Circle cx="18" cy="5"  r="3" {...s}/>
        <Circle cx="6"  cy="12" r="3" {...s}/>
        <Circle cx="18" cy="19" r="3" {...s}/>
        <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" {...s}/>
      </Svg>
    ),
    download: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Path d="M12 3v13M7 12l5 5 5-5" {...s}/>
        <Path d="M5 20h14" {...s}/>
      </Svg>
    ),

    // ─── Domain ───────────────────────────────────────────────
    vaccine: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Path d="M10 10l-2 2m4-6l6 6-4 4-6-6 4-4zM2 22l4-4M14 6l4 4M6 14l2 2" {...s}/>
      </Svg>
    ),
    calendar: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Rect x="3" y="4" width="18" height="17" rx="2" {...s}/>
        <Path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" {...s}/>
      </Svg>
    ),
    search: (
      <Svg width={size} height={size} viewBox={vb} fill="none">
        <Circle cx="11" cy="11" r="7" {...s}/>
        <Path d="m21 21-4.35-4.35" {...s}/>
      </Svg>
    ),
  };

  if (style) return <View style={style}>{icons[name]}</View>;
  return <>{icons[name]}</>;
}
