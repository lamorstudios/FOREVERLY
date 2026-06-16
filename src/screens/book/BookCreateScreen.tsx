import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  AppText,
  Button,
  Card,
  SelectField,
  TextField,
  Loading,
} from '@/components';
import type { SelectOption } from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { createBookProject } from '@/api/book';
import { listPersons } from '@/api/persons';
import { BOOK_TYPE_LABEL, BOOK_TYPE_DESCRIPTION } from '@/book/types';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { BookType, BookOptions } from '@/types/models';

const BOOK_TYPES: { type: BookType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'komplett', icon: 'book' },
  { type: 'person', icon: 'person' },
  { type: 'oma_opa', icon: 'people' },
  { type: 'jahr', icon: 'calendar' },
  { type: 'erinnerungen', icon: 'sparkles' },
  { type: 'lebensweisheiten', icon: 'bulb' },
];

export function BookCreateScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'BookCreate'>) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<BookType | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));

  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
    enabled: selectedType === 'person',
  });

  const personOptions: SelectOption<string>[] = (personsQuery.data ?? []).map(
    (person) => ({
      value: person.id,
      label: fullName(person.first_name, person.last_name),
    }),
  );

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedType) throw new Error('Bitte wählt zuerst einen Buchtyp aus.');
      const options: BookOptions = {};
      if (selectedType === 'person' && personId) options.personId = personId;
      if (selectedType === 'jahr') {
        const parsed = parseInt(year, 10);
        options.year = Number.isNaN(parsed) ? new Date().getFullYear() : parsed;
      }
      return createBookProject({
        familyId,
        createdBy: userId!,
        type: selectedType,
        options,
      });
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: qk.bookProjects(familyId) });
      navigation.replace('BookPreview', { projectId: project.id });
    },
    onError: (error) => {
      Alert.alert('Fehler', friendlyError(error));
    },
  });

  if (createMutation.isPending) {
    return (
      <Screen>
        <Loading message="Euer Buch wird erstellt …" />
      </Screen>
    );
  }

  const canCreate =
    !!selectedType && (selectedType !== 'person' || !!personId);

  return (
    <Screen>
      <AppText variant="display">Neues Buch</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Welche Geschichte möchtet ihr erzählen? Wählt einen Buchtyp – den Inhalt
        stellen wir aus euren Familiendaten zusammen.
      </AppText>

      <View style={styles.list}>
        {BOOK_TYPES.map(({ type, icon }) => {
          const selected = selectedType === type;
          return (
            <Card
              key={type}
              onPress={() => setSelectedType(type)}
              style={selected ? styles.cardSelected : undefined}
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.iconCircle,
                    selected && styles.iconCircleSelected,
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={28}
                    color={selected ? colors.textOnAccent : colors.primary}
                  />
                </View>
                <View style={styles.cardBody}>
                  <AppText variant="subheading" color={colors.textPrimary}>
                    {BOOK_TYPE_LABEL[type]}
                  </AppText>
                  <AppText variant="body" color={colors.textSecondary}>
                    {BOOK_TYPE_DESCRIPTION[type]}
                  </AppText>
                </View>
                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={26}
                    color={colors.primary}
                  />
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>

      {selectedType === 'person' ? (
        <View style={styles.optionBlock}>
          <SelectField
            label="Über welche Person?"
            placeholder="Person auswählen"
            value={personId}
            options={personOptions}
            onChange={setPersonId}
          />
        </View>
      ) : null}

      {selectedType === 'jahr' ? (
        <View style={styles.optionBlock}>
          <TextField
            label="Welches Jahr?"
            keyboardType="number-pad"
            value={year}
            onChangeText={setYear}
            maxLength={4}
          />
        </View>
      ) : null}

      <Button
        label="Buch erstellen"
        icon="sparkles-outline"
        disabled={!canCreate}
        onPress={() => createMutation.mutate()}
        style={styles.createButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: spacing.sm, marginBottom: spacing.md },
  list: { gap: spacing.md },
  cardSelected: { borderColor: colors.primary, borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: { backgroundColor: colors.primary },
  cardBody: { flex: 1, gap: spacing.xs },
  optionBlock: { marginTop: spacing.lg },
  createButton: { marginTop: spacing.xl },
});
