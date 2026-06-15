import { useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  SelectField,
  Loading,
} from '@/components';
import type { SelectOption } from '@/components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listPersons, createRelationship } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import {
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPE_OPTIONS,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_CATEGORY_FOR_TYPE,
} from '@/constants/relationships';
import { colors, spacing, relationshipColor } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { RelationshipType, RelationshipCategory } from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'AddRelationship'>;

export function AddRelationshipScreen({ navigation, route }: Props) {
  const { personId } = route.params;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const [otherId, setOtherId] = useState<string | null>(null);
  const [type, setType] = useState<RelationshipType | null>(null);
  const [category, setCategory] = useState<RelationshipCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });

  const persons = personsQuery.data ?? [];

  const personOptions: SelectOption<string>[] = useMemo(
    () =>
      persons
        .filter((p) => p.id !== personId)
        .map((p) => ({
          value: p.id,
          label: fullName(p.first_name, p.last_name),
        })),
    [persons, personId],
  );

  const typeOptions: SelectOption<RelationshipType>[] = useMemo(
    () =>
      RELATIONSHIP_TYPE_OPTIONS.map((t) => ({
        value: t,
        label: RELATIONSHIP_LABELS[t],
      })),
    [],
  );

  const categoryOptions: SelectOption<RelationshipCategory>[] = useMemo(
    () =>
      CATEGORY_OPTIONS.map((c) => ({
        value: c,
        label: CATEGORY_LABELS[c],
        color: relationshipColor(c),
      })),
    [],
  );

  function handleTypeChange(value: RelationshipType) {
    setType(value);
    setCategory(DEFAULT_CATEGORY_FOR_TYPE[value]);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      createRelationship({
        family_id: familyId,
        from_person_id: personId,
        to_person_id: otherId as string,
        type: type as RelationshipType,
        category: category as RelationshipCategory,
        created_by: userId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qk.relationships(familyId),
      });
      navigation.goBack();
    },
    onError: (e) => setError(friendlyError(e)),
  });

  function handleSave() {
    setError(null);
    if (!otherId) {
      setError('Bitte wähle eine Person aus.');
      return;
    }
    if (!type) {
      setError('Bitte wähle die Art der Beziehung aus.');
      return;
    }
    if (!category) {
      setError('Bitte wähle eine Kategorie aus.');
      return;
    }
    saveMutation.mutate();
  }

  if (personsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Personen werden geladen …" />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="display" style={styles.title}>
        Beziehung hinzufügen
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Wie ist diese Person mit der ausgewählten Person verwandt?
      </AppText>

      <View style={styles.form}>
        <SelectField<string>
          label="Person"
          placeholder="Person auswählen"
          value={otherId}
          options={personOptions}
          onChange={setOtherId}
        />
        <SelectField<RelationshipType>
          label="Art der Beziehung"
          placeholder="Beziehung auswählen"
          value={type}
          options={typeOptions}
          onChange={handleTypeChange}
        />
        <SelectField<RelationshipCategory>
          label="Kategorie"
          placeholder="Kategorie auswählen"
          value={category}
          options={categoryOptions}
          onChange={setCategory}
        />

        {error ? (
          <AppText variant="caption" color={colors.error}>
            {error}
          </AppText>
        ) : null}

        <Button
          label="Speichern"
          icon="checkmark-circle-outline"
          loading={saveMutation.isPending}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.sm },
  intro: { marginBottom: spacing.lg },
  form: { gap: spacing.md },
});
