import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, AppText, Card, Chip, EmptyState, Loading } from '@/components';
import { colors, spacing } from '@/theme';
import { qk } from '@/api/queryKeys';
import { getWisdoms } from '@/api/historian';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { WisdomCategory } from '@/historian/engine';
import {
  SourceLine,
  WISDOM_CATEGORIES,
  WISDOM_CATEGORY_LABEL,
} from './_shared';

type Filter = WisdomCategory | 'alle';

export function WisdomsScreen(
  _props: NativeStackScreenProps<HomeStackParamList, 'Wisdoms'>,
) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const [filter, setFilter] = useState<Filter>('alle');

  const wisdomsQuery = useQuery({
    queryKey: qk.wisdoms(familyId),
    queryFn: () => getWisdoms(familyId),
  });

  if (wisdomsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Lebensweisheiten werden gesammelt …" />
      </Screen>
    );
  }

  const wisdoms = wisdomsQuery.data ?? [];
  const visible =
    filter === 'alle' ? wisdoms : wisdoms.filter((w) => w.category === filter);

  return (
    <Screen
      refreshing={wisdomsQuery.isFetching}
      onRefresh={() => wisdomsQuery.refetch()}
    >
      <AppText variant="display">Lebensweisheiten</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Automatisch aus euren Familiendaten gesammelt.
      </AppText>

      {wisdoms.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            label="Alle"
            selected={filter === 'alle'}
            onPress={() => setFilter('alle')}
          />
          {WISDOM_CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={WISDOM_CATEGORY_LABEL[category]}
              selected={filter === category}
              onPress={() => setFilter(category)}
            />
          ))}
        </ScrollView>
      ) : null}

      {wisdoms.length === 0 ? (
        <EmptyState
          icon="bulb-outline"
          title="Noch keine Lebensweisheiten gefunden"
          message="Sobald ihr Erinnerungen, Profile oder Aufnahmen hinzufügt, sammelt der Historiker hier eure Familienweisheiten."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="filter-outline"
          title="Keine Weisheiten in dieser Kategorie"
          message="Wählt eine andere Kategorie oder „Alle“."
        />
      ) : (
        <View style={styles.list}>
          {visible.map((wisdom) => (
            <Card key={wisdom.id}>
              <View style={styles.chipRow}>
                <Chip label={WISDOM_CATEGORY_LABEL[wisdom.category]} />
              </View>
              <AppText variant="subheading" style={styles.quote}>
                „{wisdom.text}“
              </AppText>
              <View style={styles.sourceBlock}>
                <AppText variant="caption" color={colors.textMuted}>
                  Quelle:
                </AppText>
                <SourceLine source={wisdom.source} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  list: { gap: spacing.md, marginTop: spacing.sm },
  chipRow: { flexDirection: 'row', alignSelf: 'flex-start' },
  quote: { fontStyle: 'italic' },
  sourceBlock: { gap: spacing.xs, marginTop: spacing.xs },
});
