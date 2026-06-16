import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Dimensions, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, spacing, radius, shadow } from '@/theme';

type Pointer = { type: 'tab'; tabIndex: number } | { type: 'top' };

interface TourStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  pointer: Pointer;
}

const TAB_COUNT = 5;

const STEPS: TourStep[] = [
  { icon: 'git-network-outline', title: 'Familienbaum', text: 'Hier findest du deine Familie und ihre Verbindungen.', pointer: { type: 'tab', tabIndex: 1 } },
  { icon: 'person-add-outline', title: 'Familie einladen', text: 'Lade Familie per Link oder QR-Code ein.', pointer: { type: 'top' } },
  { icon: 'time-outline', title: 'Zeitkapseln', text: 'Speichere Nachrichten für die Zukunft.', pointer: { type: 'tab', tabIndex: 3 } },
  { icon: 'images-outline', title: 'Familienmomente', text: 'Teile Erinnerungen mit deiner Familie.', pointer: { type: 'top' } },
  { icon: 'person-outline', title: 'Profil', text: 'Verwalte dein Profil und deine Einstellungen.', pointer: { type: 'tab', tabIndex: 4 } },
];

export function TourOverlay({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  const { width, height } = Dimensions.get('window');
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Position des Highlight-Rings je nach Ziel.
  const tabBarH = 56 + Math.max(insets.bottom, 8);
  const ring = step.pointer.type === 'tab'
    ? { x: ((step.pointer.tabIndex + 0.5) / TAB_COUNT) * width, y: height - tabBarH / 2 }
    : { x: width / 2, y: insets.top + 120 };
  const RING = 72;
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  // Coach-Karte oberhalb der unteren Leiste bzw. mittig.
  const cardBottom = step.pointer.type === 'tab' ? tabBarH + spacing.lg : undefined;

  function next() {
    if (last) onDone();
    else setIndex((i) => i + 1);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        {/* Highlight-Ring über dem relevanten Element */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: RING, height: RING, borderRadius: RING / 2,
              left: ring.x - RING / 2, top: ring.y - RING / 2,
              opacity: ringOpacity, transform: [{ scale: ringScale }],
            },
          ]}
        >
          <Ionicons name={step.icon} size={30} color={colors.gold} />
        </Animated.View>

        {/* Coach-Karte */}
        <View style={[styles.card, cardBottom != null ? { bottom: cardBottom } : styles.cardCenter]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name={step.icon} size={22} color={colors.primary} />
            </View>
            <AppText variant="caption" color={colors.textMuted}>Schritt {index + 1} von {STEPS.length}</AppText>
          </View>
          <AppText variant="subheading">{step.title}</AppText>
          <AppText variant="body" color={colors.textSecondary}>{step.text}</AppText>

          <View style={styles.dots}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.dot, i === index ? styles.dotActive : null]} />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onDone} hitSlop={8} style={styles.skip}>
              <AppText variant="label" color={colors.textMuted}>Tour beenden</AppText>
            </Pressable>
            <Pressable onPress={next} style={styles.nextBtn}>
              <AppText variant="button" color={colors.textOnAccent}>{last ? 'Fertig' : 'Weiter'}</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(34, 28, 22, 0.66)' },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 253, 249, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.floating,
  },
  cardCenter: { top: '38%' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  skip: { padding: spacing.xs },
  nextBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' },
});
