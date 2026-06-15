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
import { colors, spacing, radius } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { Person, RelationshipCategory } from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'Network'>;

const LEGEND: { category: RelationshipCategory; color: string }[] = [
  { category: 'biological', color: colors.relationBiological },
  { category: 'married', color: colors.relationMarried },
  { category: 'patchwork', color: colors.relationPatchwork },
  { category: 'adoption', color: colors.relationAdoption },
];

function years(person: Person): string {
  const birth = person.birth_date ? formatDate(person.birth_date) : null;
  const death = person.death_date ? formatDate(person.death_date) : null;
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `* ${birth}`;
  if (death) return `† ${death}`;
  return '';
}

export function NetworkScreen({ navigation }: Props) {
  const { activeFamily, isAdmin } = useFamily();
  const familyId = activeFamily!.id;

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
        <Button
          label="Mitglieder"
          icon="people-outline"
          variant="secondary"
          fullWidth={false}
          style={styles.headerButton}
          onPress={() => navigation.navigate('Members')}
        />
        <Button
          label="Einladen"
          icon="person-add-outline"
          variant="secondary"
          fullWidth={false}
          style={styles.headerButton}
          onPress={() => navigation.navigate('InvitesList')}
        />
        <Button
          label="Vorschläge"
          icon="bulb-outline"
          variant="secondary"
          fullWidth={false}
          style={styles.headerButton}
          onPress={() => navigation.navigate('Suggestions')}
        />
        {isAdmin ? (
          <Button
            label="Code"
            icon="mail-outline"
            variant="secondary"
            fullWidth={false}
            style={styles.headerButton}
            onPress={() => navigation.navigate('Invite')}
          />
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
                  style={styles.personCard}
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
                      size={72}
                    />
                  )}
                  <AppText variant="bodyStrong" center numberOfLines={2}>
                    {fullName(person.first_name, person.last_name)}
                  </AppText>
                  {years(person) ? (
                    <AppText
                      variant="caption"
                      color={colors.textMuted}
                      center
                    >
                      {years(person)}
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerButton: { flex: 1 },
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
    width: '47%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  personDots: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  smallDot: { width: 10, height: 10, borderRadius: 5 },
});
