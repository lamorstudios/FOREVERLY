import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Card,
  Avatar,
  SignedImage,
  Loading,
  SectionHeader,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { listPersons, listRelationships } from '@/api/persons';
import { listMemories } from '@/api/memories';
import { listCloseness, setCloseness, closenessMap } from '@/api/closeness';
import { qk } from '@/api/queryKeys';
import {
  CLOSENESS_LEVELS,
  CLOSENESS_ORDER,
  VISIBILITY_LEVELS,
  isVisibleAtCloseness,
} from '@/constants/closeness';
import { RELATIONSHIP_LABELS } from '@/constants/relationships';
import { fullName } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { ClosenessLevel, VisibilityLevel } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Closeness'>;

export function ClosenessScreen(_props: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();
  const [viewAs, setViewAs] = useState<ClosenessLevel | null>(null);

  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const relsQuery = useQuery({ queryKey: qk.relationships(familyId), queryFn: () => listRelationships(familyId) });
  const closenessQuery = useQuery({
    queryKey: qk.closeness(familyId, userId!),
    queryFn: () => listCloseness(familyId, userId!),
  });
  const memoriesQuery = useQuery({ queryKey: qk.memories(familyId), queryFn: () => listMemories(familyId) });

  const setMutation = useMutation({
    mutationFn: ({ personId, level }: { personId: string; level: ClosenessLevel }) =>
      setCloseness(familyId, userId!, personId, level),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.closeness(familyId, userId!) }),
  });

  if (personsQuery.isLoading || closenessQuery.isLoading) {
    return <Loading message="Familiennähe wird geladen …" />;
  }

  const persons = personsQuery.data ?? [];
  const rels = relsQuery.data ?? [];
  const cmap = closenessMap(closenessQuery.data ?? []);
  const memories = memoriesQuery.data ?? [];

  const myPerson = persons.find((p) => p.user_id === userId);
  // Beziehung von mir zu einer Person (für die Anzeige „Beziehung")
  const relationLabel = (personId: string): string | null => {
    const r = rels.find(
      (x) =>
        (x.from_person_id === myPerson?.id && x.to_person_id === personId) ||
        (x.to_person_id === myPerson?.id && x.from_person_id === personId),
    );
    return r ? RELATIONSHIP_LABELS[r.type] : null;
  };

  const others = persons.filter((p) => p.id !== myPerson?.id);

  // Sichtbarkeits-Demonstration
  const visibleMemories = viewAs
    ? memories.filter((m) => isVisibleAtCloseness((m.visibility ?? 'family') as VisibilityLevel, viewAs))
    : memories;

  return (
    <Screen
      onRefresh={() => {
        personsQuery.refetch();
        closenessQuery.refetch();
        memoriesQuery.refetch();
      }}
      refreshing={closenessQuery.isRefetching}
    >
      <View style={styles.intro}>
        <AppText variant="heading">Familiennähe</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Beziehung ist nicht gleich Nähe. Lege individuell fest, wie nah dir
          jede Person steht – unabhängig vom Verwandtschaftsgrad. Diese
          Einstufung ist privat und gilt nur für dich.
        </AppText>
      </View>

      <SectionHeader title="Meine Familiennähe" />
      {others.map((p) => {
        const current = cmap[p.id] ?? null;
        const rel = relationLabel(p.id);
        return (
          <Card key={p.id}>
            <View style={styles.personRow}>
              {p.avatar_url ? (
                <SignedImage bucket="photos" path={p.avatar_url} style={styles.avatar} />
              ) : (
                <Avatar name={fullName(p.first_name, p.last_name)} size={48} />
              )}
              <View style={styles.personText}>
                <AppText variant="subheading">{fullName(p.first_name, p.last_name)}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  Beziehung: {rel ?? 'Familienperson'}
                  {current ? `  ·  Nähe: ${CLOSENESS_LEVELS[current].emoji} ${CLOSENESS_LEVELS[current].label}` : ''}
                </AppText>
              </View>
            </View>
            <View style={styles.levels}>
              {CLOSENESS_ORDER.map((lvl) => {
                const meta = CLOSENESS_LEVELS[lvl];
                const selected = current === lvl;
                return (
                  <Pressable
                    key={lvl}
                    onPress={() => setMutation.mutate({ personId: p.id, level: lvl })}
                    style={[styles.levelChip, selected && { backgroundColor: meta.color, borderColor: meta.color }]}
                  >
                    <AppText variant="body">{meta.emoji}</AppText>
                    <AppText
                      variant="caption"
                      color={selected ? colors.textOnAccent : colors.textSecondary}
                    >
                      {meta.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        );
      })}

      {/* Sichtbarkeits-Demonstration */}
      <View style={styles.demo}>
        <SectionHeader title="Sichtbarkeit testen" />
        <AppText variant="body" color={colors.textSecondary}>
          Wähle einen Nähegrad und sieh, welche Erinnerungen eine Person mit
          dieser Nähe sehen dürfte.
        </AppText>
        <View style={styles.demoChips}>
          <Pressable
            onPress={() => setViewAs(null)}
            style={[styles.viewChip, viewAs === null && styles.viewChipActive]}
          >
            <AppText variant="label" color={viewAs === null ? colors.textOnAccent : colors.textPrimary}>
              Alle
            </AppText>
          </Pressable>
          {CLOSENESS_ORDER.map((lvl) => {
            const meta = CLOSENESS_LEVELS[lvl];
            const active = viewAs === lvl;
            return (
              <Pressable
                key={lvl}
                onPress={() => setViewAs(lvl)}
                style={[styles.viewChip, active && { backgroundColor: meta.color }]}
              >
                <AppText variant="label" color={active ? colors.textOnAccent : colors.textPrimary}>
                  {meta.emoji} {meta.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="caption" color={colors.textMuted}>
          {viewAs
            ? `Sichtbar für „${CLOSENESS_LEVELS[viewAs].label}": ${visibleMemories.length} von ${memories.length} Erinnerungen`
            : `${memories.length} Erinnerungen insgesamt`}
        </AppText>

        {visibleMemories.map((m) => {
          const vis = VISIBILITY_LEVELS[(m.visibility ?? 'family') as VisibilityLevel];
          return (
            <Card key={m.id}>
              <AppText variant="bodyStrong">{m.title}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Sichtbarkeit: {vis.emoji} {vis.label}
              </AppText>
            </Card>
          );
        })}
        {viewAs && visibleMemories.length === 0 ? (
          <Card>
            <AppText variant="body" color={colors.textSecondary}>
              Für diesen Nähegrad sind keine Erinnerungen sichtbar.
            </AppText>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt },
  personText: { flex: 1, gap: 2 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  levelChip: {
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  demo: { marginTop: spacing.lg, gap: spacing.sm },
  demoChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  viewChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  viewChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
