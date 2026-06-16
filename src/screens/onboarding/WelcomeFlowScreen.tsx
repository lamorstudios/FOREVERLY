import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '@/components';
import { BRAND } from '@/lib/brand';
import { colors, spacing, radius } from '@/theme';

interface Slide {
  emoji: string;
  title: string;
  text: string;
  note?: string;
  accent: string;
}

const SLIDES: Slide[] = [
  { emoji: '❤️', title: 'Willkommen bei FAMII', text: 'Bewahre Erinnerungen, Geschichten und Familienmomente für kommende Generationen.', accent: colors.error },
  { emoji: '🌳', title: 'Familienbaum', text: 'Baue deinen Familienbaum auf und entdecke deine Familiengeschichte.', accent: colors.success },
  { emoji: '📸', title: 'Erinnerungen', text: 'Fotos, Videos, Sprachnachrichten und Geschichten an einem Ort.', accent: colors.relationMarried },
  { emoji: '⏳', title: 'Zeitkapseln', text: 'Erstelle Nachrichten für die Zukunft und öffne sie zu besonderen Momenten.', accent: colors.bronze },
  { emoji: '📍', title: 'Familienkarte', text: 'Bleibe mit deiner Familie verbunden und teile Standorte freiwillig.', note: 'Standortfreigabe ist immer optional.', accent: colors.relationAdoption },
  { emoji: '💛', title: 'Familiengeschichten bewahren', text: 'Frag Oma, solange du noch kannst – bewahre die Geschichten deiner Familie, bevor sie verloren gehen.', accent: colors.gold },
];

export function WelcomeFlowScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const last = index === SLIDES.length - 1;

  // Einblend-Animation pro Slide.
  const enter = useRef(new Animated.Value(0)).current;
  // Sanftes Schweben der Illustration (Endlos-Loop, web-tauglich).
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [index, enter]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const contentOpacity = enter;
  const contentY = enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const iconScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });

  function next() {
    if (last) onDone();
    else setIndex((i) => i + 1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={onDone} hitSlop={10} style={styles.skip}>
          <AppText variant="label" color={colors.textMuted}>{last ? '' : 'Überspringen'}</AppText>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Animated.View style={[styles.illustration, { backgroundColor: `${slide.accent}1A`, transform: [{ scale: iconScale }, { translateY: floatY }] }]}>
          <AppText style={styles.emoji}>{slide.emoji}</AppText>
        </Animated.View>

        <Animated.View style={[styles.textBlock, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
          <AppText variant="title" center>{slide.title}</AppText>
          {index === 0 ? (
            <AppText variant="bodyStrong" center color={colors.primaryDark}>{BRAND.slogan}</AppText>
          ) : null}
          <AppText variant="body" center color={colors.textSecondary} style={styles.text}>{slide.text}</AppText>
          {last ? (
            <AppText variant="caption" center color={colors.textMuted} style={styles.motto}>{BRAND.motto}</AppText>
          ) : null}
          {slide.note ? (
            <View style={styles.noteRow}>
              <AppText variant="caption" center color={colors.textMuted}>🔒 {slide.note}</AppText>
            </View>
          ) : null}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === index ? styles.dotActive : null]} />
          ))}
        </View>
        <Button label={last ? 'Loslegen' : 'Weiter'} icon={last ? 'sparkles-outline' : 'arrow-forward-outline'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  motto: { marginTop: spacing.xs, fontStyle: 'italic' },
  top: { height: 44, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: spacing.lg },
  skip: { padding: spacing.xs },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.xl },
  illustration: { width: 168, height: 168, borderRadius: 84, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 76, lineHeight: 88 },
  textBlock: { alignItems: 'center', gap: spacing.sm },
  text: { maxWidth: 320 },
  noteRow: { marginTop: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.primary },
});
