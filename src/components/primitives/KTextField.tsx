import React, { useState } from 'react';
import { TextInput, View, Text, Pressable, StyleSheet, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface KTextFieldProps extends Omit<TextInputProps, 'style'> {
  label:           string;
  error?:          string;
  helperText?:     string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function KTextField({ label, error, helperText, secureTextEntry, containerStyle, ...inputProps }: KTextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden,  setHidden]  = useState(secureTextEntry ?? false);

  const borderColor = error
    ? theme.colors.danger
    : focused
    ? theme.colors.borderFocus   // Sage in light mode
    : theme.colors.borderStrong;

  return (
    <View style={[containerStyle]}>
      {/* Label — mono uppercase via JS (not CSS) so RNTL getByText works */}
      <Text
        style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, letterSpacing: 1.4, color: theme.colors.textMute, marginBottom: 6 }}
      >
        {label.toUpperCase()}
      </Text>

      {/* Input wrapper */}
      <View style={[styles.wrapper, { borderColor, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          secureTextEntry={hidden}
          onFocus={e => { setFocused(true);  inputProps.onFocus?.(e); }}
          onBlur ={e => { setFocused(false); inputProps.onBlur?.(e);  }}
          style={{ flex: 1, paddingVertical: 14, color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSize.base }}
          placeholderTextColor={theme.colors.textMute}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden(h => !h)}
            style={styles.toggle}
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
          >
            <Text style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color: theme.colors.primary, letterSpacing: 1.2 }}>
              {hidden ? 'MOSTRAR' : 'OCULTAR'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Reserve 18px to prevent layout shift */}
      <View style={{ minHeight: 18, marginTop: 4 }}>
        {error
          ? <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.danger }}>{error}</Text>
          : helperText
          ? <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textMute }}>{helperText}</Text>
          : null
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 16 },
  toggle:  { paddingLeft: 12, paddingVertical: 14 },
});
