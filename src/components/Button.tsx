import { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, touch, typography, shadow } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const VARIANTS: Record<Variant, { bg: string; text: string; border: string }> = {
  primary: { bg: colors.primary, text: colors.textOnAccent, border: colors.primary },
  secondary: { bg: colors.surface, text: colors.primaryDark, border: colors.borderStrong },
  ghost: { bg: 'transparent', text: colors.primaryDark, border: 'transparent' },
  danger: { bg: colors.error, text: colors.textOnAccent, border: colors.error },
};

/** Moderne, gut tippbare Schaltfläche mit weicher Press-Animation. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const palette = VARIANTS[variant];
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => !isDisabled && animate(0.97)}
      onPressOut={() => animate(1)}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <Animated.View
        style={[
          styles.base,
          { backgroundColor: palette.bg, borderColor: palette.border },
          variant === 'primary' && shadow.soft,
          isDisabled && styles.disabled,
          { transform: [{ scale }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <View style={styles.content}>
            {icon ? (
              <Ionicons name={icon} size={20} color={palette.text} style={styles.icon} />
            ) : null}
            <Text style={[typography.button, { color: palette.text }]}>{label}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.minHeight,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: spacing.sm },
  disabled: { opacity: 0.5 },
});
