import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  Card,
  Avatar,
  EmptyState,
  Loading,
} from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMembers, updateMemberRole, removeMember } from '@/api/families';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { confirmAsync } from '@/lib/confirm';
import { colors, spacing, radius } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { FamilyMember, MemberRole } from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'Members'>;

export function MembersScreen() {
  const { activeFamily, isAdmin } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: qk.members(familyId),
    queryFn: () => listMembers(familyId),
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: MemberRole }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.members(familyId) });
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.members(familyId) });
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  async function handleToggleRole(member: FamilyMember) {
    const nextRole: MemberRole = member.role === 'admin' ? 'member' : 'admin';
    const label =
      nextRole === 'admin' ? 'zum Administrator machen' : 'zum Mitglied machen';
    const ok = await confirmAsync({
      title: 'Rolle ändern',
      message: `Möchtest du ${member.profile?.full_name ?? 'dieses Mitglied'} ${label}?`,
      confirmLabel: 'Ändern',
    });
    if (ok) roleMutation.mutate({ memberId: member.id, role: nextRole });
  }

  async function handleRemove(member: FamilyMember) {
    const ok = await confirmAsync({
      title: 'Mitglied entfernen',
      message: `Möchtest du ${member.profile?.full_name ?? 'dieses Mitglied'} wirklich aus der Familie entfernen?`,
      confirmLabel: 'Entfernen',
      destructive: true,
    });
    if (ok) removeMutation.mutate(member.id);
  }

  if (isLoading) {
    return (
      <Screen>
        <Loading message="Mitglieder werden geladen …" />
      </Screen>
    );
  }

  const members = data ?? [];

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <AppText variant="display" style={styles.title}>
        Mitglieder
      </AppText>

      {members.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Noch keine Mitglieder"
          message="Lade Familienmitglieder ein, um gemeinsam Erinnerungen zu teilen."
        />
      ) : (
        <View style={styles.list}>
          {members.map((member) => {
            const isSelf = member.user_id === userId;
            const name = member.profile?.full_name ?? 'Unbekanntes Mitglied';
            return (
              <Card key={member.id} style={styles.card}>
                <View style={styles.row}>
                  {member.profile?.avatar_url ? (
                    <SignedImage
                      bucket="avatars"
                      path={member.profile.avatar_url}
                      style={styles.avatar}
                    />
                  ) : (
                    <Avatar name={name} size={56} />
                  )}
                  <View style={styles.info}>
                    <AppText variant="bodyStrong" numberOfLines={2}>
                      {name}
                      {isSelf ? ' (Du)' : ''}
                    </AppText>
                    <View
                      style={[
                        styles.badge,
                        member.role === 'admin'
                          ? styles.badgeAdmin
                          : styles.badgeMember,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={
                          member.role === 'admin'
                            ? colors.textOnAccent
                            : colors.textSecondary
                        }
                      >
                        {member.role === 'admin' ? 'Admin' : 'Mitglied'}
                      </AppText>
                    </View>
                  </View>
                </View>

                {isAdmin && !isSelf ? (
                  <View style={styles.actions}>
                    <Button
                      label={
                        member.role === 'admin'
                          ? 'Zu Mitglied machen'
                          : 'Zu Admin machen'
                      }
                      variant="secondary"
                      fullWidth={false}
                      style={styles.actionButton}
                      loading={
                        roleMutation.isPending &&
                        roleMutation.variables?.memberId === member.id
                      }
                      onPress={() => handleToggleRole(member)}
                    />
                    <Button
                      label="Entfernen"
                      icon="trash-outline"
                      variant="danger"
                      fullWidth={false}
                      style={styles.actionButton}
                      loading={
                        removeMutation.isPending &&
                        removeMutation.variables === member.id
                      }
                      onPress={() => handleRemove(member)}
                    />
                  </View>
                ) : null}

                {isAdmin && isSelf ? (
                  <AppText variant="caption" color={colors.textMuted}>
                    Du kannst deine eigene Rolle hier nicht ändern oder dich
                    selbst entfernen.
                  </AppText>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  info: { flex: 1, minWidth: 0, gap: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeAdmin: { backgroundColor: colors.primary },
  badgeMember: { backgroundColor: colors.surfaceAlt },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
});
