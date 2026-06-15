import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  Card,
  Avatar,
  EmptyState,
  Loading,
} from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useQuery } from '@tanstack/react-query';
import { listPersons, listRelationships } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { fullName, formatDate } from '@/lib/format';
import { CATEGORY_LABELS } from '@/constants/relationships';
import { colors, spacing, radius, useResponsive } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { RelationshipCategory } from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'Network'>;

const LEGEND: { category: RelationshipCategory; color: string }[] = [
  { category: 'biological', color: colors.relationBiological },
  { category: 'married', color: colors.relationMarried },
  { category: 'patchwork', color: colors.relationPatchwork },
  { category: 'adoption', color: colors.relationAdoption },
];

export function NetworkScreen({ navigation }: Props) {
  const { activeFamily, isAdmin } = useFamily();
  const familyId = activeFamily!.id;
  const { columns } = useResponsive();
  // Kartenbreite responsiv (1–3 Spalten); flexBasis statt fester Breite
  const cardBasis = columns === 1 ? '100%' : columns === 3 ? '31%' : '47%';

  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });
  const relationshipsQuery = useQuery({
    queryKey: qk.relationships(familyId),
    queryFn: () => listRelationships(familyId),
  });

  const persons = personsQuery.data ?? [];
  const relationships = relationshipsQuery.data ?? [];

  const categoriesByPerson = useMemo(() => {
    const map = new Map<string, Set<RelationshipCategory>>();
    for (const rel of relationships) {
      for (const id of [rel.from_person_id, rel.to_person_id]) {
        if (!map.has(id)) map.set(id, new Set());
        map.get(id)!.add(rel.category);
      }
    }
    return map;
  }, [relationships]);

  const loading = personsQuery.isLoading || relationshipsQuery.isLoading;
  const refreshing =
    personsQuery.isRefetching || relationshipsQuery.isRefetching;

  function onRefresh() {
    personsQuery.refetch();
    relationshipsQuery.refetch();
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <AppText variant="display">{activeFamily!.name}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Euer Familiennetzwerk
        </AppText>
      </View>

      <View style={styles.headerButtons}>
        <View style={styles.btnCell}>
          <Button label="Mitglieder" icon="people-outline" variant="secondary" onPress={() => navigation.navigate('Members')} />
        </View>
        <View style={styles.btnCell}>
          <Button label="Einladen" icon="person-add-outline" variant="secondary" onPress={() => navigation.navigate('InvitesList')} />
        </View>
        <View style={styles.btnCell}>
          <Button label="Vorschläge" icon="bulb-outline" variant="secondary" onPress={() => navigation.navigate('Suggestions')} />
        </View>
        {isAdmin ? (
          <View style={styles.btnCell}>
            <Button label="Code" icon="mail-outline" variant="secondary" onPress={() => navigation.navigate('Invite')} />
          </View>
        ) : null}
      </View>

      <Card style={styles.legend}>
        <AppText variant="bodyStrong">Legende</AppText>
        {LEGEND.map((item) => (
          <View key={item.category} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <AppText variant="body" color={colors.textSecondary}>
              {CATEGORY_LABELS[item.category]}
            </AppText>
          </View>
        ))}
      </Card>

      {loading ? (
        <Loading message="Familie wird geladen …" />
      ) : persons.length === 0 ? (
        <EmptyState
          icon="people-circle-outline"
          title="Noch keine Personen"
          message="Füge die erste Person zu eurem Familiennetzwerk hinzu."
          actionLabel="Person hinzufügen"
          onAction={() => navigation.navigate('PersonForm', {})}
        />
      ) : (
        <>
          <View style={styles.grid}>
            {persons.map((person) => {
              const cats = categoriesByPerson.get(person.id);
              return (
                <Card
                  key={person.id}
                  onPress={() =>
                    navigation.navigate('PersonProfile', {
                      personId: person.id,
                    })
                  }
                  style={{ ...styles.personCard, flexBasis: cardBasis }}
                >
                  {person.avatar_url ? (
                    <SignedImage
                      bucket="photos"
                      path={person.avatar_url}
                      style={styles.avatar}
                    />
                  ) : (
                    <Avatar
                      name={fullName(person.first_name, person.last_name)}
                      size={88}
                    />
                  )}
                  <AppText variant="bodyStrong" center numberOfLines={2}>
                    {fullName(person.first_name, person.last_name)}
                  </AppText>
                  {person.birth_date ? (
                    <AppText variant="caption" color={colors.textMuted} center>
                      {`* ${formatDate(person.birth_date)}`}
                    </AppText>
                  ) : null}
                  {person.death_date ? (
                    <AppText variant="caption" color={colors.textMuted} center>
                      {`† ${formatDate(person.death_date)}`}
                    </AppText>
                  ) : null}
                  {cats && cats.size > 0 ? (
                    <View style={styles.personDots}>
                      {LEGEND.filter((l) => cats.has(l.category)).map((l) => (
                        <View
                          key={l.category}
                          style={[
                            styles.smallDot,
                            { backgroundColor: l.color },
                          ]}
                        />
                      ))}
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>

          <Button
            label="+ Person hinzufügen"
            icon="person-add-outline"
            onPress={() => navigation.navigate('PersonForm', {})}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.md },
  headerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginBottom: spacing.md,
  },
  btnCell: { width: '48%' },
  legend: { gap: spacing.sm, marginBottom: spacing.lg },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 16, height: 16, borderRadius: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  personCard: {
    flexGrow: 0,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  personDots: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  smallDot: { width: 10, height: 10, borderRadius: 5 },
});
