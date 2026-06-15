import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Card,
  Avatar,
  TextField,
  SectionHeader,
  EmptyState,
  Loading,
} from '@/components';
import { listStatuses, setStatus } from '@/api/status';
import { listPersons } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { fullName, formatRelative } from '@/lib/format';
import { STATUS_LEVELS, STATUS_ORDER } from '@/constants/phase2';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { StatusLevel, MemberStatus, Person } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Status'>;

export function StatusScreen(_props: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');

  const statusesQuery = useQuery({
    queryKey: qk.statuses(familyId),
    queryFn: () => listStatuses(familyId),
  });

  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });

  const statuses = statusesQuery.data ?? [];
  const persons = personsQuery.data ?? [];

  const myPerson = persons.find((p) => p.user_id === userId) ?? null;
  const myStatus = myPerson
    ? statuses.find((s) => s.person_id === myPerson.id) ?? null
    : null;
  const selectedLevel = myStatus?.level ?? null;

  const mutation = useMutation({
    mutationFn: (level: StatusLevel) => {
      if (!myPerson) {
        throw new Error('Es konnte kein eigenes Profil gefunden werden.');
      }
      return setStatus({
        familyId,
        personId: myPerson.id,
        personName: fullName(myPerson.first_name, myPerson.last_name),
        level,
        message: message.trim() ? message.trim() : null,
        updatedBy: userId!,
      });
    },
    onSuccess: (_data, level) => {
      queryClient.invalidateQueries({ queryKey: qk.statuses(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.notifications(familyId) });
      if (STATUS_LEVELS[level].isAlert) {
        Alert.alert(
          'Familie benachrichtigt',
          'Deine ausgewählten Familienmitglieder wurden über deinen Status informiert. Sie melden sich bei dir.',
        );
      }
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function handleRefresh() {
    statusesQuery.refetch();
    personsQuery.refetch();
  }

  if (statusesQuery.isLoading || personsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Familienstatus wird geladen …" />
      </Screen>
    );
  }

  const isRefreshing =
    statusesQuery.isRefetching || personsQuery.isRefetching;

  return (
    <Screen refreshing={isRefreshing} onRefresh={handleRefresh}>
      <AppText variant="display" style={styles.title}>
        Familienstatus
      </AppText>

      <View style={styles.section}>
        <SectionHeader title="Mein Status" />
        {myPerson ? (
          <>
            <AppText variant="body" color={colors.textSecondary}>
              Wie geht es dir heute? Tippe auf eine Antwort.
            </AppText>
            <View style={styles.options}>
              {STATUS_ORDER.map((level) => {
                const meta = STATUS_LEVELS[level];
                const isSelected = selectedLevel === level;
                const isPending =
                  mutation.isPending && mutation.variables === level;
                return (
                  <Pressable
                    key={level}
                    onPress={() => mutation.mutate(level)}
                    disabled={mutation.isPending}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        borderColor: isSelected ? meta.color : colors.border,
                        backgroundColor: isSelected
                          ? `${meta.color}22`
                          : colors.surface,
                      },
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionEmojiWrap,
                        { backgroundColor: `${meta.color}22` },
                      ]}
                    >
                      <AppText style={styles.optionEmoji}>{meta.emoji}</AppText>
                    </View>
                    <AppText
                      variant="subheading"
                      color={isSelected ? meta.color : colors.textPrimary}
                      style={styles.optionLabel}
                    >
                      {meta.label}
                    </AppText>
                    {isPending ? (
                      <AppText variant="caption" color={colors.textMuted}>
                        …
                      </AppText>
                    ) : isSelected ? (
                      <View
                        style={[styles.check, { backgroundColor: meta.color }]}
                      >
                        <AppText
                          variant="bodyStrong"
                          color={colors.textOnAccent}
                        >
                          ✓
                        </AppText>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <TextField
              label="Nachricht (optional)"
              hint="Ein kurzer Gruß oder eine Notiz an deine Familie."
              value={message}
              onChangeText={setMessage}
            />
          </>
        ) : (
          <EmptyState
            icon="person-outline"
            title="Kein eigenes Profil"
            message="Für dich wurde noch kein Profil im Familiennetzwerk angelegt."
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Familie" />
        {statuses.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Noch keine Statusmeldungen"
            message="Sobald Familienmitglieder ihren Status setzen, erscheint er hier."
          />
        ) : (
          <View style={styles.list}>
            {statuses.map((status) => (
              <FamilyStatusCard
                key={status.id}
                status={status}
                person={
                  status.person ??
                  persons.find((p) => p.id === status.person_id) ??
                  null
                }
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function FamilyStatusCard({
  status,
  person,
}: {
  status: MemberStatus;
  person: Person | null;
}) {
  const meta = STATUS_LEVELS[status.level];
  const name = person
    ? fullName(person.first_name, person.last_name)
    : 'Familienmitglied';

  return (
    <Card style={styles.familyCard}>
      <View style={styles.familyRow}>
        <Avatar name={person?.first_name ?? name} size={56} />
        <View style={styles.familyInfo}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {name}
          </AppText>
          <View style={styles.familyStatusRow}>
            <AppText style={styles.familyEmoji}>{meta.emoji}</AppText>
            <AppText variant="label" color={meta.color}>
              {meta.label}
            </AppText>
          </View>
          {status.message ? (
            <AppText variant="body" color={colors.textSecondary}>
              {status.message}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.textMuted}>
            {formatRelative(status.updated_at)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  section: { gap: spacing.sm, marginBottom: spacing.xl },
  options: { gap: spacing.sm, marginTop: spacing.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 72,
  },
  optionPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
  optionEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: { fontSize: 28 },
  optionLabel: { flex: 1 },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.md, marginTop: spacing.xs },
  familyCard: {},
  familyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  familyInfo: { flex: 1, gap: spacing.xs },
  familyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  familyEmoji: { fontSize: 20 },
});
