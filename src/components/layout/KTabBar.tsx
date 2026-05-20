import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@theme/index';
import { KIcon } from '../primitives/KIcon';
import { KBadge } from '../primitives/KBadge';

const TABS = [
  { name: 'pets',   label: 'Pets',   icon: 'pets'   as const },
  { name: 'agenda', label: 'Agenda', icon: 'agenda' as const },
  { name: 'saude',  label: 'Saúde',  icon: 'saude'  as const },
  { name: 'perfil', label: 'Perfil', icon: 'perfil' as const },
];

interface KTabBarProps extends BottomTabBarProps {
  agendaBadgeCount?: number;
}

export function KTabBar({ state, navigation, agendaBadgeCount = 0 }: KTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.bar,
      {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        paddingBottom: insets.bottom + 4,
        paddingTop: 8,
      },
    ]}>
      {TABS.map((tab, index) => {
        const active = state.index === index;
        const color  = active ? theme.colors.primary : theme.colors.textMute;

        return (
          <Pressable
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
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
            <Text style={[styles.label, { fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color, letterSpacing: 0.6 }]}>
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
