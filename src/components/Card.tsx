import { ReactNode, useRef } from 'react';
import { Pressable, View, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

/** Hochwertige, weiche Karte mit dezenter Press-/Hover-Animation. */
export function Card({ children, onPress, style, padded = true }: CardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();

  const content = (
    <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      onPressIn={() => animate(0.97)}
      onPressOut={() => animate(1)}
      onHoverIn={() => animate(1.01)}
      onHoverOut={() => animate(1)}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{content}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, // modernere, ruhigere Rundung
    borderWidth: StyleSheet.hairlineWidth, // subtilerer Rahmen
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: { padding: spacing.lg, gap: spacing.sm },
});
