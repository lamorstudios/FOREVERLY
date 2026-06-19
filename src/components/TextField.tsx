import { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radius, spacing, typography } from '@/theme';

// Web: harten Browser-Default-Outline entfernen; Fokus zeigt der Wrapper (blau + Ring).
const webNoOutline =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;
const webFocusRing =
  Platform.OS === 'web' ? ({ boxShadow: '0 0 0 4px rgba(91,124,255,0.12)' } as unknown as ViewStyle) : null;

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  secure?: boolean;
  /** Optionales Icon rechts im Feld (z. B. Kalender). */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

/** Großes, klar beschriftetes Eingabefeld. */
export function TextField({
  label,
  error,
  hint,
  secure,
  rightIcon,
  onRightIconPress,
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
          focused && webFocusRing,
          !!error && styles.errored,
        ]}
      >
        <TextInput
          style={[styles.input, webNoOutline, style]}
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
        {rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Kalender öffnen"
          >
            <Ionicons name={rightIcon} size={22} color={colors.primary} />
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
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 58,
  },
  focused: { borderColor: colors.primary },
  errored: { borderColor: colors.error },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
});
