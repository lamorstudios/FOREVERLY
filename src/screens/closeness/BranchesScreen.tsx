import { useState } from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Card,
  Button,
  TextField,
  Chip,
  EmptyState,
  Loading,
  SectionHeader,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { listPersons } from '@/api/persons';
import { listBranches, createBranch, setBranchMembers, deleteBranch } from '@/api/branches';
import { qk } from '@/api/queryKeys';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { FamilyBranch } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Branches'>;

export function BranchesScreen(_props: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<FamilyBranch | null>(null);
  const [draftMembers, setDraftMembers] = useState<string[]>([]);

  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const branchesQuery = useQuery({ queryKey: qk.branches(familyId), queryFn: () => listBranches(familyId) });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: qk.branches(familyId) });
  }

  const createMutation = useMutation({
    mutationFn: () => createBranch({ familyId, name: newName.trim(), createdBy: userId! }),
    onSuccess: () => {
      setNewName('');
      invalidate();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const membersMutation = useMutation({
    mutationFn: () => setBranchMembers(editing!.id, draftMembers),
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  if (branchesQuery.isLoading) return <Loading message="Familienzweige werden geladen …" />;

  const persons = personsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const nameOf = (id: string) => {
    const p = persons.find((x) => x.id === id);
    return p ? fullName(p.first_name, p.last_name) : '—';
  };

  function openEditor(b: FamilyBranch) {
    setEditing(b);
    setDraftMembers(b.member_ids ?? []);
  }
  function toggleMember(id: string) {
    setDraftMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function confirmDelete(b: FamilyBranch) {
    Alert.alert('Zweig löschen', `„${b.name}" löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteMutation.mutate(b.id) },
    ]);
  }

  return (
    <Screen onRefresh={() => branchesQuery.refetch()} refreshing={branchesQuery.isRefetching}>
      <View style={styles.intro}>
        <AppText variant="heading">Familienzweige</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Gruppiere deine Familie in Zweige (z.B. Vaterseite, Mutterseite,
          Patchwork) und teile Inhalte gezielt mit einem Zweig.
        </AppText>
      </View>

      {branches.length === 0 ? (
        <EmptyState icon="git-branch-outline" title="Noch keine Zweige" message="Lege deinen ersten Familienzweig an." />
      ) : (
        branches.map((b) => (
          <Card key={b.id}>
            <View style={styles.branchHead}>
              <View style={[styles.dot, { backgroundColor: b.color ?? colors.primary }]} />
              <AppText variant="subheading" style={styles.branchName}>
                {b.name}
              </AppText>
              <Pressable onPress={() => confirmDelete(b)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.memberChips}>
              {(b.member_ids ?? []).length === 0 ? (
                <AppText variant="caption" color={colors.textMuted}>
                  Noch keine Mitglieder
                </AppText>
              ) : (
                (b.member_ids ?? []).map((id) => <Chip key={id} label={nameOf(id)} />)
              )}
            </View>
            <Button label="Mitglieder bearbeiten" variant="secondary" icon="people-outline" onPress={() => openEditor(b)} />
          </Card>
        ))
      )}

      <SectionHeader title="Neuen Zweig anlegen" />
      <Card>
        <TextField label="Name des Zweigs" value={newName} onChangeText={setNewName} placeholder="z.B. Vaterseite" />
        <Button
          label="Zweig anlegen"
          icon="add"
          onPress={() => (newName.trim() ? createMutation.mutate() : null)}
          loading={createMutation.isPending}
        />
      </Card>

      {/* Mitglieder-Editor */}
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(null)}>
          <Pressable style={styles.sheet}>
            <AppText variant="subheading" style={styles.sheetTitle}>
              Mitglieder · {editing?.name}
            </AppText>
            <ScrollView style={styles.sheetList}>
              {persons.map((p) => {
                const selected = draftMembers.includes(p.id);
                return (
                  <Pressable key={p.id} style={styles.memberRow} onPress={() => toggleMember(p.id)}>
                    <Ionicons
                      name={selected ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                    <AppText variant="body">{fullName(p.first_name, p.last_name)}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button label="Speichern" onPress={() => membersMutation.mutate()} loading={membersMutation.isPending} />
            <Button label="Abbrechen" variant="ghost" onPress={() => setEditing(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  branchHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 16, height: 16, borderRadius: 8 },
  branchName: { flex: 1 },
  memberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.sm },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
    gap: spacing.sm,
  },
  sheetTitle: { marginBottom: spacing.sm },
  sheetList: { maxHeight: 340 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
