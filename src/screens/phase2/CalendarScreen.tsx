import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  AppText,
  Button,
  Card,
  EmptyState,
  Loading,
  IconChip,
} from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { listCalendarEvents, deleteCalendarEvent } from '@/api/calendar';
import { listPersons } from '@/api/persons';
import { CALENDAR_TYPES } from '@/constants/phase2';
import { formatDate, fullName, daysUntil } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { CalendarEvent, Person } from '@/types/models';

export function CalendarScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'Calendar'>) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: qk.calendar(familyId),
    queryFn: () => listCalendarEvents(familyId),
  });
  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.calendar(familyId) });
    },
    onError: (error) => {
      Alert.alert('Fehler', friendlyError(error));
    },
  });

  const events = eventsQuery.data ?? [];
  const persons = personsQuery.data ?? [];

  function handleRefresh() {
    eventsQuery.refetch();
    personsQuery.refetch();
  }

  function confirmDelete(event: CalendarEvent) {
    Alert.alert(
      'Termin löschen',
      `Möchten Sie „${event.title}“ wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(event.id),
        },
      ],
    );
  }

  function participantsLabel(event: CalendarEvent): string {
    if (event.for_whole_family) return 'Ganze Familie';
    const ids = event.participant_ids ?? [];
    const names = ids
      .map((id) => persons.find((p) => p.id === id))
      .filter((p): p is Person => !!p)
      .map((p) => fullName(p.first_name, p.last_name));
    return names.length > 0 ? names.join(', ') : 'Keine Teilnehmer';
  }

  const upcomingCount = events.filter((e) => {
    const days = daysUntil(e.event_date);
    return days === null || days >= 0;
  }).length;

  if (eventsQuery.isLoading || personsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Kalender wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={eventsQuery.isFetching} onRefresh={handleRefresh}>
      <AppText variant="display">Familienkalender</AppText>
      {upcomingCount > 0 ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
          {upcomingCount === 1
            ? '1 anstehender Termin'
            : `${upcomingCount} anstehende Termine`}
        </AppText>
      ) : null}

      <Button
        label="Termin hinzufügen"
        icon="add-circle-outline"
        onPress={() => navigation.navigate('CalendarEventForm')}
        style={styles.addButton}
      />

      {events.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Noch keine Termine"
          message="Tragen Sie Geburtstage, Arzttermine und Familienereignisse ein, damit niemand etwas verpasst."
          actionLabel="Termin hinzufügen"
          onAction={() => navigation.navigate('CalendarEventForm')}
        />
      ) : (
        <View style={styles.list}>
          {events.map((event) => {
            const meta = CALENDAR_TYPES[event.type];
            return (
              <Card key={event.id} onPress={() => confirmDelete(event)}>
                <View style={styles.row}>
                  <IconChip name={meta.icon} color={meta.color} />

                  <View style={styles.body}>
                    <AppText variant="subheading">{event.title}</AppText>

                    <View style={styles.dateRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={colors.textSecondary}
                      />
                      <AppText variant="body" color={colors.textSecondary}>
                        {formatDate(event.event_date)}
                        {event.event_time ? ` um ${event.event_time}` : ''}
                      </AppText>
                      {event.is_annual ? (
                        <View style={styles.annualBadge}>
                          <AppText variant="caption" color={colors.gold}>
                            jährlich
                          </AppText>
                        </View>
                      ) : null}
                    </View>

                    <AppText variant="caption" color={meta.color}>
                      {meta.label}
                    </AppText>

                    <View style={styles.peopleRow}>
                      <Ionicons
                        name="people-outline"
                        size={18}
                        color={colors.textMuted}
                      />
                      <AppText variant="caption" color={colors.textMuted}>
                        {participantsLabel(event)}
                      </AppText>
                    </View>

                    {event.description ? (
                      <AppText
                        variant="body"
                        color={colors.textSecondary}
                        style={styles.description}
                      >
                        {event.description}
                      </AppText>
                    ) : null}
                  </View>

                  <Pressable
                    hitSlop={10}
                    onPress={() => confirmDelete(event)}
                    style={styles.trash}
                  >
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: spacing.xs },
  addButton: { marginTop: spacing.lg, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.xs },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  annualBadge: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  peopleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  description: { marginTop: spacing.xs },
  trash: { padding: spacing.xs },
});
