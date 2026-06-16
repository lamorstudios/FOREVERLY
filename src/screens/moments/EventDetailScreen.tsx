import { useState } from 'react';
import { View, Pressable, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  Card,
  Avatar,
  Chip,
  TextField,
  SignedImage,
  SectionHeader,
  EmptyState,
  Loading,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import {
  getEvent,
  listParticipants,
  setRsvp,
  deleteEvent,
} from '@/api/familyEvents';
import { listMoments, momentMediaUrl } from '@/api/moments';
import { listPersons } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { EVENT_TYPES, RSVP_META, RSVP_ORDER, BRING_SUGGESTIONS } from '@/constants/events';
import { VISIBILITY_LEVELS } from '@/constants/closeness';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { fullName, formatDate, formatDuration } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type {
  Moment,
  Person,
  RsvpStatus,
  VisibilityLevel,
} from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'EventDetail'>;

/** Kleine Zeile zum Abspielen einer Audio-Aufnahme. */
function AudioPlayerRow({ moment }: { moment: Moment }) {
  const { data: url } = useQuery({
    queryKey: ['signedUrl', 'audios', moment.storage_path ?? ''],
    queryFn: () => momentMediaUrl(moment),
    enabled: !!moment.storage_path,
  });
  const { isPlaying, loading, toggle } = useAudioPlayer(url ?? undefined);

  return (
    <Pressable style={styles.audioRow} onPress={toggle}>
      <View style={styles.audioIcon}>
        <Ionicons
          name={isPlaying ? 'pause' : loading ? 'hourglass-outline' : 'play'}
          size={22}
          color={colors.textOnAccent}
        />
      </View>
      <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
      <AppText variant="body" color={colors.textSecondary}>
        {formatDuration(moment.duration_seconds)}
      </AppText>
    </Pressable>
  );
}

/** Einzelner Eintrag im Erinnerungsalbum. */
function AlbumItem({ moment }: { moment: Moment }) {
  if (moment.kind === 'photo' || moment.kind === 'video') {
    return (
      <View style={styles.mediaWrapper}>
        <SignedImage bucket="photos" path={moment.storage_path} style={styles.media} />
        {moment.kind === 'video' ? (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={32} color={colors.textOnAccent} />
          </View>
        ) : null}
      </View>
    );
  }
  if (moment.kind === 'audio') {
    return <AudioPlayerRow moment={moment} />;
  }
  return moment.text ? (
    <View style={styles.quote}>
      <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textMuted} />
      <AppText variant="body" style={styles.quoteText}>
        {moment.text}
      </AppText>
    </View>
  ) : null;
}

export function EventDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: qk.event(eventId),
    queryFn: () => getEvent(eventId),
  });
  const participantsQuery = useQuery({
    queryKey: qk.eventParticipants(eventId),
    queryFn: () => listParticipants(eventId),
  });
  const momentsQuery = useQuery({
    queryKey: qk.moments(familyId, eventId),
    queryFn: () => listMoments(familyId, { eventId }),
  });
  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });

  const persons = personsQuery.data ?? [];
  const myPerson = persons.find((p) => p.user_id === userId);

  const [rsvp, setRsvpChoice] = useState<RsvpStatus | null>(null);
  const [comment, setComment] = useState('');
  const [bringing, setBringing] = useState('');

  const rsvpMutation = useMutation({
    mutationFn: (status: RsvpStatus) =>
      setRsvp({
        eventId,
        personId: myPerson!.id,
        userId: userId!,
        rsvp: status,
        comment: comment.trim() || null,
        bringing: bringing.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.eventParticipants(eventId) });
    },
    onError: (err) => Alert.alert('Fehler', friendlyError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.events(familyId) });
      navigation.goBack();
    },
    onError: (err) => Alert.alert('Fehler', friendlyError(err)),
  });

  if (eventQuery.isLoading) {
    return <Loading message="Event wird geladen …" />;
  }

  const event = eventQuery.data;
  if (!event) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Event nicht gefunden"
          message="Dieses Familienevent ist nicht mehr verfügbar."
        />
      </Screen>
    );
  }

  const meta = EVENT_TYPES[event.type];
  const vis = VISIBILITY_LEVELS[(event.visibility ?? 'family') as VisibilityLevel];
  const participants = participantsQuery.data ?? [];
  const moments = momentsQuery.data ?? [];

  const personName = (p?: Person | null) =>
    p ? fullName(p.first_name, p.last_name) : 'Familienmitglied';

  const onSelectRsvp = (status: RsvpStatus) => {
    if (!myPerson) return;
    setRsvpChoice(status);
    rsvpMutation.mutate(status);
  };

  const onSaveAnswer = () => {
    if (!myPerson || !rsvp) {
      Alert.alert('Antwort fehlt', 'Bitte wähle zuerst aus, ob du kommst.');
      return;
    }
    rsvpMutation.mutate(rsvp);
  };

  const onDelete = () => {
    Alert.alert(
      'Event löschen?',
      'Möchtest du dieses Familienevent wirklich löschen? Das Erinnerungsalbum bleibt im Familienfeed erhalten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  return (
    <Screen
      onRefresh={() => {
        eventQuery.refetch();
        participantsQuery.refetch();
        momentsQuery.refetch();
      }}
      refreshing={
        eventQuery.isRefetching ||
        participantsQuery.isRefetching ||
        momentsQuery.isRefetching
      }
    >
      <Card>
        <View style={styles.headerRow}>
          <View style={[styles.typeIcon, { backgroundColor: `${meta.color}22` }]}>
            <Ionicons name={meta.icon} size={30} color={meta.color} />
          </View>
          <View style={styles.headerText}>
            <AppText variant="title">{event.title}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {formatDate(event.event_date)}
              {event.event_time ? ` · ${event.event_time} Uhr` : ''}
            </AppText>
          </View>
          <View style={styles.badge}>
            <AppText variant="caption" color={colors.textSecondary}>
              {vis.emoji} {vis.label}
            </AppText>
          </View>
        </View>

        {event.description ? (
          <AppText variant="body" style={styles.description}>
            {event.description}
          </AppText>
        ) : null}

        {event.location ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={18} color={colors.textMuted} />
            <AppText variant="body" color={colors.textSecondary}>
              {event.location}
            </AppText>
          </View>
        ) : null}

        {event.host_person_id ? (
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            <AppText variant="body" color={colors.textSecondary}>
              Gastgeber: {personName(persons.find((p) => p.id === event.host_person_id))}
            </AppText>
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Meine Antwort" />
      {myPerson ? (
        <View style={styles.answerSection}>
          <View style={styles.rsvpRow}>
            {RSVP_ORDER.map((status) => {
              const rmeta = RSVP_META[status];
              const active = rsvp === status;
              return (
                <Pressable
                  key={status}
                  style={[
                    styles.rsvpButton,
                    { borderColor: active ? rmeta.color : colors.border },
                    active && { backgroundColor: `${rmeta.color}22` },
                  ]}
                  onPress={() => onSelectRsvp(status)}
                >
                  <AppText variant="display" center>
                    {rmeta.emoji}
                  </AppText>
                  <AppText
                    variant="label"
                    center
                    color={active ? rmeta.color : colors.textSecondary}
                  >
                    {rmeta.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <TextField
            label="Kommentar"
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Möchtest du etwas dazu sagen?"
          />

          <View style={styles.bringSection}>
            <TextField
              label="Mitbringen"
              value={bringing}
              onChangeText={setBringing}
              placeholder="Was bringst du mit?"
            />
            <View style={styles.chipRow}>
              {BRING_SUGGESTIONS.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  selected={bringing === suggestion}
                  onPress={() => setBringing(suggestion)}
                />
              ))}
            </View>
          </View>

          <Button
            label="Antwort speichern"
            icon="checkmark-circle-outline"
            onPress={onSaveAnswer}
            loading={rsvpMutation.isPending}
          />
        </View>
      ) : (
        <AppText variant="body" color={colors.textMuted} style={styles.note}>
          Du bist (noch) nicht als Person in dieser Familie hinterlegt und kannst
          deshalb nicht zu- oder absagen.
        </AppText>
      )}

      <SectionHeader title="Teilnehmer" />
      {participants.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Noch keine Antworten"
          message="Sobald die Eingeladenen antworten, erscheinen sie hier."
        />
      ) : (
        participants.map((p) => {
          const rmeta = p.rsvp ? RSVP_META[p.rsvp] : null;
          return (
            <Card key={p.id} style={styles.participantCard}>
              <View style={styles.participantRow}>
                <Avatar name={personName(p.person)} size={44} />
                <View style={styles.participantText}>
                  <AppText variant="bodyStrong">{personName(p.person)}</AppText>
                  {p.bringing ? (
                    <AppText variant="caption" color={colors.textMuted}>
                      Bringt mit: {p.bringing}
                    </AppText>
                  ) : null}
                  {p.comment ? (
                    <AppText variant="caption" color={colors.textSecondary}>
                      {p.comment}
                    </AppText>
                  ) : null}
                </View>
                {rmeta ? (
                  <View style={[styles.rsvpBadge, { backgroundColor: `${rmeta.color}22` }]}>
                    <AppText variant="caption" color={rmeta.color}>
                      {rmeta.emoji} {rmeta.label}
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.rsvpBadge}>
                    <AppText variant="caption" color={colors.textMuted}>
                      Offen
                    </AppText>
                  </View>
                )}
              </View>
            </Card>
          );
        })
      )}

      <SectionHeader title="Erinnerungsalbum" />
      <AppText variant="caption" color={colors.textMuted} style={styles.note}>
        Alle Fotos, Aufnahmen und Erinnerungen zu diesem Event werden hier
        automatisch gesammelt.
      </AppText>
      <Button
        label="Foto/Erinnerung hinzufügen"
        icon="add-circle-outline"
        variant="secondary"
        onPress={() => navigation.navigate('MomentCompose', { eventId })}
        style={styles.albumButton}
      />
      {moments.length === 0 ? (
        <EmptyState
          icon="images-outline"
          title="Noch keine Erinnerungen"
          message="Teilt nach dem Event eure schönsten Fotos und Momente."
        />
      ) : (
        moments.map((m) => (
          <Card key={m.id} style={styles.albumCard}>
            <View style={styles.albumHeader}>
              <Avatar name={m.author?.full_name} size={32} />
              <AppText variant="bodyStrong" style={styles.albumAuthor}>
                {m.author?.full_name ?? 'Familienmitglied'}
              </AppText>
            </View>
            <AlbumItem moment={m} />
          </Card>
        ))
      )}

      <Button
        label="Event löschen"
        icon="trash-outline"
        variant="danger"
        onPress={onDelete}
        loading={deleteMutation.isPending}
        style={styles.deleteButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  description: { marginTop: spacing.md },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  answerSection: { gap: spacing.md },
  rsvpRow: { flexDirection: 'row', gap: spacing.sm },
  rsvpButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  bringSection: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  note: { marginBottom: spacing.sm },
  participantCard: { marginBottom: spacing.sm },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  participantText: { flex: 1, gap: 2 },
  rsvpBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  albumButton: { marginBottom: spacing.md },
  albumCard: { marginBottom: spacing.sm, gap: spacing.sm },
  albumHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  albumAuthor: { flex: 1 },
  mediaWrapper: { position: 'relative' },
  media: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  audioIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quote: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  quoteText: { flex: 1, fontStyle: 'italic' },
  deleteButton: { marginTop: spacing.lg },
});
