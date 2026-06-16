import { View, Pressable, StyleSheet, Alert, Linking } from 'react-native';
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
  SectionHeader,
} from '@/components';
import { colors, spacing, radius, shadow } from '@/theme';
import { qk } from '@/api/queryKeys';
import {
  listEmergencyContacts,
  listEmergencyEvents,
  triggerEmergency,
  resolveEmergency,
  deleteEmergencyContact,
} from '@/api/emergency';
import { listPersons } from '@/api/persons';
import { listTrustedContacts } from '@/api/trustedContacts';
import { TRUSTED_ROLES } from '@/constants/trusted';
import { formatDateTime, fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { EmergencyContact, EmergencyEvent, Person } from '@/types/models';

/**
 * Simulierter Standort für den Notfall (Demo-Modus).
 * Die Architektur unterstützt echtes GPS: hier kann später `expo-location`
 * eingebunden werden (z. B. `Location.getCurrentPositionAsync()`), um
 * `latitude`/`longitude` mit echten Koordinaten zu befüllen.
 */
const DEMO_LOCATION = {
  latitude: 53.8655,
  longitude: 10.6866,
  label: 'Lübeck (simuliert)',
} as const;

export function EmergencyScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'Emergency'>) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: qk.emergencyContacts(familyId),
    queryFn: () => listEmergencyContacts(familyId),
  });
  const eventsQuery = useQuery({
    queryKey: qk.emergencyEvents(familyId),
    queryFn: () => listEmergencyEvents(familyId),
  });
  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });

  const trustedQuery = useQuery({
    queryKey: qk.trustedContacts(familyId),
    queryFn: () => listTrustedContacts(familyId),
  });

  const contacts = contactsQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const persons = personsQuery.data ?? [];
  const trusted = trustedQuery.data ?? [];

  // Vertrauenspersonen nach zugeordnetem Familienmitglied gruppieren
  const trustedByPerson = persons
    .map((p) => ({
      person: p,
      list: trusted.filter((t) => t.person_id === p.id),
    }))
    .filter((g) => g.list.length > 0);

  async function callTrusted(phone: string | null) {
    if (!phone) {
      Alert.alert('Keine Nummer', 'Für diese Person ist keine Telefonnummer hinterlegt.');
      return;
    }
    const url = `tel:${phone.replace(/\s/g, '')}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else throw new Error('not supported');
    } catch {
      Alert.alert('Anrufen', `Anruf an ${phone} (in der Vorschau simuliert).`);
    }
  }

  const triggerMutation = useMutation({
    mutationFn: () =>
      triggerEmergency({
        familyId,
        triggeredBy: userId!,
        latitude: DEMO_LOCATION.latitude,
        longitude: DEMO_LOCATION.longitude,
        locationLabel: DEMO_LOCATION.label,
        message: 'SOS über FAMII ausgelöst',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.emergencyEvents(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.notifications(familyId) });
      Alert.alert(
        'Notfall ausgelöst',
        'Deine Notfallkontakte wurden benachrichtigt (simuliert). Der Notfall erscheint jetzt für deine Familie.',
      );
    },
    onError: (e) => {
      Alert.alert('Fehler', friendlyError(e));
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveEmergency(id, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.emergencyEvents(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.notifications(familyId) });
    },
    onError: (e) => {
      Alert.alert('Fehler', friendlyError(e));
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => deleteEmergencyContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qk.emergencyContacts(familyId),
      });
    },
    onError: (e) => {
      Alert.alert('Fehler', friendlyError(e));
    },
  });

  function handleRefresh() {
    contactsQuery.refetch();
    eventsQuery.refetch();
    personsQuery.refetch();
    trustedQuery.refetch();
  }

  function triggererName(event: EmergencyEvent): string {
    const person = persons.find((p) => p.user_id === event.triggered_by);
    if (person) return fullName(person.first_name, person.last_name);
    return 'Ein Familienmitglied';
  }

  function handleSos() {
    Alert.alert(
      'Notfall auslösen?',
      'Deine Notfallkontakte werden benachrichtigt und dein Standort vorbereitet.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Notfall auslösen',
          style: 'destructive',
          onPress: () => triggerMutation.mutate(),
        },
      ],
    );
  }

  function confirmResolve(event: EmergencyEvent) {
    Alert.alert(
      'Notfall als gelöst markieren?',
      'Die Familie wird sehen, dass dieser Notfall beendet ist.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Als gelöst markieren',
          onPress: () => resolveMutation.mutate(event.id),
        },
      ],
    );
  }

  function confirmDeleteContact(contact: EmergencyContact) {
    Alert.alert(
      'Kontakt löschen',
      `Möchtest du „${contact.name}“ wirklich aus den Notfallkontakten entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteContactMutation.mutate(contact.id),
        },
      ],
    );
  }

  const activeEvents = events.filter((e) => e.state === 'active');
  const resolvedEvents = events.filter((e) => e.state === 'resolved');
  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  if (
    contactsQuery.isLoading ||
    eventsQuery.isLoading ||
    personsQuery.isLoading
  ) {
    return (
      <Screen>
        <Loading message="Notfallbereich wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={
        contactsQuery.isFetching || eventsQuery.isFetching
      }
      onRefresh={handleRefresh}
    >
      <AppText variant="display">Notfall</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Im Notfall benachrichtigt FAMII deine hinterlegten Kontakte und
        teilt deinen Standort.
      </AppText>

      {/* Großer SOS-Auslöser */}
      <View style={styles.sosWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notfall auslösen"
          onPress={handleSos}
          disabled={triggerMutation.isPending}
          style={({ pressed }) => [
            styles.sosButton,
            pressed && styles.sosButtonPressed,
            triggerMutation.isPending && styles.sosButtonDisabled,
          ]}
        >
          <Ionicons
            name="warning"
            size={48}
            color={colors.textOnAccent}
          />
          <AppText
            variant="display"
            color={colors.textOnAccent}
            style={styles.sosLabel}
          >
            SOS
          </AppText>
          <AppText variant="bodyStrong" color={colors.textOnAccent} center>
            {triggerMutation.isPending ? 'Wird ausgelöst …' : 'Hier drücken'}
          </AppText>
        </Pressable>
      </View>

      {/* Aktive Notfälle */}
      {activeEvents.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Aktive Notfälle" />
          <View style={styles.list}>
            {activeEvents.map((event) => (
              <Card key={event.id} style={styles.activeCard}>
                <View style={styles.activeHeader}>
                  <Ionicons name="alert-circle" size={28} color={colors.error} />
                  <AppText variant="subheading" color={colors.error}>
                    Aktiver Notfall
                  </AppText>
                </View>
                <AppText variant="bodyStrong" style={styles.activeRow}>
                  {triggererName(event)}
                </AppText>
                <AppText variant="body" color={colors.textSecondary}>
                  {formatDateTime(event.created_at)}
                </AppText>
                {event.location_label ? (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <AppText variant="body" color={colors.textSecondary}>
                      {event.location_label}
                    </AppText>
                  </View>
                ) : null}
                {event.message ? (
                  <AppText variant="body" style={styles.activeMessage}>
                    {event.message}
                  </AppText>
                ) : null}
                <Button
                  label="Als gelöst markieren"
                  icon="checkmark-circle-outline"
                  variant="secondary"
                  loading={resolveMutation.isPending}
                  onPress={() => confirmResolve(event)}
                  style={styles.resolveButton}
                />
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {/* Vertrauenspersonen vor Ort (Trusted Circle) */}
      {trustedByPerson.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Vertrauenspersonen vor Ort" />
          <View style={styles.list}>
            {trustedByPerson.map((group) => (
              <Card key={group.person.id}>
                <AppText variant="bodyStrong">
                  In der Nähe von {fullName(group.person.first_name, group.person.last_name)} erreichbar:
                </AppText>
                {group.list.map((t) => (
                  <View key={t.id} style={styles.trustedRow}>
                    <Ionicons
                      name={t.is_emergency ? 'shield-checkmark' : TRUSTED_ROLES[t.role].icon}
                      size={20}
                      color={t.is_emergency ? colors.error : colors.relationMarried}
                    />
                    <View style={styles.trustedBody}>
                      <AppText variant="body">
                        {t.name}
                        <AppText variant="caption" color={colors.textMuted}>
                          {`  ${TRUSTED_ROLES[t.role].label}`}
                        </AppText>
                      </AppText>
                      {t.phone ? (
                        <AppText variant="caption" color={colors.textSecondary}>
                          {t.phone}
                        </AppText>
                      ) : null}
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={() => callTrusted(t.phone)}
                      accessibilityLabel={`${t.name} anrufen`}
                    >
                      <Ionicons name="call" size={22} color={colors.success} />
                    </Pressable>
                  </View>
                ))}
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {/* Notfallkontakte */}
      <View style={styles.section}>
        <SectionHeader
          title="Notfallkontakte"
          actionLabel="+ Kontakt hinzufügen"
          onAction={() => navigation.navigate('EmergencyContactForm')}
        />
        {sortedContacts.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Noch keine Notfallkontakte"
            message="Hinterlege Personen, die im Notfall benachrichtigt werden sollen."
            actionLabel="Kontakt hinzufügen"
            onAction={() => navigation.navigate('EmergencyContactForm')}
          />
        ) : (
          <View style={styles.list}>
            {sortedContacts.map((contact) => (
              <Card key={contact.id}>
                <View style={styles.contactRow}>
                  <View style={styles.contactIcon}>
                    <Ionicons
                      name="call-outline"
                      size={26}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.contactBody}>
                    <AppText variant="subheading">{contact.name}</AppText>
                    {contact.relation ? (
                      <AppText variant="caption" color={colors.textMuted}>
                        {contact.relation}
                      </AppText>
                    ) : null}
                    {contact.phone ? (
                      <View style={styles.metaRow}>
                        <Ionicons
                          name="call"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <AppText variant="body" color={colors.textSecondary}>
                          {contact.phone}
                        </AppText>
                      </View>
                    ) : null}
                    {contact.note ? (
                      <AppText
                        variant="body"
                        color={colors.textSecondary}
                        style={styles.contactNote}
                      >
                        {contact.note}
                      </AppText>
                    ) : null}
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() => confirmDeleteContact(contact)}
                    style={styles.trash}
                    accessibilityLabel={`${contact.name} löschen`}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={24}
                      color={colors.error}
                    />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* Verlauf (gelöste Notfälle) */}
      {resolvedEvents.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Verlauf" />
          <View style={styles.list}>
            {resolvedEvents.map((event) => (
              <Card key={event.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color={colors.success}
                  />
                  <View style={styles.historyBody}>
                    <AppText variant="body" color={colors.textSecondary}>
                      {triggererName(event)}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {formatDateTime(event.created_at)}
                      {event.location_label ? ` · ${event.location_label}` : ''}
                    </AppText>
                    <AppText variant="caption" color={colors.success}>
                      Gelöst
                      {event.resolved_at
                        ? ` · ${formatDateTime(event.resolved_at)}`
                        : ''}
                    </AppText>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: spacing.xs, marginBottom: spacing.lg },
  sosWrap: { alignItems: 'center', marginBottom: spacing.xl },
  sosButton: {
    width: 240,
    height: 240,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadow.card,
  },
  sosButtonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  sosButtonDisabled: { opacity: 0.6 },
  sosLabel: { letterSpacing: 2 },
  section: { marginBottom: spacing.xl },
  list: { gap: spacing.md },
  activeCard: {
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  activeRow: { marginTop: spacing.xs },
  activeMessage: { marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  resolveButton: { marginTop: spacing.md },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBody: { flex: 1, gap: spacing.xs },
  contactNote: { marginTop: spacing.xs },
  trash: { padding: spacing.xs },
  trustedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  trustedBody: { flex: 1 },
  historyCard: { backgroundColor: colors.surfaceAlt },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  historyBody: { flex: 1, gap: 2 },
});
