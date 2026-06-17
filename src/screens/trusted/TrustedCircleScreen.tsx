import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Linking, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  Loading,
  SectionHeader,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { listPersons } from '@/api/persons';
import {
  listTrustedContacts,
  updateTrustedContact,
  deleteTrustedContact,
} from '@/api/trustedContacts';
import { qk } from '@/api/queryKeys';
import { TRUSTED_ROLES } from '@/constants/trusted';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { confirmAsync } from '@/lib/confirm';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { TrustedContact } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrustedCircle'>;

export function TrustedCircleScreen({ navigation, route }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();
  const [personId, setPersonId] = useState<string | null>(route.params?.personId ?? null);

  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });
  const contactsQuery = useQuery({
    queryKey: qk.trustedContacts(familyId, personId ?? undefined),
    queryFn: () => listTrustedContacts(familyId, personId ?? undefined),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['trustedContacts', familyId] });
  }

  const toggleEmergency = useMutation({
    mutationFn: (c: TrustedContact) =>
      updateTrustedContact(c.id, { is_emergency: !c.is_emergency }),
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const removeContact = useMutation({
    mutationFn: (id: string) => deleteTrustedContact(id),
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  async function contactAction(action: 'tel' | 'sms', value: string | null) {
    if (!value) {
      Alert.alert('Keine Nummer', 'Für diese Person ist keine Telefonnummer hinterlegt.');
      return;
    }
    const url = `${action}:${value.replace(/\s/g, '')}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else throw new Error('not supported');
    } catch {
      Alert.alert(
        action === 'tel' ? 'Anrufen' : 'Nachricht',
        `${action === 'tel' ? 'Anruf an' : 'Nachricht an'} ${value} (in der Vorschau simuliert).`,
      );
    }
  }

  function nudge(name: string) {
    Alert.alert(`${name} angestupst`, 'Wir haben deinen Gruß übermittelt. (Demo)');
  }

  async function confirmDelete(c: TrustedContact) {
    const ok = await confirmAsync({
      title: 'Vertrauensperson entfernen',
      message: `${c.name} aus dem Vertrauenskreis entfernen?`,
      confirmLabel: 'Entfernen',
      destructive: true,
    });
    if (ok) removeContact.mutate(c.id);
  }

  const persons = personsQuery.data ?? [];
  const contacts = contactsQuery.data ?? [];

  if (contactsQuery.isLoading) return <Loading message="Vertrauenskreis wird geladen …" />;

  return (
    <Screen
      onRefresh={() => {
        personsQuery.refetch();
        contactsQuery.refetch();
      }}
      refreshing={contactsQuery.isRefetching}
    >
      <View style={styles.intro}>
        <View style={styles.shieldRow}>
          <Ionicons name="shield-checkmark" size={26} color={colors.relationMarried} />
          <AppText variant="heading">Vertrauenskreis</AppText>
        </View>
        <AppText variant="body" color={colors.textSecondary}>
          Vertrauenspersonen aus dem Umfeld eures Familienmitglieds – z.B. Nachbarn
          oder Pflegekontakte. Sie haben <AppText variant="bodyStrong">keinen Zugriff</AppText>{' '}
          auf eure Familieninhalte und sind nur als Kontakt- und Notfallpersonen hinterlegt.
        </AppText>
      </View>

      {/* Person-Auswahl */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Alle" selected={personId === null} onPress={() => setPersonId(null)} />
        {persons.map((p) => (
          <Chip
            key={p.id}
            label={p.first_name}
            selected={personId === p.id}
            onPress={() => setPersonId(p.id)}
          />
        ))}
      </ScrollView>

      <SectionHeader
        title="Vertrauenspersonen"
        actionLabel="+ Hinzufügen"
        onAction={() =>
          navigation.navigate('TrustedContactForm', { personId: personId ?? undefined })
        }
      />

      {contacts.length === 0 ? (
        <EmptyState
          icon="shield-outline"
          title="Noch keine Vertrauenspersonen"
          message="Füge eine vertraute Person aus dem Umfeld hinzu – etwa einen Nachbarn oder Pflegekontakt."
          actionLabel="Vertrauensperson hinzufügen"
          onAction={() =>
            navigation.navigate('TrustedContactForm', { personId: personId ?? undefined })
          }
        />
      ) : (
        contacts.map((c) => {
          const meta = TRUSTED_ROLES[c.role];
          const assigned = fullName(c.person?.first_name, c.person?.last_name);
          return (
            <Card key={c.id}>
              <View style={styles.head}>
                <View style={[styles.roleIcon, c.is_emergency && styles.roleIconEmergency]}>
                  <Ionicons
                    name={meta.icon}
                    size={22}
                    color={c.is_emergency ? colors.textOnAccent : colors.primaryDark}
                  />
                </View>
                <View style={styles.headText}>
                  <AppText variant="subheading">{c.name}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {meta.label}
                    {assigned ? ` · für ${assigned}` : ''}
                  </AppText>
                </View>
                <Pressable onPress={() => confirmDelete(c)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              {c.is_emergency ? (
                <View style={styles.badge}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <AppText variant="caption" color={colors.error}>
                    Notfallkontakt
                  </AppText>
                </View>
              ) : null}

              {c.phone ? (
                <AppText variant="body" color={colors.textSecondary}>
                  📞 {c.phone}
                </AppText>
              ) : null}
              {c.note ? (
                <AppText variant="body" color={colors.textSecondary}>
                  {c.note}
                </AppText>
              ) : null}

              <View style={styles.actions}>
                <Button label="Anrufen" icon="call-outline" variant="secondary" fullWidth={false} onPress={() => contactAction('tel', c.phone)} style={styles.actionBtn} />
                <Button label="Nachricht" icon="chatbubble-outline" variant="secondary" fullWidth={false} onPress={() => contactAction('sms', c.phone)} style={styles.actionBtn} />
                <Button label="Anstupsen" icon="hand-left-outline" variant="secondary" fullWidth={false} onPress={() => nudge(c.name)} style={styles.actionBtn} />
              </View>
              <Button
                label={c.is_emergency ? 'Notfallkontakt entfernen' : 'Als Notfallkontakt markieren'}
                icon={c.is_emergency ? 'star' : 'star-outline'}
                variant="ghost"
                onPress={() => toggleEmergency.mutate(c)}
              />
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm },
  shieldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headText: { flex: 1, gap: 2 },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconEmergency: { backgroundColor: colors.error },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionBtn: { flexGrow: 1, paddingHorizontal: spacing.sm },
});
