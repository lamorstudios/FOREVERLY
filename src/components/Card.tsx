import { ReactNode } from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
}

/** Weiche, warme Karte für Inhalte. */
export function Card({ children, onPress, style, padded = true }: CardProps) {
  const content = (
    <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  padded: { padding: spacing.lg, gap: spacing.sm },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});
