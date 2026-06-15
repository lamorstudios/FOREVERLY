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
  Chip,
  TextField,
  DateField,
  SelectField,
} from '@/components';
import type { SelectOption } from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { createCalendarEvent } from '@/api/calendar';
import { listPersons } from '@/api/persons';
import { CALENDAR_TYPES, CALENDAR_TYPE_ORDER } from '@/constants/phase2';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { CalendarEventType } from '@/types/models';

const TYPE_OPTIONS: SelectOption<CalendarEventType>[] = CALENDAR_TYPE_ORDER.map(
  (type) => ({
    value: type,
    label: CALENDAR_TYPES[type].label,
    color: CALENDAR_TYPES[type].color,
  }),
);

export function CalendarEventFormScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'CalendarEventForm'>) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const [type, setType] = useState<CalendarEventType>('familienereignis');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState('');
  const [description, setDescription] = useState('');
  const [isAnnual, setIsAnnual] = useState(false);
  const [forWholeFamily, setForWholeFamily] = useState(true);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });
  const persons = personsQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      createCalendarEvent({
        familyId,
        type,
        title: title.trim(),
        description: description.trim() || null,
        eventDate: eventDate!,
        eventTime: eventTime.trim() || null,
        isAnnual,
        forWholeFamily,
        participantIds: forWholeFamily ? [] : participantIds,
        createdBy: userId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.calendar(familyId) });
      navigation.goBack();
    },
    onError: (e) => {
      Alert.alert('Fehler', friendlyError(e));
    },
  });

  function toggleParticipant(id: string) {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function handleSave() {
    if (!title.trim()) {
      setError('Bitte geben Sie einen Titel ein.');
      Alert.alert('Titel fehlt', 'Bitte geben Sie einen Titel für den Termin ein.');
      return;
    }
    if (!eventDate) {
      setError('Bitte wählen Sie ein Datum.');
      Alert.alert('Datum fehlt', 'Bitte wählen Sie ein Datum für den Termin.');
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <Screen>
      <AppText variant="display">Neuer Termin</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Tragen Sie einen Termin für Ihre Familie ein.
      </AppText>

      <View style={styles.form}>
        <SelectField<CalendarEventType>
          label="Art"
          value={type}
          options={TYPE_OPTIONS}
          onChange={setType}
        />

        <TextField
          label="Titel"
          value={title}
          onChangeText={setTitle}
          placeholder="z. B. Geburtstag von Oma"
          error={!title.trim() && error ? error : undefined}
        />

        <DateField
          label="Datum"
          value={eventDate}
          onChange={setEventDate}
          error={!eventDate && error ? error : undefined}
        />

        <TextField
          label="Uhrzeit (optional)"
          value={eventTime}
          onChangeText={setEventTime}
          placeholder="14:30"
        />

        <TextField
          label="Beschreibung (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Weitere Details …"
          multiline
        />

        <View style={styles.field}>
          <AppText variant="label" color={colors.textSecondary}>
            Jährlich wiederholen
          </AppText>
          <View style={styles.chipRow}>
            <Chip
              label="Ja"
              selected={isAnnual}
              color={colors.gold}
              onPress={() => setIsAnnual(true)}
            />
            <Chip
              label="Nein"
              selected={!isAnnual}
              onPress={() => setIsAnnual(false)}
            />
          </View>
        </View>

        <View style={styles.field}>
          <AppText variant="label" color={colors.textSecondary}>
            Für die ganze Familie
          </AppText>
          <View style={styles.chipRow}>
            <Chip
              label="Ja"
              selected={forWholeFamily}
              color={colors.primary}
              onPress={() => setForWholeFamily(true)}
            />
            <Chip
              label="Nein"
              selected={!forWholeFamily}
              onPress={() => setForWholeFamily(false)}
            />
          </View>
        </View>

        {!forWholeFamily ? (
          <View style={styles.field}>
            <AppText variant="label" color={colors.textSecondary}>
              Teilnehmer auswählen
            </AppText>
            <View style={styles.personList}>
              {persons.map((person) => {
                const isSelected = participantIds.includes(person.id);
                return (
                  <Card
                    key={person.id}
                    onPress={() => toggleParticipant(person.id)}
                    style={styles.personCard}
                  >
                    <View style={styles.personRow}>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected ? (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={colors.textOnAccent}
                          />
                        ) : null}
                      </View>
                      <AppText variant="body">
                        {fullName(person.first_name, person.last_name)}
                      </AppText>
                    </View>
                  </Card>
                );
              })}
              {persons.length === 0 ? (
                <AppText variant="caption" color={colors.textMuted}>
                  Es sind noch keine Personen im Familiennetzwerk vorhanden.
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}

        <Button
          label="Termin speichern"
          icon="checkmark-circle-outline"
          loading={mutation.isPending}
          onPress={handleSave}
          style={styles.saveButton}
        />
        <Button
          label="Abbrechen"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: spacing.xs, marginBottom: spacing.lg },
  form: { gap: spacing.lg },
  field: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  personList: { gap: spacing.sm },
  personCard: { paddingVertical: spacing.md },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveButton: { marginTop: spacing.md },
});
