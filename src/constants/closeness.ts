import { colors } from '@/theme';
import type {
  ClosenessLevel,
  VisibilityLevel,
  RelationshipType,
} from '@/types/models';

export interface ClosenessMeta {
  level: ClosenessLevel;
  emoji: string;
  label: string;
  description: string;
  color: string;
  rank: number; // höher = näher
}

export const CLOSENESS_LEVELS: Record<ClosenessLevel, ClosenessMeta> = {
  inner: { level: 'inner', emoji: '❤️', label: 'Inner Circle', description: 'Engste Familie', color: colors.error, rank: 4 },
  sehr_nah: { level: 'sehr_nah', emoji: '💛', label: 'Sehr nah', description: 'Sehr nahe Familie', color: colors.gold, rank: 3 },
  familie: { level: 'familie', emoji: '💙', label: 'Familie', description: 'Normale Familienmitglieder', color: colors.relationMarried, rank: 2 },
  erweitert: { level: 'erweitert', emoji: '🤍', label: 'Erweiterter Kreis', description: 'Angeheiratete & entfernte Verwandte', color: colors.textMuted, rank: 1 },
};

export const CLOSENESS_ORDER: ClosenessLevel[] = ['inner', 'sehr_nah', 'familie', 'erweitert'];

export function closenessRank(level: ClosenessLevel | null | undefined): number {
  return level ? CLOSENESS_LEVELS[level].rank : 0;
}

export interface VisibilityMeta {
  level: VisibilityLevel;
  emoji: string;
  label: string;
}

export const VISIBILITY_LEVELS: Record<VisibilityLevel, VisibilityMeta> = {
  family: { level: 'family', emoji: '🌍', label: 'Ganze Familie' },
  inner: { level: 'inner', emoji: '❤️', label: 'Nur Inner Circle' },
  sehr_nah: { level: 'sehr_nah', emoji: '💛', label: 'Sehr nahe Familie' },
  selected: { level: 'selected', emoji: '👥', label: 'Ausgewählte Personen' },
  branch: { level: 'branch', emoji: '🌿', label: 'Familienzweig' },
  private: { level: 'private', emoji: '🔒', label: 'Privat' },
};

/** Sichtbarkeitsstufen, die rein über die Familiennähe steuerbar sind. */
export const LEVEL_VISIBILITY_OPTIONS: VisibilityLevel[] = [
  'family',
  'sehr_nah',
  'inner',
  'private',
];

/**
 * Demonstriert, ob ein Inhalt mit gegebener Sichtbarkeit für eine Person
 * mit gegebenem Nähegrad sichtbar wäre (vereinfachtes Modell für die Vorschau).
 * 'selected'/'branch' werden hier (rein nähebasiert) als nicht sichtbar gewertet.
 */
export function isVisibleAtCloseness(
  visibility: VisibilityLevel,
  viewerCloseness: ClosenessLevel,
): boolean {
  const r = CLOSENESS_LEVELS[viewerCloseness].rank;
  switch (visibility) {
    case 'family':
      return true;
    case 'sehr_nah':
      return r >= 3;
    case 'inner':
      return r >= 4;
    case 'private':
      return false;
    case 'selected':
    case 'branch':
      return false;
  }
}

/** Vorschlag für die Nähe anhand des Beziehungstyps (nur Vorschlag, individuell änderbar). */
export const SUGGESTED_CLOSENESS: Partial<Record<RelationshipType, ClosenessLevel>> = {
  vater: 'inner',
  mutter: 'inner',
  sohn: 'inner',
  tochter: 'inner',
  bruder: 'inner',
  schwester: 'inner',
  stiefvater: 'inner',
  stiefmutter: 'inner',
  stiefkind: 'inner',
  oma: 'sehr_nah',
  opa: 'sehr_nah',
  tante: 'sehr_nah',
  onkel: 'sehr_nah',
  cousin: 'familie',
  cousine: 'familie',
  ehepartner: 'inner',
  lebenspartner: 'inner',
  adoptivkind: 'inner',
  pflegekind: 'sehr_nah',
  sonstige: 'erweitert',
};
