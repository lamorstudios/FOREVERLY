import { useMemo, useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { fullName, formatDate } from '@/lib/format';
import { CATEGORY_LABELS } from '@/constants/relationships';
import { colors, spacing, radius, useResponsive } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { RelationshipCategory } from '@/types/models';
import { FamilyTreeView } from './FamilyTreeView';

type Props = NativeStackScreenProps<FamilyStackParamList, 'Network'>;
type ViewMode = 'tree' | 'list';

const LEGEND: {
  category: RelationshipCategory;
  color: string;
  short: string;
}[] = [
  { category: 'biological', color: colors.relationBiological, short: 'Biologisch' },
  { category: 'married', color: colors.relationMarried, short: 'Angeheiratet' },
  { category: 'patchwork', color: colors.relationPatchwork, short: 'Patchwork' },
  { category: 'adoption', color: colors.relationAdoption, short: 'Adoption' },
];

export function NetworkScreen({ navigation }: Props) {
  const { activeFamily, isAdmin } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const { columns } = useResponsive();
  const cardBasis = columns === 1 ? '100%' : columns === 3 ? '31%' : '47%';

  const [mode, setMode] = useState<ViewMode>('tree');

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

  const anchorId = useMemo(
    () => persons.find((p) => p.user_id === userId)?.id ?? persons[0]?.id ?? null,
    [persons, userId],
  );

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

  const toggle = (
    <View style={styles.segment}>
      <Pressable
        onPress={() => setMode('tree')}
        style={[styles.segmentBtn, mode === 'tree' && styles.segmentActive]}
      >
        <AppText
          variant="label"
          color={mode === 'tree' ? colors.textOnAccent : colors.textSecondary}
        >
          Baum
        </AppText>
      </Pressable>
      <Pressable
        onPress={() => setMode('list')}
        style={[styles.segmentBtn, mode === 'list' && styles.segmentActive]}
      >
        <AppText
          variant="label"
          color={mode === 'list' ? colors.textOnAccent : colors.textSecondary}
        >
          Liste
        </AppText>
      </Pressable>
    </View>
  );

  // ----- Baumansicht (Standard) -----
  if (mode === 'tree') {
    return (
      <Screen scroll={false} contentStyle={styles.treeContent} tint={colors.tintFamily}>
        <View style={styles.treeHeader}>
          <AppText variant="heading" numberOfLines={1} style={styles.flexShrink}>
            {activeFamily!.name}
          </AppText>
          {toggle}
        </View>

        <AppText variant="caption" color={colors.textSecondary} style={styles.hint}>
          Tippe eine Person an, um sie ins Zentrum zu holen · nochmal tippen öffnet das Profil
        </AppText>

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
          <View style={styles.treeArea}>
            <FamilyTreeView
              persons={persons}
              relationships={relationships}
              anchorId={anchorId}
              onSelectPerson={(personId) =>
                navigation.navigate('PersonProfile', { personId })
              }
            />
          </View>
        )}
      </Screen>
    );
  }

  // ----- Listenansicht -----
  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} tint={colors.tintFamily}>
      <View style={styles.listHeader}>
        <AppText variant="display" numberOfLines={2} style={styles.flexShrink}>
          {activeFamily!.name}
        </AppText>
        {toggle}
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
  flexShrink: { flexShrink: 1 },
  treeContent: { flex: 1 },
  hint: { marginTop: 2 },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 3,
    flexShrink: 0,
  },
  segmentBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  segmentActive: { backgroundColor: colors.primary },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  legendRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    flexShrink: 1,
  },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dotSmall: { width: 10, height: 10, borderRadius: 5 },
  worldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  worldBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  worldBtnText: { fontWeight: '700' },
  treeArea: {
    flex: 1,
    backgroundColor: colors.tintFamily,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
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
