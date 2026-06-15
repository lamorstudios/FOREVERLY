import { ReactNode, useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AppearProps {
  children: ReactNode;
  /** Verzögerung in ms (für sanftes Staffeln mehrerer Elemente). */
  delay?: number;
  style?: ViewStyle;
}

/**
 * Dezente Einblend-Animation (Fade + leichtes Aufsteigen) beim Mounten.
 * Sorgt für ein ruhiges, hochwertiges „Hereingleiten" der Inhalte.
 */
export function Appear({ children, delay = 0, style }: AppearProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
