import React from 'react';
import { SafeAreaView, ScrollView, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';

interface ScreenContainerProps {
  children:        React.ReactNode;
  scroll?:         boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  style?:          StyleProp<ViewStyle>;
  contentStyle?:   StyleProp<ViewStyle>;
}

export function ScreenContainer({ children, scroll = true, refreshControl, style, contentStyle }: ScreenContainerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bg = { backgroundColor: theme.colors.bg, flex: 1 };
  const px = { paddingHorizontal: 24, paddingBottom: insets.bottom + 16 };

  if (!scroll) {
    return (
      <SafeAreaView style={[bg, style]}>
        <View style={[{ flex: 1 }, px, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[bg, style]}>
      <ScrollView
        contentContainerStyle={[px, contentStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
