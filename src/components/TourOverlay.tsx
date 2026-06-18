import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Dimensions, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, spacing, radius, shadow } from '@/theme';
import { tourNavigate } from '@/navigation/navigationRef';
import { useTour, type Rect } from '@/context/TourContext';

const TAB_COUNT = 5;

type StepKind = 'target' | 'tab' | 'bell';
interface TourStep {
  emoji: string;
  title: string;
  text: string;
  kind: StepKind;
  targetId?: string;
  tabIndex?: number;
}

/** 14 Schritte – führt scrollend durch die Startseite und die untere Leiste. */
const STEPS: TourStep[] = [
  { emoji: '➕', title: 'Familie einladen', text: 'Lade Familie per Link oder QR-Code ein.', kind: 'target', targetId: 'invite' },
  { emoji: '❤️', title: 'Familienstatus', text: 'Teile mit einem Tipp, wie es dir geht.', kind: 'target', targetId: 'status' },
  { emoji: '📸', title: 'Familienmomente', text: 'Fotos und Momente mit deiner Familie teilen.', kind: 'target', targetId: 'moments' },
  { emoji: '🎤', title: 'Familienhistoriker', text: 'Bewahre die Geschichten deiner Familie.', kind: 'target', targetId: 'tile-HistorianHome' },
  { emoji: '📍', title: 'Familienkarte', text: 'Standorte freiwillig teilen und verbunden bleiben.', kind: 'target', targetId: 'tile-LiveMap' },
  { emoji: '📄', title: 'Dokumente', text: 'Wichtige Unterlagen sicher an einem Ort.', kind: 'target', targetId: 'tile-Documents' },
  { emoji: '🚨', title: 'SOS-Notruf', text: 'Im Notfall schnell Hilfe rufen.', kind: 'target', targetId: 'tile-Sos' },
  { emoji: '📅', title: 'Familienkalender', text: 'Geburtstage, Jahrestage und Events im Blick.', kind: 'target', targetId: 'tile-Calendar' },
  { emoji: '🔔', title: 'Benachrichtigungen', text: 'Neuigkeiten – antippen öffnet den Bereich.', kind: 'bell' },
  { emoji: '🏠', title: 'Start', text: 'Dein Zuhause: alles Wichtige auf einen Blick.', kind: 'tab', tabIndex: 0 },
  { emoji: '🌳', title: 'Familie', text: 'Hier findest du den Familienbaum.', kind: 'tab', tabIndex: 1 },
  { emoji: '📸', title: 'Erinnerungen', text: 'Fotos, Audios und Geschichten sammeln.', kind: 'tab', tabIndex: 2 },
  { emoji: '⏳', title: 'Zeitkapseln', text: 'Nachrichten für die Zukunft erstellen.', kind: 'tab', tabIndex: 3 },
  { emoji: '👤', title: 'Profil', text: 'Profil, Tarif & Einstellungen verwalten.', kind: 'tab', tabIndex: 4 },
];

export function TourOverlay({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { focus, measure } = useTour();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const finished = index >= STEPS.length;

  const { width, height } = Dimensions.get('window');
  const pulse = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  // Beim Start in die Startseite wechseln, damit die Karten sichtbar sind.
  useEffect(() => { tourNavigate('HomeTab', 'Home'); }, []);

  const tabBarH = 56 + Math.max(insets.bottom, 8);

  const computeRect = useCallback(async (i: number): Promise<Rect | null> => {
    const step = STEPS[i];
    if (!step) return null;
    if (step.kind === 'tab' && step.tabIndex != null) {
      const cx = ((step.tabIndex + 0.5) / TAB_COUNT) * width;
      const cy = height - tabBarH + 6 + 16;
      return { x: cx - 26, y: cy - 26, width: 52, height: 52 };
    }
    if (step.kind === 'bell') {
      return { x: width - 50, y: insets.top + 4, width: 40, height: 40 };
    }
    if (step.targetId) {
      const r = await focus(step.targetId, height * 0.34);
      return r ?? (await measure(step.targetId));
    }
    return null;
  }, [width, height, tabBarH, insets.top, focus, measure]);

  // Pro Schritt: Position bestimmen + sanft „einploppen".
  useEffect(() => {
    if (finished) return;
    let cancelled = false;
    setRect(null);
    computeRect(index).then((r) => {
      if (cancelled) return;
      setRect(r);
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, useNativeDriver: false, friction: 6, tension: 90 }).start();
    });
    return () => { cancelled = true; };
  }, [index, finished, computeRect, pop]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  function finish() { tourNavigate('HomeTab', 'Home'); onDone(); }
  const next = () => setIndex((i) => i + 1);
  const back = () => setIndex((i) => Math.max(0, i - 1));

  // ---- Abschlussbildschirm ----
  if (finished) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={finish}>
        <View style={[styles.dimFull, styles.center]}>
          <View style={styles.finishCard}>
            <View style={styles.finishEmoji}><AppText style={styles.bigEmoji}>🎉</AppText></View>
            <AppText variant="title" center>Du bist bereit.</AppText>
            <AppText variant="body" center color={colors.textSecondary}>Jetzt kannst du:</AppText>
            {['Familie einladen', 'Erinnerungen speichern', 'Zeitkapseln erstellen', 'Geschichten bewahren'].map((t) => (
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

  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  // Loch nur verwenden, wenn das Element wirklich sichtbar ist – sonst hängt
  // die Tour, falls die Messung (noch) keine brauchbare Position liefert.
  const pad = 8;
  const onScreen = !!rect && rect.y + rect.height > insets.top + 40 && rect.y < height - 40;
  const hole = rect && onScreen
    ? {
        x: Math.max(0, rect.x - pad),
        y: Math.max(0, rect.y - pad),
        w: rect.width + pad * 2,
        h: rect.height + pad * 2,
      }
    : null;
  const holeRadius = step.kind === 'tab' || step.kind === 'bell' ? (hole ? hole.h / 2 : 0) : radius.lg;

  // Sprechblase platzieren – immer in den sichtbaren Bereich geklemmt.
  const BUBBLE_H = 188;
  const bubbleW = Math.min(300, width - 2 * spacing.lg);
  const holeCenterX = hole ? hole.x + hole.w / 2 : width / 2;
  const bubbleLeft = Math.min(Math.max(holeCenterX - bubbleW / 2, spacing.lg), width - spacing.lg - bubbleW);
  const arrowLeft = Math.min(Math.max(holeCenterX - 8, bubbleLeft + 14), bubbleLeft + bubbleW - 30);

  const minTop = insets.top + 64;
  const maxTop = Math.max(minTop, height - tabBarH - BUBBLE_H - 16);
  const placeBelow = hole ? hole.y + hole.h < height * 0.5 : true;
  let bubbleTop: number;
  if (hole) bubbleTop = placeBelow ? hole.y + hole.h + 16 : hole.y - BUBBLE_H - 16;
  else bubbleTop = height * 0.4;
  bubbleTop = Math.min(Math.max(bubbleTop, minTop), maxTop);
  const showArrow = !!hole && bubbleTop > minTop && bubbleTop < maxTop;

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ringGlow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const bubbleScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Dezente Abdunklung – als 4 Flächen rund um das Loch (Karte bleibt hell) */}
        {hole ? (
          <>
            <View style={[styles.dim, { left: 0, top: 0, width, height: hole.y }]} />
            <View style={[styles.dim, { left: 0, top: hole.y + hole.h, width, height: Math.max(0, height - (hole.y + hole.h)) }]} />
            <View style={[styles.dim, { left: 0, top: hole.y, width: hole.x, height: hole.h }]} />
            <View style={[styles.dim, { left: hole.x + hole.w, top: hole.y, width: Math.max(0, width - (hole.x + hole.w)), height: hole.h }]} />
            {/* Glow-Rahmen um das Element (leichte Vergrößerung) */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glow,
                { left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: holeRadius, opacity: ringGlow, transform: [{ scale: ringScale }] },
              ]}
            />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
        )}

        {/* Kopf: Fortschritt + jederzeit „Tour überspringen" */}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
          <View style={styles.progressPill}>
            <AppText variant="caption" color={colors.textOnAccent}>Schritt {index + 1} von {STEPS.length}</AppText>
          </View>
          <Pressable onPress={finish} hitSlop={10} style={styles.skipPill}>
            <AppText variant="label" color={colors.textOnAccent}>Tour überspringen</AppText>
          </Pressable>
        </View>

        {/* Kleine Infoblase – wird IMMER gerendert, damit kein Schritt hängt */}
        <Animated.View
          style={[
            styles.bubble,
            { width: bubbleW, left: bubbleLeft, top: bubbleTop, opacity: pop, transform: [{ scale: bubbleScale }] },
          ]}
        >
          {showArrow && placeBelow ? <View style={[styles.arrowUp, { left: arrowLeft - bubbleLeft }]} /> : null}
          <View style={styles.bubbleHeader}>
            <AppText style={styles.bubbleEmoji}>{step.emoji}</AppText>
            <AppText variant="bodyStrong" style={styles.flex}>{step.title}</AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary}>{step.text}</AppText>
          <View style={styles.bubbleActions}>
            <View style={styles.dots}>
              {STEPS.map((s, i) => (
                <View key={s.title + i} style={[styles.dot, i === index ? styles.dotActive : null]} />
              ))}
            </View>
            <View style={styles.btnRow}>
              {index > 0 ? (
                <Pressable onPress={back} hitSlop={6} style={styles.ghostBtn}>
                  <AppText variant="label" color={colors.textSecondary}>Zurück</AppText>
                </Pressable>
              ) : null}
              <Pressable onPress={next} style={styles.nextBtn}>
                <AppText variant="button" color={colors.textOnAccent}>{last ? 'Fertig' : 'Weiter'}</AppText>
              </Pressable>
            </View>
          </View>
          {showArrow && !placeBelow ? <View style={[styles.arrowDown, { left: arrowLeft - bubbleLeft }]} /> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const DIM = 'rgba(34, 28, 22, 0.45)';

const styles = StyleSheet.create({
  dim: { position: 'absolute', backgroundColor: DIM },
  dimFull: { flex: 1, backgroundColor: 'rgba(34, 28, 22, 0.6)' },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  flex: { flex: 1 },

  glow: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 253, 249, 0.08)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },

  topBar: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  progressPill: { backgroundColor: colors.primaryDark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  skipPill: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },

  bubble: { position: 'absolute', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, ...shadow.floating },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bubbleEmoji: { fontSize: 20, lineHeight: 26 },
  bubbleActions: { marginTop: spacing.sm, gap: spacing.sm },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 16, backgroundColor: colors.primary },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
  ghostBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  nextBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: 40, justifyContent: 'center' },

  arrowUp: { position: 'absolute', top: -8, width: 16, height: 16, backgroundColor: colors.surface, transform: [{ rotate: '45deg' }] },
  arrowDown: { position: 'absolute', bottom: -8, width: 16, height: 16, backgroundColor: colors.surface, transform: [{ rotate: '45deg' }] },

  finishCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm, width: '100%', maxWidth: 420, ...shadow.floating },
  finishEmoji: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  bigEmoji: { fontSize: 40, lineHeight: 48 },
  finishRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  finishBtn: { marginTop: spacing.md, alignSelf: 'stretch', alignItems: 'center' },
});
