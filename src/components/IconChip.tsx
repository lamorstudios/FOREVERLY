import { StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface IconChipProps {
  name: keyof typeof Ionicons.glyphMap;
  /** Icon-Farbe (Default Primary-Blau). Für Semantik: Warnung/Highlight/Erfolg. */
  color?: string;
  /** Icon-Größe (Default 26). */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const PRIMARY = '#5B7CFF';
// Einheitlicher Verlaufs-Container (Blau -> Violett, sehr dezent).
const CHIP_GRADIENT = ['rgba(91,124,255,0.14)', 'rgba(161,108,255,0.08)'] as const;

const webShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 8px 24px rgba(91,124,255,0.08)' } as unknown as ViewStyle)
    : null;

/**
 * Einheitlicher, hochwertiger Icon-Container (App-weiter Standard).
 * 60×60, Radius 20, weicher Blau→Violett-Verlauf + dezenter Schatten.
 * Ersetzt graue/pastellfarbene Icon-Kreise. Rein visuell – keine Logik.
 */
export function IconChip({ name, color = PRIMARY, size = 26, style }: IconChipProps) {
  return (
    <LinearGradient
      colors={CHIP_GRADIENT as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.chip, webShadow, style]}
    >
      <Ionicons name={name} size={size} color={color} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Nativer Schatten (Web exakt über webShadow).
    shadowColor: '#5B7CFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 2,
  },
});
