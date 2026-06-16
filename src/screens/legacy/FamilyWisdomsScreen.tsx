import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, TextField, Loading, EmptyState } from '@/components';
import { listFamilyWisdoms, addFamilyWisdom } from '@/api/legacyMoments';
import { listPersons } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { fullName, formatRelative } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'FamilyWisdoms'>;

export function FamilyWisdomsScreen(_: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const wisdomsQuery = useQuery({ queryKey: qk.familyWisdoms(familyId), queryFn: () => listFamilyWisdoms(familyId) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });

  const [text, setText] = useState('');
  const [author, setAuthor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const persons = personsQuery.data ?? [];
  const nameOf = (id: string | null) => {
    const p = id ? persons.find((x) => x.id === id) : null;
    return p ? fullName(p.first_name, p.last_name) : null;
  };

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addFamilyWisdom({ familyId, text: text.trim(), authorPersonId: author });
      setText(''); setAuthor(null);
      await wisdomsQuery.refetch();
    } finally {
      setSaving(false);
    }
  }

  if (wisdomsQuery.isLoading) {
    return (<Screen tint={colors.tintMemories}><Loading message="Familienweisheiten werden geladen …" /></Screen>);
  }
  const wisdoms = wisdomsQuery.data ?? [];

  return (
    <Screen tint={colors.tintMemories} refreshing={wisdomsQuery.isRefetching} onRefresh={() => void wisdomsQuery.refetch()}>
      <View style={styles.hero}>
        <View style={styles.iconCircle}><Ionicons name="heart-circle-outline" size={26} color={colors.bronze} /></View>
        <AppText variant="title">Familienweisheiten</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Kurze Sätze, die in eurer Familie weitergegeben werden. Sie fließen später ins
          Familienbuch und in eure Familienfilme ein.
        </AppText>
      </View>

      <Card>
        <AppText variant="bodyStrong">Neue Weisheit festhalten</AppText>
        <TextField
          value={text}
          onChangeText={setText}
          placeholder={'z. B. „Familie steht an erster Stelle."'}
          multiline
          numberOfLines={2}
          style={styles.input}
        />
        {persons.length > 0 ? (
          <>
            <AppText variant="caption" color={colors.textSecondary}>Von wem stammt sie? (optional)</AppText>
            <View style={styles.chips}>
              {persons.slice(0, 8).map((p) => (
                <Chip
                  key={p.id}
                  label={p.first_name}
                  selected={author === p.id}
                  onPress={() => setAuthor(author === p.id ? null : p.id)}
                />
              ))}
            </View>
          </>
        ) : null}
        <Button label="Weisheit speichern" icon="add-outline" loading={saving} disabled={!text.trim()} onPress={save} style={styles.saveBtn} />
      </Card>

      {wisdoms.length === 0 ? (
        <EmptyState icon="sparkles-outline" title="Noch keine Weisheiten" message="Haltet den ersten weitergegebenen Satz eurer Familie fest." />
      ) : (
        wisdoms.map((w) => (
          <Card key={w.id} style={styles.wisdomCard}>
            <AppText variant="subheading" color={colors.textPrimary}>„{w.text}"</AppText>
            <View style={styles.metaRow}>
              {nameOf(w.author_person_id) ? (
                <Chip label={`— ${nameOf(w.author_person_id)}`} color={colors.gold} />
              ) : <View />}
              <AppText variant="caption" color={colors.textMuted}>{formatRelative(w.created_at)}</AppText>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm, marginBottom: spacing.sm },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 64, textAlignVertical: 'top', borderRadius: radius.md, marginVertical: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  saveBtn: { marginTop: spacing.md },
  wisdomCard: { gap: spacing.sm, backgroundColor: colors.warmWhite },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
