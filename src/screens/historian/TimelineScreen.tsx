import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, AppText, EmptyState, Loading } from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { getTimeline } from '@/api/historian';
import { useFamily } from '@/context/FamilyContext';
import type { HistorianStackParamList } from '@/navigation/types';
import { SourceLine } from './_shared';

export function TimelineScreen(
  _props: NativeStackScreenProps<HistorianStackParamList, 'Timeline'>,
) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const timelineQuery = useQuery({
    queryKey: qk.timeline(familyId),
    queryFn: () => getTimeline(familyId),
  });

  if (timelineQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Zeitleiste wird erstellt …" />
      </Screen>
    );
  }

  const entries = timelineQuery.data ?? [];

  return (
    <Screen
      refreshing={timelineQuery.isFetching}
      onRefresh={() => timelineQuery.refetch()}
    >
      <AppText variant="display">Ereignis-Zeitleiste</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Die wichtigsten Ereignisse eurer Familie in zeitlicher Reihenfolge.
      </AppText>

      {entries.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Noch keine Ereignisse"
          message="Sobald ihr Geburtsdaten oder datierte Erinnerungen hinterlegt, erscheint hier eure Familien-Zeitleiste."
        />
      ) : (
        <View style={styles.timeline}>
          {entries.map((entry, index) => {
            const isLast = index === entries.length - 1;
            return (
              <View key={entry.id} style={styles.row}>
                <View style={styles.rail}>
                  <View style={styles.dot} />
                  {!isLast ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.content}>
                  <View style={styles.yearBadge}>
                    <AppText variant="label" color={colors.primaryDark}>
                      {entry.year}
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">{entry.label}</AppText>
                  <SourceLine source={entry.source} showDate={false} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timeline: { marginTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 24, alignItems: 'center' },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primarySoft,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  yearBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
});
