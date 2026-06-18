import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, touch } from './spacing';
import type { RelationshipCategory } from '@/types/models';

export { colors, typography, spacing, radius, touch };
export { useResponsive, responsive, breakpoints } from './responsive';
export type { ResponsiveInfo } from './responsive';

export const theme = { colors, typography, spacing, radius, touch } as const;

/**
 * Verlaufs-Presets für eine emotionale, hochwertige Tiefe (Apple Health /
 * Google Photos / Airbnb). Tupel aus Hex-Stops für expo-linear-gradient.
 */
export const gradients = {
  // Hauptverlauf / Primary-Buttons (Mockup): Pink -> Lila -> Blau (sichtbar, 90°)
  brand: ['#F28FD6', '#B48FFF', '#6F8CFF'] as const,
  // Hero-Karte (Mockup, 135°): Pink -> Lila -> Blau
  hero: ['#F7A8D8', '#B48FFF', '#7EA2FF'] as const,
  heroIndigo: ['#5B6CFF', '#7B74FF'] as const,
  heroViolet: ['#8C7BFF', '#6473FF'] as const,
  // Heller, ruhiger Seitenhintergrund – flach (#FAFAFC), kein Seiten-Gradient.
  page: ['#FAFAFC', '#FAFAFC'] as const,
  // Weiche, helle Hero-Fläche (Glas-Optik-Basis)
  brandSoft: ['#EEF0FF', '#F1ECFF'] as const,
  warm: ['#FFC58A', '#FF9F5A'] as const,
  success: ['#5BC196', '#3F9E97'] as const,
  danger: ['#F2697A', '#E0455A'] as const,
  // Glas-Overlay (halbtransparentes Weiß für Glassmorphism)
  glass: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.55)'] as const,
} as const;

export type GradientName = keyof typeof gradients;

/** Weiche, großzügige Schatten (kühles Tintenblau) für ein hochwertiges Gefühl. */
export const shadow = {
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 5,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 10,
  },
} as const;

/** Hex-Farbe in rgba mit Deckkraft umwandeln (für sanfte Tönungen). */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Farbe für eine Beziehungs-Kategorie. */
export function relationshipColor(category: RelationshipCategory): string {
  switch (category) {
    case 'biological':
      return colors.relationBiological;
    case 'married':
      return colors.relationMarried;
    case 'patchwork':
      return colors.relationPatchwork;
    case 'adoption':
      return colors.relationAdoption;
    default:
      return colors.textMuted;
  }
}
