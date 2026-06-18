import { ReactNode, useRef } from 'react';
import { Pressable, View, StyleSheet, ViewStyle, StyleProp, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, spacing, shadow } from '@/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** Optionaler Verlaufs-Hintergrund (z. B. für Hero-Karten). Stops als Hex/RGBA. */
  gradient?: readonly string[];
  /** Glassmorphism: transluzentes Weiß + weicher Blur + zarte Kante. */
  glass?: boolean;
}

// Mehrschichtiger Schatten für echte Tiefe (nur Web; nativ greift shadow.card).
const webLayeredShadow =
  Platform.OS === 'web'
    ? ({
        boxShadow:
          '0 1px 2px rgba(30,34,51,0.04), 0 8px 18px rgba(30,34,51,0.06), 0 24px 48px rgba(30,34,51,0.10)',
      } as unknown as ViewStyle)
    : null;

// Weicher Glas-Blur (nur Web).
const webGlassBlur =
  Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as unknown as ViewStyle)
    : null;

/** Hochwertige, schwebende Karte mit weicher Press-/Hover-Animation. */
export function Card({ children, onPress, style, padded = true, gradient, glass }: CardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();

  const inner = gradient ? (
    <LinearGradient
      colors={gradient as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, webLayeredShadow, styles.gradientCard, padded && styles.padded, style]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View
      style={[
        styles.card,
        webLayeredShadow,
        webGlassBlur,
        glass && styles.glassStrong,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      onPressIn={() => animate(0.97)}
      onPressOut={() => animate(1)}
      onHoverIn={() => animate(1.015)}
      onHoverOut={() => animate(1)}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{inner}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    // Weiche Glas-Karte: transluzentes Weiß, damit der Ambient-Verlauf zart
    // durchscheint (subtiler Verlauf-Effekt) – statt flacher weißer Fläche.
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    // Schwebende Tiefe: weicher, großzügiger Schatten (nativ).
    ...shadow.card,
  },
  gradientCard: {
    // Auf farbigem Verlauf wirkt eine helle, transluzente Kante hochwertiger.
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  glassStrong: {
    // Optional noch transluzenter (z. B. über Bildern/Verläufen).
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(255,255,255,0.7)',
  },
  padded: { padding: spacing.lg, gap: spacing.sm },
});
