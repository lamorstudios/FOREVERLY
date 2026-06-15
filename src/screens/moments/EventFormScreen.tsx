import { useState } from 'react';
import { View, Pressable, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  TextField,
  SelectField,
  DateField,
  Avatar,
  SectionHeader,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { createEvent } from '@/api/familyEvents';
import { listPersons } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { EVENT_TYPES, EVENT_TYPE_ORDER } from '@/constants/events';
import { VISIBILITY_LEVELS } from '@/constants/closeness';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { FamilyEventType, VisibilityLevel } from '@/types/models';
import type { SelectOption } from '@/components';

type Props = NativeStackScreenProps<HomeStackParamList, 'EventForm'>;

const TYPE_OPTIONS: SelectOption<FamilyEventType>[] = EVENT_TYPE_ORDER.map(
  (type) => ({
    value: type,
    label: EVENT_TYPES[type].label,
    color: EVENT_TYPES[type].color,
  }),
);

const VISIBILITY_OPTIONS_LEVELS: VisibilityLevel[] = [
  'family',
  'inner',
  'sehr_nah',
  'private',
];

const VISIBILITY_OPTIONS: SelectOption<VisibilityLevel>[] =
  VISIBILITY_OPTIONS_LEVELS.map((level) => ({
    value: level,
    label: `${VISIBILITY_LEVELS[level].emoji} ${VISIBILITY_LEVELS[level].label}`,
  }));

export function EventFormScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });
  const persons = personsQuery.data ?? [];
  const myPerson = persons.find((p) => p.user_id === userId);

  const [type, setType] = useState<FamilyEventType>('grillfest');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<VisibilityLevel>('family');
  const [participantPersonIds, setParticipantPersonIds] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();

  const togglePerson = (personId: string) => {
    setParticipantPersonIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId],
    );
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createEvent({
        familyId,
        type,
        title: title.trim(),
        description: description.trim() || null,
        eventDate: eventDate!,
        eventTime: eventTime.trim() || null,
        location: location.trim() || null,
        visibility,
        hostUserId: userId!,
        hostPersonId: myPerson?.id ?? null,
        participantPersonIds,
        createdBy: userId!,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: qk.events(familyId) });
      navigation.replace('EventDetail', { eventId: created.id });
    },
    onError: (err) => Alert.alert('Fehler', friendlyError(err)),
  });

  const onSave = () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Bitte gib einen Titel ein.');
      valid = false;
    } else {
      setTitleError(undefined);
    }
    if (!eventDate) {
      setDateError('Bitte wähle ein Datum.');
      valid = false;
    } else {
      setDateError(undefined);
    }
    if (!valid) return;
    createMutation.mutate();
  };

  return (
    <Screen>
      <View style={styles.intro}>
        <AppText variant="heading">Event erstellen</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Plane ein Familienevent und lade eure Liebsten ein.
        </AppText>
      </View>

      <View style={styles.form}>
        <SelectField<FamilyEventType>
          label="Art"
          value={type}
          options={TYPE_OPTIONS}
          onChange={setType}
        />

        <TextField
          label="Titel"
          value={title}
          onChangeText={setTitle}
          error={titleError}
          placeholder="z. B. Sommer-Grillfest"
        />

        <TextField
          label="Beschreibung"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Worum geht es bei diesem Event?"
        />

        <DateField
          label="Datum"
          value={eventDate}
          onChange={setEventDate}
          error={dateError}
        />

        <TextField
          label="Uhrzeit"
          value={eventTime}
          onChangeText={setEventTime}
          placeholder="16:00"
        />

        <TextField
          label="Ort"
          value={location}
          onChangeText={setLocation}
          placeholder="z. B. bei Oma im Garten"
        />

        <SelectField<VisibilityLevel>
          label="Sichtbar für"
          value={visibility}
          options={VISIBILITY_OPTIONS}
          onChange={setVisibility}
        />

        <View style={styles.section}>
          <SectionHeader title="Teilnehmer" />
          <AppText variant="caption" color={colors.textMuted}>
            Wähle aus, wer eingeladen werden soll.
          </AppText>
          {persons.map((p) => {
            const selected = participantPersonIds.includes(p.id);
            return (
              <Pressable
                key={p.id}
                style={[styles.personRow, selected && styles.personRowSelected]}
                onPress={() => togglePerson(p.id)}
              >
                <Avatar name={fullName(p.first_name, p.last_name)} size={44} />
                <AppText variant="body" style={styles.personName}>
                  {fullName(p.first_name, p.last_name)}
                </AppText>
                <Ionicons
                  name={selected ? 'checkbox' : 'square-outline'}
                  size={26}
                  color={selected ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Event speichern"
          icon="checkmark-circle-outline"
          onPress={onSave}
          loading={createMutation.isPending}
          style={styles.saveButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.lg },
  form: { gap: spacing.lg },
  section: { gap: spacing.sm },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  personName: { flex: 1 },
  saveButton: { marginTop: spacing.sm },
});
