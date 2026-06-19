import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconChipProps {
  name: keyof typeof Ionicons.glyphMap;
  /** Füllfarbe des Containers (Default Primary-Blau). Icon ist immer weiß. */
  color?: string;
  /** Icon-Größe (Default 26). */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// App-weite Standard-Farben für Icon-Container.
const FILL = '#5B7CFF';

const webShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 6px 16px rgba(20,22,40,0.12)' } as unknown as ViewStyle)
    : null;

/**
 * Einheitlicher Icon-Container (App-weiter Standard): 56×56, Radius 18,
 * FARBIG GEFÜLLT mit weißem Icon + leichtem Schatten. Ersetzt graue/pastell
 * Icon-Kreise und Outline-Icons. Rein visuell – keine Logik.
 */
export function IconChip({ name, color = FILL, size = 26, style }: IconChipProps) {
  return (
    <View style={[styles.chip, { backgroundColor: color }, webShadow, style]}>
      <Ionicons name={name} size={size} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    // Leichter Schatten (nativ); Web exakt über webShadow.
    shadowColor: '#1E2233',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
});
