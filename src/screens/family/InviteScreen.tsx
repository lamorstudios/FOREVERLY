import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  Card,
  SelectField,
  SectionHeader,
  EmptyState,
  Loading,
} from '@/components';
import type { SelectOption } from '@/components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
  buildInviteLink,
} from '@/api/invitations';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { confirmAsync, notify } from '@/lib/confirm';
import { shareText, copyText } from '@/lib/share';
import { formatDate } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type {
  Invitation,
  InvitationStatus,
  MemberRole,
} from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'Invite'>;

const ROLE_OPTIONS: SelectOption<MemberRole>[] = [
  { value: 'member', label: 'Mitglied' },
  { value: 'admin', label: 'Administrator' },
];

const STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: 'Offen',
  accepted: 'Angenommen',
  revoked: 'Zurückgezogen',
  expired: 'Abgelaufen',
};

export function InviteScreen() {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const [role, setRole] = useState<MemberRole>('member');
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: qk.invitations(familyId),
    queryFn: () => listInvitations(familyId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createInvitation({ familyId, invitedBy: userId!, role }),
    onSuccess: (invitation) => {
      setCreatedCode(invitation.code);
      queryClient.invalidateQueries({ queryKey: qk.invitations(familyId) });
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invitations(familyId) });
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function handleShare(code: string) {
    const link = buildInviteLink(code);
    const text =
      'Du wurdest zu FAMII eingeladen ❤️\n\n' +
      'Gemeinsam könnt ihr Erinnerungen, Fotos und eure Familiengeschichte bewahren.\n\n' +
      `Einladungscode: ${code}\n\nEinladung öffnen:\n${link}`;
    void shareText(text);
  }

  async function handleRevoke(invitation: Invitation) {
    const ok = await confirmAsync({
      title: 'Einladung zurückziehen',
      message: 'Möchtest du diese Einladung wirklich zurückziehen?',
      confirmLabel: 'Zurückziehen',
      destructive: true,
    });
    if (ok) revokeMutation.mutate(invitation.id);
  }

  const invitations = data ?? [];

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <AppText variant="display" style={styles.title}>
        Mitglieder einladen
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Erstelle einen Einladungscode und teile ihn mit deiner Familie.
      </AppText>

      <View style={styles.createBlock}>
        <SelectField<MemberRole>
          label="Rolle der eingeladenen Person"
          value={role}
          options={ROLE_OPTIONS}
          onChange={setRole}
        />
        <Button
          label="Einladung erstellen"
          icon="mail-outline"
          loading={createMutation.isPending}
          onPress={() => createMutation.mutate()}
        />
      </View>

      {createdCode ? (
        <Card style={styles.codeCard}>
          <AppText variant="label" color={colors.textSecondary} center>
            Einladungscode
          </AppText>
          <AppText variant="display" center style={styles.code}>
            {createdCode}
          </AppText>
          <AppText variant="caption" color={colors.textMuted} center>
            FAMII Einladungslink bereit zum Teilen
          </AppText>
          <Button
            label="Teilen"
            icon="share-social-outline"
            onPress={() => handleShare(createdCode)}
          />
          <Button
            label="Link kopieren"
            icon="copy-outline"
            variant="secondary"
            onPress={async () => {
              const ok = await copyText(buildInviteLink(createdCode));
              notify('Einladungslink', ok ? 'Link in die Zwischenablage kopiert.' : buildInviteLink(createdCode));
            }}
          />
        </Card>
      ) : null}

      <SectionHeader title="Einladungen" />

      {isLoading ? (
        <Loading message="Einladungen werden geladen …" />
      ) : invitations.length === 0 ? (
        <EmptyState
          icon="mail-open-outline"
          title="Noch keine Einladungen"
          message="Erstelle oben eine Einladung, um Mitglieder hinzuzufügen."
        />
      ) : (
        <View style={styles.list}>
          {invitations.map((invitation) => (
            <Card key={invitation.id} style={styles.inviteCard}>
              <View style={styles.inviteRow}>
                <View style={styles.inviteInfo}>
                  <AppText variant="bodyStrong">{invitation.code}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {STATUS_LABELS[invitation.status]} ·{' '}
                    {invitation.role === 'admin' ? 'Admin' : 'Mitglied'} ·
                    erstellt am {formatDate(invitation.created_at)}
                  </AppText>
                </View>
              </View>
              {invitation.status === 'pending' ? (
                <View style={styles.inviteActions}>
                  <Button
                    label="Teilen"
                    icon="share-social-outline"
                    variant="secondary"
                    fullWidth={false}
                    style={styles.inviteButton}
                    onPress={() => handleShare(invitation.code)}
                  />
                  <Button
                    label="Zurückziehen"
                    icon="close-circle-outline"
                    variant="danger"
                    fullWidth={false}
                    style={styles.inviteButton}
                    loading={
                      revokeMutation.isPending &&
                      revokeMutation.variables === invitation.id
                    }
                    onPress={() => handleRevoke(invitation)}
                  />
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.sm },
  intro: { marginBottom: spacing.lg },
  createBlock: { gap: spacing.md, marginBottom: spacing.lg },
  codeCard: { gap: spacing.sm, marginBottom: spacing.lg },
  code: { letterSpacing: 4 },
  list: { gap: spacing.md },
  inviteCard: { gap: spacing.md },
  inviteRow: { flexDirection: 'row', alignItems: 'center' },
  inviteInfo: { flex: 1, gap: spacing.xs },
  inviteActions: { flexDirection: 'row', gap: spacing.sm },
  inviteButton: { flex: 1 },
});
