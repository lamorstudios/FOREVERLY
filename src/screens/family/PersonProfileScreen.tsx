import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  Card,
  Chip,
  Avatar,
  SectionHeader,
  Loading,
  EmptyState,
} from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useQuery } from '@tanstack/react-query';
import { getPerson, listPersons, listRelationships } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { fullName, formatDate } from '@/lib/format';
import { RELATIONSHIP_LABELS } from '@/constants/relationships';
import { colors, spacing, relationshipColor } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<FamilyStackParamList, 'PersonProfile'>;

export function PersonProfileScreen({ navigation, route }: Props) {
  const { personId } = route.params;
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const personQuery = useQuery({
    queryKey: qk.person(personId),
    queryFn: () => getPerson(personId),
  });
  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });
  const relationshipsQuery = useQuery({
    queryKey: qk.relationships(familyId),
    queryFn: () => listRelationships(familyId),
  });

  const person = personQuery.data;
  const persons = personsQuery.data ?? [];
  const relationships = relationshipsQuery.data ?? [];

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of persons) {
      map.set(p.id, fullName(p.first_name, p.last_name));
    }
    return map;
  }, [persons]);

  const personRelationships = useMemo(
    () =>
      relationships.filter(
        (r) =>
          r.from_person_id === personId || r.to_person_id === personId,
      ),
    [relationships, personId],
  );

  if (personQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Profil wird geladen …" />
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Person nicht gefunden"
          message="Diese Person existiert nicht mehr."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.head}>
        {person.avatar_url ? (
          <SignedImage
            bucket="photos"
            path={person.avatar_url}
            style={styles.bigAvatar}
          />
        ) : (
          <Avatar
            name={fullName(person.first_name, person.last_name)}
            size={120}
          />
        )}
        <AppText variant="display" center>
          {fullName(person.first_name, person.last_name)}
        </AppText>
        {person.birth_date ? (
          <AppText variant="body" color={colors.textSecondary} center>
            * {formatDate(person.birth_date)}
            {person.birth_place ? ` in ${person.birth_place}` : ''}
          </AppText>
        ) : null}
        {person.death_date ? (
          <AppText variant="body" color={colors.textSecondary} center>
            † {formatDate(person.death_date)}
          </AppText>
        ) : null}
        {person.is_memorial ? (
          <Chip label="❤️ Familienerbe" selected color={colors.gold} />
        ) : null}
      </View>

      {person.is_memorial ? (
        <Button
          label="Familienerbe-Profil öffnen"
          icon="heart-outline"
          onPress={() => navigation.navigate('MemorialProfile', { personId })}
        />
      ) : null}

      {person.biography ? (
        <Card style={styles.section}>
          <AppText variant="bodyStrong">Über diese Person</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {person.biography}
          </AppText>
        </Card>
      ) : null}

      <SectionHeader
        title="Beziehungen"
        actionLabel="Hinzufügen"
        onAction={() => navigation.navigate('AddRelationship', { personId })}
      />
      {personRelationships.length === 0 ? (
        <AppText variant="body" color={colors.textMuted}>
          Noch keine Beziehungen erfasst.
        </AppText>
      ) : (
        <View style={styles.relList}>
          {personRelationships.map((rel) => {
            const otherId =
              rel.from_person_id === personId
                ? rel.to_person_id
                : rel.from_person_id;
            return (
              <Card key={rel.id} style={styles.relRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: relationshipColor(rel.category) },
                  ]}
                />
                <View style={styles.relText}>
                  <AppText variant="bodyStrong">
                    {nameById.get(otherId) ?? 'Unbekannte Person'}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {RELATIONSHIP_LABELS[rel.type]}
                  </AppText>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        <Button
          label="Bearbeiten"
          icon="create-outline"
          variant="secondary"
          onPress={() => navigation.navigate('PersonForm', { personId })}
        />
        <Button
          label="Beziehung hinzufügen"
          icon="git-network-outline"
          onPress={() => navigation.navigate('AddRelationship', { personId })}
        />
        {!person.user_id ? (
          <Button
            label="Einladung senden"
            icon="person-add-outline"
            onPress={() => navigation.navigate('SmartInvite', { personId })}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  bigAvatar: { width: 120, height: 120, borderRadius: 60 },
  section: { gap: spacing.sm, marginBottom: spacing.lg },
  relList: { gap: spacing.sm, marginTop: spacing.sm },
  relRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 16, height: 16, borderRadius: 8 },
  relText: { flex: 1, gap: 2 },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
