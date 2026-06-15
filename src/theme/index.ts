import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, touch } from './spacing';
import type { RelationshipCategory } from '@/types/models';

export { colors, typography, spacing, radius, touch };
export { useResponsive, responsive, breakpoints } from './responsive';
export type { ResponsiveInfo } from './responsive';

export const theme = { colors, typography, spacing, radius, touch } as const;

/** Weiche, großzügige Schatten für ein hochwertiges, ruhiges Gefühl. */
export const shadow = {
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
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
