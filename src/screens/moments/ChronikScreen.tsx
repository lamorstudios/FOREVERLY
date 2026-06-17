import { Fragment } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button, EmptyState, Loading } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { getChronicle, getFamilyStory } from '@/api/chronicle';
import { qk } from '@/api/queryKeys';
import { formatDate } from '@/lib/format';
import { colors, radius, spacing, withAlpha } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { ChronicleEntry } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Chronik'>;

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  event: 'calendar-outline',
  memory: 'sparkles-outline',
  birth: 'happy-outline',
  death: 'flower-outline',
  capsule: 'hourglass-outline',
};

export function ChronikScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const chronicleQuery = useQuery({
    queryKey: qk.chronicle(familyId),
    queryFn: () => getChronicle(familyId),
  });
  const storyQuery = useQuery({
    queryKey: qk.familyStory(familyId),
    queryFn: () => getFamilyStory(familyId),
  });

  function addFirstMemory() {
    const parent = navigation.getParent() as
      | { navigate: (name: string, params?: object) => void }
      | undefined;
    parent?.navigate('MemoriesTab', { screen: 'MemoryForm' });
  }

  if (chronicleQuery.isLoading) return <Loading message="Eure Chronik wird zusammengestellt …" />;

  const entries = chronicleQuery.data ?? [];
  const story = storyQuery.data;
  const refetch = () => {
    chronicleQuery.refetch();
    storyQuery.refetch();
  };

  // nach Jahr gruppieren (absteigend – Zukunft/heute zuerst)
  const years = [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a);
  const byYear: Record<number, ChronicleEntry[]> = {};
  for (const e of entries) (byYear[e.year] ??= []).push(e);

  return (
    <Screen onRefresh={refetch} refreshing={chronicleQuery.isRefetching || storyQuery.isRefetching}>
      <View style={styles.intro}>
        <AppText variant="heading">Familienchronik</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Eure Erinnerungen, Fotos, Ereignisse und Ehrenmitglieder – vom
          Familienhistoriker zu einer Geschichte zusammengeführt.
        </AppText>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="book-outline"
            title="Eure Chronik beginnt hier"
            message="Jede Familie schreibt Geschichte. Füge Erinnerungen hinzu und FAMII erstellt daraus eure Chronik für kommende Generationen."
          />
          <Button label="Erste Erinnerung hinzufügen" icon="add-circle-outline" onPress={addFirstMemory} style={styles.emptyBtn} />
        </View>
      ) : (
        <>
          {/* Familienhistoriker – lesbare Zusammenfassung */}
          {story && story.paragraphs.length > 0 ? (
            <Card style={styles.storyCard}>
              <View style={styles.storyHead}>
                <View style={styles.storyIcon}>
                  <Ionicons name="book-outline" size={20} color={colors.bronze} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">Eure Familiengeschichte</AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    Vom Familienhistoriker zusammengestellt
                  </AppText>
                </View>
              </View>
              {story.paragraphs.map((p, i) => (
                <AppText key={i} variant="body" color={colors.textSecondary} style={styles.storyText}>
                  {p}
                </AppText>
              ))}
            </Card>
          ) : null}

          {/* Zeitleiste nach Jahren */}
          {years.map((year) => (
            <Fragment key={year}>
              <View style={styles.yearRow}>
                <View style={styles.yearBadge}>
                  <AppText variant="subheading" color={colors.textOnAccent}>{year}</AppText>
                </View>
                <View style={styles.line} />
              </View>
              {byYear[year]!.map((e) => {
                const memorial = e.source_type === 'death';
                return (
                  <Card key={e.id} style={styles.entry}>
                    <View style={styles.entryRow}>
                      <View style={[styles.entryIcon, memorial && styles.entryIconMemorial]}>
                        <Ionicons
                          name={ICON[e.source_type] ?? 'ellipse-outline'}
                          size={18}
                          color={memorial ? colors.bronze : colors.primary}
                        />
                      </View>
                      <View style={styles.entryText}>
                        <AppText variant="bodyStrong">{e.title}</AppText>
                        {e.date ? (
                          <AppText variant="caption" color={colors.textMuted}>{formatDate(e.date)}</AppText>
                        ) : null}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </Fragment>
          ))}

          <AppText variant="caption" center color={colors.textMuted} style={styles.footer}>
            FAMII führt eure Familiengeschichte automatisch zusammen – für kommende Generationen. 💛
          </AppText>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  emptyWrap: { gap: spacing.md, marginTop: spacing.xl },
  emptyBtn: { marginTop: spacing.sm },

  storyCard: { gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.warmWhite, borderColor: colors.goldSoft, borderWidth: 1.5 },
  storyHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  storyIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: withAlpha(colors.gold, 0.16),
    alignItems: 'center', justifyContent: 'center',
  },
  storyText: { lineHeight: 24 },

  yearRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  yearBadge: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  entry: { marginTop: spacing.sm },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  entryIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  entryIconMemorial: { backgroundColor: colors.goldSoft },
  entryText: { flex: 1, gap: 2 },
  footer: { marginTop: spacing.xl },
});
