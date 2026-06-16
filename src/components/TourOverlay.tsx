import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Dimensions, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, spacing, radius, shadow } from '@/theme';
import { tourNavigate } from '@/navigation/navigationRef';

const TAB_COUNT = 5;

interface TourStep {
  emoji: string;
  title: string;
  text: string;
  /** Interaktions-Hinweis („Tippe hier …", „Öffne …"). */
  hint: string;
  /** Tatsächliches Navigationsziel – die Tour öffnet diesen Bereich wirklich. */
  tab: string;
  screen: string;
  /** Falls gesetzt: passenden Bottom-Tab per Spotlight hervorheben. */
  tabIndex?: number;
}

/** 12 Schritte – führt aktiv durch die wichtigsten Bereiche der App. */
const STEPS: TourStep[] = [
  { emoji: '🌳', title: 'Familienbaum', text: 'Hier siehst du deine Familie und ihre Verbindungen über Generationen.', hint: 'Unten im Tab „Familie" findest du den Stammbaum.', tab: 'FamilyTab', screen: 'Network', tabIndex: 1 },
  { emoji: '➕', title: 'Familienmitglied einladen', text: 'Lade Familie ganz einfach per Link oder QR-Code ein – ein Tipp genügt.', hint: 'Öffne „Einladen" und teile den Link.', tab: 'FamilyTab', screen: 'SmartInvite', tabIndex: 1 },
  { emoji: '📸', title: 'Familienmomente', text: 'Teile Fotos, kurze Videos und Momente mit deiner Familie.', hint: 'Sieh dir den Familienfeed an.', tab: 'HomeTab', screen: 'MomentsHome' },
  { emoji: '🎤', title: 'Familienhistoriker', text: 'Stell Fragen zu eurer Familiengeschichte – Antworten aus euren echten Erinnerungen.', hint: 'Tippe auf eine Frage, um loszulegen.', tab: 'HomeTab', screen: 'HistorianHome' },
  { emoji: '⏳', title: 'Zeitkapseln', text: 'Schreibe Nachrichten für die Zukunft, die sich zu besonderen Momenten öffnen.', hint: 'Im Tab „Zeitkapseln" erstellst du eine neue Kapsel.', tab: 'CapsulesTab', screen: 'CapsuleList', tabIndex: 3 },
  { emoji: '📍', title: 'Familienkarte', text: 'Bleibt verbunden und teilt Standorte – immer freiwillig.', hint: 'Öffne die Karte, um zu sehen, wer teilt.', tab: 'HomeTab', screen: 'LiveMap' },
  { emoji: '📄', title: 'Dokumente', text: 'Bewahrt wichtige Dokumente sicher an einem Ort – nur Hinweise, keine sensiblen Daten.', hint: 'Sieh dir den Dokumententresor an.', tab: 'HomeTab', screen: 'Documents' },
  { emoji: '🚨', title: 'SOS-Notruf', text: 'Im Notfall schnell Hilfe rufen und den Standort mit der Familie teilen.', hint: 'Hier startest du im Ernstfall den Notruf.', tab: 'HomeTab', screen: 'Sos' },
  { emoji: '🔔', title: 'Benachrichtigungen', text: 'Alle Neuigkeiten aus deiner Familie – antippen öffnet direkt den Bereich.', hint: 'Tippe eine Nachricht an, um sie zu öffnen.', tab: 'HomeTab', screen: 'Notifications' },
  { emoji: '👤', title: 'Profil', text: 'Verwalte dein Profil, Tarif, Einstellungen und die Einführung.', hint: 'Unten rechts im Tab „Profil".', tab: 'ProfileTab', screen: 'Profile', tabIndex: 4 },
  { emoji: '❤️', title: 'Familienstatus', text: 'Teile mit einem Tipp, wie es dir geht – deine Familie sieht es liebevoll.', hint: 'Setze deinen ersten Status.', tab: 'HomeTab', screen: 'Status' },
  { emoji: '📅', title: 'Familienkalender', text: 'Geburtstage, Jahrestage und Events an einem Ort – nichts geht verloren.', hint: 'Sieh dir die anstehenden Termine an.', tab: 'HomeTab', screen: 'Calendar' },
];

export function TourOverlay({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const finished = index >= STEPS.length; // letzter „Abschluss"-Screen
  const step = STEPS[index];

  const { width, height } = Dimensions.get('window');
  const pulse = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  // Beim Schritt wechseln: tatsächlich in den Bereich navigieren.
  useEffect(() => {
    if (step) tourNavigate(step.tab, step.screen);
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function finish() {
    tourNavigate('HomeTab', 'Home');
    onDone();
  }
  function next() {
    setIndex((i) => i + 1);
  }
  function back() {
    setIndex((i) => Math.max(0, i - 1));
  }

  const cardOpacity = enter;
  const cardY = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  const tabBarH = 56 + Math.max(insets.bottom, 8);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  // ---- Abschlussbildschirm ----
  if (finished) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={finish}>
        <View style={[styles.backdrop, styles.center]}>
          <View style={styles.finishCard}>
            <View style={styles.finishEmoji}><AppText style={styles.bigEmoji}>🎉</AppText></View>
            <AppText variant="title" center>Du bist bereit.</AppText>
            <AppText variant="body" center color={colors.textSecondary}>Jetzt kannst du:</AppText>
            {['Familie einladen', 'Erinnerungen speichern', 'Zeitkapseln erstellen', 'Familiengeschichte bewahren'].map((t) => (
              <View key={t} style={styles.finishRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <AppText variant="body" style={styles.flex}>{t}</AppText>
              </View>
            ))}
            <Pressable onPress={finish} style={[styles.nextBtn, styles.finishBtn]}>
              <AppText variant="button" color={colors.textOnAccent}>Los geht's</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const s = step!;
  const last = index === STEPS.length - 1;
  const ringX = s.tabIndex != null ? ((s.tabIndex + 0.5) / TAB_COUNT) * width : null;
  const RING = 70;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.backdrop}>
        {/* Kopf: Fortschritt + jederzeit „Tour überspringen" */}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.progressPill}>
            <AppText variant="caption" color={colors.textOnAccent}>Schritt {index + 1} von {STEPS.length}</AppText>
          </View>
          <Pressable onPress={finish} hitSlop={10} style={styles.skipPill}>
            <AppText variant="label" color={colors.textOnAccent}>Tour überspringen</AppText>
          </Pressable>
        </View>

        {/* „Du siehst gerade …" – zeigt, dass dieser Bereich geöffnet wurde */}
        <View style={styles.hereWrap}>
          <View style={styles.herePill}>
            <AppText variant="caption" color={colors.textOnAccent}>{s.emoji}  Du siehst gerade: {s.title}</AppText>
          </View>
        </View>

        {/* Spotlight-Ring über dem passenden Tab (sofern relevant) */}
        {ringX != null ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: RING, height: RING, borderRadius: RING / 2,
                left: ringX - RING / 2, top: height - tabBarH / 2 - RING / 2,
                opacity: ringOpacity, transform: [{ scale: ringScale }],
              },
            ]}
          />
        ) : null}

        {/* Coach-Karte über der unteren Leiste */}
        <Animated.View style={[styles.card, { bottom: tabBarH + spacing.md, opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}><AppText style={styles.emoji}>{s.emoji}</AppText></View>
            <View style={styles.flex}>
              <AppText variant="subheading">{s.title}</AppText>
            </View>
          </View>
          <AppText variant="body" color={colors.textSecondary}>{s.text}</AppText>
          <View style={styles.hintRow}>
            <Ionicons name="hand-left-outline" size={16} color={colors.bronze} />
            <AppText variant="caption" color={colors.bronze} style={styles.flex}>{s.hint}</AppText>
          </View>

          <View style={styles.dots}>
            {STEPS.map((st, i) => (
              <View key={st.title} style={[styles.dot, i === index ? styles.dotActive : null]} />
            ))}
          </View>

          <View style={styles.actions}>
            {index > 0 ? (
              <Pressable onPress={back} hitSlop={8} style={styles.ghostBtn}>
                <AppText variant="label" color={colors.textSecondary}>Zurück</AppText>
              </Pressable>
            ) : <View />}
            <Pressable onPress={next} style={styles.nextBtn}>
              <AppText variant="button" color={colors.textOnAccent}>{last ? 'Abschließen' : 'Weiter'}</AppText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(34, 28, 22, 0.55)' },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  flex: { flex: 1 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  progressPill: { backgroundColor: colors.primaryDark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  skipPill: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },

  hereWrap: { alignItems: 'center', marginTop: spacing.sm },
  herePill: { backgroundColor: colors.bronze, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },

  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 253, 249, 0.18)',
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22, lineHeight: 28 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: spacing.md },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  ghostBtn: { padding: spacing.sm },
  nextBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' },

  // Abschluss
  finishCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm, width: '100%', maxWidth: 420, ...shadow.floating },
  finishEmoji: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  bigEmoji: { fontSize: 40, lineHeight: 48 },
  finishRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  finishBtn: { marginTop: spacing.md, alignSelf: 'stretch', alignItems: 'center' },
});
