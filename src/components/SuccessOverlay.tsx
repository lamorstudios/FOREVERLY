import { createContext, useContext, useCallback, useRef, useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SuccessContextValue {
  /** Zeigt eine kurze Erfolgs-Animation mit Text (Default: „Erledigt"). */
  show: (message?: string) => void;
}

const SuccessContext = createContext<SuccessContextValue>({ show: () => undefined });

/** Hook für Erfolgs-Feedback – appweit wiederverwendbar. */
export function useSuccess(): SuccessContextValue {
  return useContext(SuccessContext);
}

// Dezentes Konfetti im Foreverly-Verlauf. Feste Streuung -> ruhig, nicht kitschig.
const GRADIENT = ['#5B7CFF', '#A16CFF', '#FFB86C'] as const;
const CONFETTI: { color: string; dx: number; dy: number; delay: number }[] = [
  { color: '#5B7CFF', dx: -70, dy: -38, delay: 0 },
  { color: '#A16CFF', dx: -44, dy: -64, delay: 20 },
  { color: '#FFB86C', dx: -12, dy: -72, delay: 0 },
  { color: '#5B7CFF', dx: 20, dy: -68, delay: 40 },
  { color: '#A16CFF', dx: 50, dy: -52, delay: 10 },
  { color: '#FFB86C', dx: 74, dy: -30, delay: 30 },
  { color: '#A16CFF', dx: -60, dy: 6, delay: 20 },
  { color: '#FFB86C', dx: 64, dy: 10, delay: 0 },
];

/**
 * Stellt eine kurze, dezente Erfolgs-Animation bereit (Toast + Konfetti).
 * Nicht-blockierend (pointerEvents none), kein Fullscreen-Overlay, kein
 * Layout-Shift. Verschwindet automatisch nach ~1,8 s.
 */
export function SuccessProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('Erledigt');
  const [shown, setShown] = useState(false);
  const op = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg = 'Erledigt') => {
      setMessage(msg);
      setShown(true);
      op.setValue(0);
      pop.setValue(0);
      burst.setValue(0);
      Animated.parallel([
        Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.spring(pop, { toValue: 1, friction: 6, tension: 130, useNativeDriver: false }),
        Animated.timing(burst, { toValue: 1, duration: 950, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      ]).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(op, { toValue: 0, duration: 260, useNativeDriver: false }).start(({ finished }) => {
          if (finished) setShown(false);
        });
      }, 1700);
    },
    [op, pop, burst],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const cardScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });

  return (
    <SuccessContext.Provider value={{ show }}>
      <View style={styles.flex}>
        {children}
        {shown ? (
          <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 56 }]}>
            <View style={styles.center}>
              {CONFETTI.map((c, i) => {
                const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, c.dx] });
                const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, c.dy] });
                const o = burst.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] });
                return (
                  <Animated.View
                    key={i}
                    style={[styles.dot, { backgroundColor: c.color, opacity: o, transform: [{ translateX: tx }, { translateY: ty }, { scale: pop }] }]}
                  />
                );
              })}
            </View>
            <Animated.View style={[styles.card, { opacity: op, transform: [{ scale: cardScale }] }]}>
              <LinearGradient colors={GRADIENT as unknown as readonly [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.text} numberOfLines={1}>{message}</Text>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </SuccessContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  center: { position: 'absolute', top: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 18,
    shadowColor: '#1E2233',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, fontWeight: '700', color: '#1F2230' },
});
