import { Fragment } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, EmptyState, Loading } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { getChronicle } from '@/api/chronicle';
import { qk } from '@/api/queryKeys';
import { formatDate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { ChronicleEntry } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Chronik'>;

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  event: 'calendar',
  memory: 'sparkles',
  birth: 'happy',
  death: 'flower',
};

export function ChronikScreen(_props: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: qk.chronicle(familyId),
    queryFn: () => getChronicle(familyId),
  });

  if (isLoading) return <Loading message="Chronik wird erstellt …" />;

  const entries = data ?? [];
  // nach Jahr gruppieren (absteigend)
  const years = [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a);
  const byYear: Record<number, ChronicleEntry[]> = {};
  for (const e of entries) (byYear[e.year] ??= []).push(e);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <View style={styles.intro}>
        <AppText variant="heading">Familienchronik</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Alle Ereignisse eurer Familie – automatisch chronologisch sortiert.
        </AppText>
      </View>

      {entries.length === 0 ? (
        <EmptyState icon="time-outline" title="Noch keine Chronik" message="Erstellt Events und Erinnerungen – sie erscheinen hier." />
      ) : (
        years.map((year) => (
          <Fragment key={year}>
            <View style={styles.yearRow}>
              <View style={styles.yearBadge}>
                <AppText variant="subheading" color={colors.textOnAccent}>
                  {year}
                </AppText>
              </View>
              <View style={styles.line} />
            </View>
            {byYear[year]!.map((e) => (
              <Card key={e.id} style={styles.entry}>
                <View style={styles.entryRow}>
                  <View style={styles.entryIcon}>
                    <Ionicons name={ICON[e.source_type] ?? 'ellipse'} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.entryText}>
                    <AppText variant="bodyStrong">{e.title}</AppText>
                    {e.date ? (
                      <AppText variant="caption" color={colors.textMuted}>
                        {formatDate(e.date)}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))}
          </Fragment>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  yearBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  entry: { marginTop: spacing.sm },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryText: { flex: 1, gap: 2 },
});
