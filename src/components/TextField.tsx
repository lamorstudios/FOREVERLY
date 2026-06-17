import { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TextStyle,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radius, spacing, typography } from '@/theme';

// Entfernt den voreingestellten schwarzen/blauen Fokus-Rahmen des Browsers (Web).
const noWebOutline =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  secure?: boolean;
}

/** Großes, klar beschriftetes Eingabefeld. */
export function TextField({
  label,
  error,
  hint,
  secure,
  style,
  ...props
}: TextFieldProps) {
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" color={colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.inputRow,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        <TextInput
          style={[styles.input, noWebOutline, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityLabel={hidden ? 'Passwort anzeigen' : 'Passwort verbergen'}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={24}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    // Dünner, ruhiger Beige-Border (kein Browser-Look).
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 58,
  },
  // Fokus: zartes Gold + weicher Glow (iOS-/moderne App-Optik), ohne Layout-Sprung.
  focused: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  errored: { borderColor: colors.error },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
});
