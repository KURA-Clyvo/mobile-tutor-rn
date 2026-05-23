// src/components/layout/KTabBar.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';  // ← usePathname pra saber aba ativa
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@theme/index';
import { KIcon } from '../primitives/KIcon';
import { KBadge } from '../primitives/KBadge';

const TABS = [
  { name: 'pets',   label: 'Pets',   icon: 'pets'   as const, route: '/(tabs)/pets'   },
  { name: 'agenda', label: 'Agenda', icon: 'agenda' as const, route: '/(tabs)/agenda' },
  { name: 'saude',  label: 'Saúde',  icon: 'saude'  as const, route: '/(tabs)/saude'  },
  { name: 'perfil', label: 'Perfil', icon: 'perfil' as const, route: '/(tabs)/perfil' },
];

interface KTabBarProps extends BottomTabBarProps {
  agendaBadgeCount?: number;
}

export function KTabBar({ agendaBadgeCount = 0 }: KTabBarProps) {
  const theme    = useTheme();
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const pathname = usePathname();          // ex: '/pets', '/saude'

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
      {TABS.map(tab => {
        const active = pathname.includes(tab.name);  // '/pets' includes 'pets' ✓
        const color  = active ? theme.colors.primary : theme.colors.textMute;

        return (
          <Pressable
            key={tab.name}
            onPress={() => router.push(tab.route as any)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconWrap}>
              <KIcon name={tab.icon} size={22} color={color} />
              {tab.name === 'agenda' && agendaBadgeCount > 0 && (
                <View style={styles.badgeWrap}>
                  <KBadge count={agendaBadgeCount} />
                </View>
              )}
            </View>
            <Text style={[
              styles.label,
              { fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color, letterSpacing: 0.6 },
            ]}>
              {tab.label.toUpperCase()}
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