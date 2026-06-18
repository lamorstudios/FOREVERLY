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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, touch, typography, gradients } from '@/theme';

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

const VARIANTS: Record<
  Variant,
  { gradient?: readonly string[]; bg: string; text: string; border: string }
> = {
  primary: { gradient: gradients.brand, bg: colors.primary, text: colors.textOnAccent, border: 'transparent' },
  secondary: { bg: colors.surface, text: colors.primaryDark, border: colors.borderStrong },
  ghost: { bg: 'transparent', text: colors.primaryDark, border: 'transparent' },
  danger: { gradient: gradients.danger, bg: colors.error, text: colors.textOnAccent, border: 'transparent' },
};

/** Moderne, gut tippbare Schaltfläche mit Verlauf, weichem Glow und Press-Animation. */
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

  const body = loading ? (
    <ActivityIndicator color={palette.text} />
  ) : (
    <View style={styles.content}>
      {icon ? (
        <Ionicons name={icon} size={20} color={palette.text} style={styles.icon} />
      ) : null}
      <Text style={[typography.button, { color: palette.text }]}>{label}</Text>
    </View>
  );

  const fill = palette.gradient ? (
    <LinearGradient
      colors={palette.gradient as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { borderColor: palette.border }]}
    >
      {body}
    </LinearGradient>
  ) : (
    <View style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {body}
    </View>
  );

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
          styles.wrapper,
          variant === 'primary' && styles.glowPrimary,
          variant === 'danger' && styles.glowDanger,
          isDisabled && styles.disabled,
          { transform: [{ scale }] },
        ]}
      >
        {fill}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Button-Radius lt. Mockup: 30px (28–32). Höhe unverändert (touch.minHeight).
  wrapper: { borderRadius: 30 },
  base: {
    minHeight: touch.minHeight,
    borderRadius: 30,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Weicher, farbpassender Glow (Mockup): 0 10px 30px rgba(111,136,255,0.25).
  glowPrimary: {
    shadowColor: '#6F88FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  },
  glowDanger: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 8,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: spacing.sm },
  disabled: { opacity: 0.5 },
});
