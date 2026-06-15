import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, touch } from './spacing';
import type { RelationshipCategory } from '@/types/models';

export { colors, typography, spacing, radius, touch };

export const theme = { colors, typography, spacing, radius, touch } as const;

/** Weiche Schatten für Karten. */
export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

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
