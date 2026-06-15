import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/lib/format';
import type { HistorianSource, WisdomCategory } from '@/historian/engine';

/** Icon je Quellenart (siehe Contract). */
const SOURCE_ICON: Record<
  HistorianSource['kind'],
  keyof typeof Ionicons.glyphMap
> = {
  person: 'person-circle-outline',
  memory: 'sparkles-outline',
  photo: 'image-outline',
  audio: 'mic-outline',
  time_capsule: 'time-outline',
};

/** Deutsche Beschriftung + Emoji je Lebensweisheit-Kategorie (siehe Contract). */
export const WISDOM_CATEGORY_LABEL: Record<WisdomCategory, string> = {
  liebe: 'Liebe ❤️',
  familie: 'Familie 👪',
  arbeit: 'Arbeit 🛠️',
  geld: 'Geld 💶',
  glueck: 'Glück 🍀',
  gesundheit: 'Gesundheit 🩺',
  sonstige: 'Sonstige ✨',
};

/** Reihenfolge der Kategorie-Filter-Chips. */
export const WISDOM_CATEGORIES: WisdomCategory[] = [
  'liebe',
  'familie',
  'arbeit',
  'geld',
  'glueck',
  'gesundheit',
  'sonstige',
];

interface SourceLineProps {
  source: HistorianSource;
  /** Datum anzeigen (· TT.MM.JJJJ), falls vorhanden. Standard: an. */
  showDate?: boolean;
}

/** Einzelne Quelle: Icon + Beschriftung (+ optional · Datum). */
export function SourceLine({ source, showDate = true }: SourceLineProps) {
  const dateSuffix =
    showDate && source.date ? ` · ${formatDate(source.date)}` : '';
  return (
    <View style={styles.sourceRow}>
      <Ionicons
        name={SOURCE_ICON[source.kind]}
        size={18}
        color={colors.textMuted}
        style={styles.sourceIcon}
      />
      <AppText
        variant="caption"
        color={colors.textMuted}
        style={styles.sourceText}
      >
        {source.label}
        {dateSuffix}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  sourceIcon: { marginTop: 1 },
  sourceText: { flex: 1 },
});
