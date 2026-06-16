import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  Card,
  EmptyState,
  Loading,
  SectionHeader,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { listEvents } from '@/api/familyEvents';
import { qk } from '@/api/queryKeys';
import { EVENT_TYPES } from '@/constants/events';
import { formatDate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { FamilyEvent } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Events'>;

function EventCard({
  event,
  onPress,
}: {
  event: FamilyEvent;
  onPress: () => void;
}) {
  const meta = EVENT_TYPES[event.type];
  const count = event.participant_count ?? 0;

  return (
    <Card onPress={onPress}>
      <View style={styles.cardRow}>
        <View style={[styles.typeIcon, { backgroundColor: `${meta.color}22` }]}>
          <Ionicons name={meta.icon} size={28} color={meta.color} />
        </View>
        <View style={styles.cardText}>
          <AppText variant="subheading">{event.title}</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {formatDate(event.event_date)}
            {event.event_time ? ` · ${event.event_time} Uhr` : ''}
          </AppText>
          {event.location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textMuted}>
                {event.location}
              </AppText>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
            <AppText variant="caption" color={colors.textMuted}>
              {count} {count === 1 ? 'Teilnehmer' : 'Teilnehmer'}
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}

export function EventsScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const eventsQuery = useQuery({
    queryKey: qk.events(familyId),
    queryFn: () => listEvents(familyId),
  });

  if (eventsQuery.isLoading) {
    return <Loading message="Familienevents werden geladen …" />;
  }

  const events = eventsQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = events
    .filter((e) => e.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const openEvent = (e: FamilyEvent) =>
    navigation.navigate('EventDetail', { eventId: e.id });

  return (
    <Screen
      onRefresh={() => eventsQuery.refetch()}
      refreshing={eventsQuery.isRefetching}
    >
      <View style={styles.intro}>
        <AppText variant="heading">Familienevents</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Plant gemeinsam Feste und Treffen. Sagt zu oder ab und sammelt
          anschließend die schönsten Erinnerungen im Album.
        </AppText>
      </View>

      <Button
        label="Event erstellen"
        icon="add-circle-outline"
        onPress={() => navigation.navigate('EventForm')}
        style={styles.createButton}
      />

      {events.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Noch keine Events"
          message="Erstellt das erste Familienevent – ein Grillfest, einen Geburtstag oder ein Familientreffen."
          actionLabel="Event erstellen"
          onAction={() => navigation.navigate('EventForm')}
        />
      ) : (
        <>
          {upcoming.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Anstehend" />
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} onPress={() => openEvent(e)} />
              ))}
            </View>
          ) : null}

          {past.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Vergangen" />
              {past.map((e) => (
                <EventCard key={e.id} event={e} onPress={() => openEvent(e)} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.md },
  createButton: { marginBottom: spacing.lg },
  section: { gap: spacing.md, marginBottom: spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
