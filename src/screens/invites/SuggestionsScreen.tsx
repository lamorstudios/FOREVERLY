import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  Card,
  SelectField,
  EmptyState,
  Loading,
} from '@/components';
import type { SelectOption } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { listPersons } from '@/api/persons';
import {
  listSuggestions,
  generateSuggestions,
  confirmSuggestion,
  dismissSuggestion,
  updateSuggestionType,
} from '@/api/suggestions';
import { qk } from '@/api/queryKeys';
import {
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPE_OPTIONS,
  DEFAULT_CATEGORY_FOR_TYPE,
} from '@/constants/relationships';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { RelationshipSuggestion, RelationshipType } from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'Suggestions'>;

const relOptions: SelectOption<RelationshipType>[] = RELATIONSHIP_TYPE_OPTIONS.map((t) => ({
  value: t,
  label: RELATIONSHIP_LABELS[t],
}));

export function SuggestionsScreen(_props: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const suggestionsQuery = useQuery({ queryKey: qk.suggestions(familyId), queryFn: () => listSuggestions(familyId) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: qk.suggestions(familyId) });
    queryClient.invalidateQueries({ queryKey: qk.relationships(familyId) });
  }

  const generateMutation = useMutation({
    mutationFn: () => generateSuggestions(familyId, userId!),
    onSuccess: (added) => {
      invalidate();
      Alert.alert(
        'Vorschläge aktualisiert',
        added.length ? `${added.length} neue/r Vorschlag/Vorschläge gefunden.` : 'Keine neuen Vorschläge gefunden.',
      );
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const confirmMutation = useMutation({
    mutationFn: (s: RelationshipSuggestion) => confirmSuggestion(s),
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissSuggestion(id),
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: RelationshipType }) =>
      updateSuggestionType(id, type, DEFAULT_CATEGORY_FOR_TYPE[type]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.suggestions(familyId) }),
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  if (suggestionsQuery.isLoading) return <Loading message="Vorschläge werden geladen …" />;

  const suggestions = suggestionsQuery.data ?? [];
  const persons = personsQuery.data ?? [];
  const nameOf = (id: string) => {
    const p = persons.find((x) => x.id === id);
    return p ? fullName(p.first_name, p.last_name) : 'diese Person';
  };

  return (
    <Screen onRefresh={() => suggestionsQuery.refetch()} refreshing={suggestionsQuery.isRefetching}>
      <View style={styles.intro}>
        <AppText variant="heading">Beziehungsvorschläge</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          FAMII erkennt logische Familienbeziehungen und schlägt sie vor.
          Bestätige, passe an oder verwirf jeden Vorschlag.
        </AppText>
      </View>

      <Button
        label="Vorschläge aktualisieren"
        icon="sparkles-outline"
        variant="secondary"
        loading={generateMutation.isPending}
        onPress={() => generateMutation.mutate()}
      />

      {suggestions.length === 0 ? (
        <EmptyState icon="git-compare-outline" title="Keine offenen Vorschläge" message="Aktuell gibt es keine Beziehungsvorschläge." />
      ) : (
        suggestions.map((s) => (
          <Card key={s.id}>
            <View style={styles.head}>
              <Ionicons name="bulb-outline" size={22} color={colors.gold} />
              <AppText variant="subheading" style={styles.headText}>
                {nameOf(s.to_person_id)} könnte {RELATIONSHIP_LABELS[s.suggested_type]} von{' '}
                {nameOf(s.from_person_id)} sein
              </AppText>
            </View>
            {s.reason ? (
              <AppText variant="body" color={colors.textSecondary}>
                {s.reason}
              </AppText>
            ) : null}

            <SelectField
              label="Beziehung anpassen"
              value={s.suggested_type}
              options={relOptions}
              onChange={(type) => updateTypeMutation.mutate({ id: s.id, type })}
            />

            <View style={styles.actions}>
              <Button label="Bestätigen" icon="checkmark" fullWidth={false} style={styles.actionBtn} loading={confirmMutation.isPending} onPress={() => confirmMutation.mutate(s)} />
              <Button label="Verwerfen" icon="close" variant="ghost" fullWidth={false} style={styles.actionBtn} onPress={() => dismissMutation.mutate(s.id)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headText: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flexGrow: 1 },
});
