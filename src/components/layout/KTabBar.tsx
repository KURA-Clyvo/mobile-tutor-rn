// src/components/layout/KTabBar.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@theme/index';
import { KIcon, type IconName } from '../primitives/KIcon';
import { KBadge } from '../primitives/KBadge';

// Metadados de exibição por nome de rota — a ORDEM e a lista de abas em si
// vêm de `state.routes` (expo-router/(tabs)/_layout.tsx), não deste mapa.
const TAB_META: Record<string, { label: string; icon: IconName }> = {
  pets:   { label: 'Pets',   icon: 'pets'   },
  agenda: { label: 'Agenda', icon: 'agenda' },
  saude:  { label: 'Saúde',  icon: 'saude'  },
  perfil: { label: 'Perfil', icon: 'perfil' },
};

interface KTabBarProps extends BottomTabBarProps {
  agendaBadgeCount?: number;
}

export function KTabBar({ state, descriptors, navigation, agendaBadgeCount = 0 }: KTabBarProps) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.bar,
      {
        backgroundColor: theme.colors.surface,
        borderTopColor:  theme.colors.border,
        paddingBottom:   insets.bottom + 4,
        paddingTop:      8,
      },
    ]}>
      {state.routes.map((route, index) => {
        const meta   = TAB_META[route.name] ?? { label: route.name, icon: 'pets' as IconName };
        const label  = descriptors[route.key]?.options?.title ?? meta.label;
        const active = state.index === index;             // aba ativa vem do navegador, não de pathname
        const color  = active ? theme.colors.primary : theme.colors.textMute;

        const onPress = () => {
          // Padrão canônico do @react-navigation/bottom-tabs: emite o evento
          // tabPress, respeita preventDefault() e só navega se a aba não
          // estiver focada. Troca de aba, não empilha (router.push empilhava).
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!active && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
          >
            <View style={styles.iconWrap}>
              <KIcon name={meta.icon} size={22} color={color} />
              {route.name === 'agenda' && agendaBadgeCount > 0 && (
                <View style={styles.badgeWrap}>
                  <KBadge count={agendaBadgeCount} />
                </View>
              )}
            </View>
            <Text style={[
              styles.label,
              { fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color, letterSpacing: 0.6 },
            ]}>
              {label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar:       { flexDirection: 'row', borderTopWidth: 1, paddingHorizontal: 12 },
  tab:       { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap:  { position: 'relative' },
  badgeWrap: { position: 'absolute', top: -4, right: -8 },
  label:     { fontWeight: '500' },
});