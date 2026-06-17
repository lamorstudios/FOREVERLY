import { View, StyleSheet, Alert } from 'react-native';
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
import { useAuth } from '@/context/AuthContext';
import { listPersons } from '@/api/persons';
import {
  listSmartInvites,
  revokeSmartInvite,
  acceptSmartInviteDemo,
  buildSmartInviteLink,
} from '@/api/smartInvites';
import { generateSuggestions } from '@/api/suggestions';
import { shareText } from '@/lib/share';
import { qk } from '@/api/queryKeys';
import { RELATIONSHIP_LABELS } from '@/constants/relationships';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { Invitation, InvitationStatus } from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'InvitesList'>;

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: 'Ausstehend',
  accepted: 'Angenommen',
  revoked: 'Zurückgezogen',
  expired: 'Abgelaufen',
};
const STATUS_COLOR: Record<InvitationStatus, string> = {
  pending: '#CC9A3F',
  accepted: '#5B8A5A',
  revoked: '#9C8F7E',
  expired: '#9C8F7E',
};

export function InvitesListScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const invitesQuery = useQuery({ queryKey: qk.smartInvites(familyId), queryFn: () => listSmartInvites(familyId) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: qk.smartInvites(familyId) });
    queryClient.invalidateQueries({ queryKey: qk.persons(familyId) });
    queryClient.invalidateQueries({ queryKey: qk.relationships(familyId) });
    queryClient.invalidateQueries({ queryKey: qk.suggestions(familyId) });
  }

  const acceptMutation = useMutation({
    mutationFn: async (code: string) => {
      await acceptSmartInviteDemo(code);
      await generateSuggestions(familyId, userId!);
    },
    onSuccess: () => {
      invalidateAll();
      Alert.alert('Beigetreten! 🎉', 'Die Person erscheint jetzt im Familiennetzwerk.');
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeSmartInvite(id),
    onSuccess: invalidateAll,
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function share(inv: Invitation) {
    const link = buildSmartInviteLink(inv.code);
    const text =
      'Du wurdest zu FAMII eingeladen ❤️\n\n' +
      'Gemeinsam könnt ihr Erinnerungen, Fotos und eure Familiengeschichte bewahren.\n\n' +
      'Einladung öffnen:\n' + link;
    void shareText(text);
  }

  if (invitesQuery.isLoading) return <Loading message="Einladungen werden geladen …" />;

  const invites = invitesQuery.data ?? [];
  const persons = personsQuery.data ?? [];
  const nameOf = (id?: string | null) => {
    const p = id ? persons.find((x) => x.id === id) : null;
    return p ? fullName(p.first_name, p.last_name) : 'Familienmitglied';
  };

  return (
    <Screen onRefresh={() => invitesQuery.refetch()} refreshing={invitesQuery.isRefetching}>
      <View style={styles.intro}>
        <AppText variant="heading">Einladungen</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Lade Familienmitglieder per Link ein – sie erscheinen nach der
          Registrierung automatisch im Netzwerk.
        </AppText>
      </View>

      <Button label="Familienmitglied einladen" icon="person-add-outline" onPress={() => navigation.navigate('SmartInvite')} />

      <SectionHeader title="Gesendete Einladungen" />
      {invites.length === 0 ? (
        <EmptyState icon="mail-outline" title="Noch keine Einladungen" message="Erstelle deine erste persönliche Einladung." />
      ) : (
        invites.map((inv) => (
          <Card key={inv.id}>
            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-add" size={20} color={colors.primaryDark} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="subheading">{nameOf(inv.person_id)}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {inv.relationship_type ? RELATIONSHIP_LABELS[inv.relationship_type] : 'Familienmitglied'}
                  {'  ·  Code: '}
                  {inv.code}
                </AppText>
              </View>
              <Chip label={STATUS_LABEL[inv.status]} color={STATUS_COLOR[inv.status]} />
            </View>
            <View style={styles.actions}>
              <Button label="Teilen" icon="share-social-outline" variant="secondary" fullWidth={false} style={styles.actionBtn} onPress={() => share(inv)} />
              {inv.status === 'pending' ? (
                <>
                  <Button label="Annehmen (Vorschau)" icon="checkmark-done-outline" variant="secondary" fullWidth={false} style={styles.actionBtn} loading={acceptMutation.isPending} onPress={() => acceptMutation.mutate(inv.code)} />
                  <Button label="Zurückziehen" icon="close-outline" variant="ghost" fullWidth={false} style={styles.actionBtn} onPress={() => revokeMutation.mutate(inv.id)} />
                </>
              ) : null}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flexGrow: 1 },
});
