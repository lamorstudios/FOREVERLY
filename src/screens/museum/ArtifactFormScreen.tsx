import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, Button, SelectField, TextField } from '@/components';
import type { SelectOption } from '@/components';
import { listArtifacts, saveArtifact, deleteArtifact } from '@/api/museum';
import { listPersons } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { ArtifactCategory } from '@/types/models';
import { ARTIFACT_ORDER, ARTIFACT_META } from './museumMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'ArtifactForm'>;

export function ArtifactFormScreen({ navigation, route }: Props) {
  const artifactId = route.params?.artifactId;
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const artifactsQuery = useQuery({ queryKey: qk.artifacts(familyId), queryFn: () => listArtifacts(familyId) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const existing = artifactsQuery.data?.find((a) => a.id === artifactId);

  const [category, setCategory] = useState<ArtifactCategory>(existing?.category ?? 'erbstueck');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [story, setStory] = useState(existing?.story ?? '');
  const [ownerId, setOwnerId] = useState<string | null>(existing?.owner_person_id ?? null);
  const [location, setLocation] = useState(existing?.location ?? '');
  const [year, setYear] = useState(existing?.year ? String(existing.year) : '');
  const [saving, setSaving] = useState(false);

  const categoryOptions: SelectOption<ArtifactCategory>[] = ARTIFACT_ORDER.map((c) => ({ value: c, label: ARTIFACT_META[c].label }));
  const personOptions: SelectOption<string>[] = (personsQuery.data ?? []).map((p) => ({ value: p.id, label: fullName(p.first_name, p.last_name) }));

  async function onSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await saveArtifact({
        id: existing?.id,
        familyId,
        category,
        title: title.trim(),
        description: description.trim() || null,
        story: story.trim() || null,
        ownerPersonId: ownerId,
        location: location.trim() || null,
        year: year.trim() ? Number(year) : null,
        createdBy: userId!,
      });
      await artifactsQuery.refetch();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (!existing) return;
    Alert.alert('Artefakt löschen', `„${existing.title}" entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteArtifact(existing.id); await artifactsQuery.refetch(); navigation.goBack(); } },
    ]);
  }

  return (
    <Screen tint={colors.tintMemories}>
      <View style={styles.form}>
        <SelectField label="Kategorie" value={category} options={categoryOptions} onChange={setCategory} />
        <TextField label="Titel" value={title} onChangeText={setTitle} placeholder="z.B. Opas Taschenuhr" />
        <TextField label="Beschreibung" value={description} onChangeText={setDescription} placeholder="Was ist es?" multiline numberOfLines={3} style={styles.multiline} />
        <TextField label="Geschichte / Generationenverlauf" value={story} onChangeText={setStory} placeholder="Wer hat es besessen, wer hat es weitergegeben?" multiline numberOfLines={4} style={styles.multiline} />
        {personOptions.length > 0 ? <SelectField label="Besitzer (optional)" placeholder="Person wählen" value={ownerId} options={personOptions} onChange={setOwnerId} /> : null}
        <TextField label="Aufbewahrungsort (optional)" value={location} onChangeText={setLocation} />
        <TextField label="Jahr (optional)" value={year} onChangeText={setYear} keyboardType="number-pad" />
      </View>
      <Button label="Speichern" icon="checkmark-outline" loading={saving} disabled={!title.trim()} onPress={onSave} />
      {existing ? <Button label="Löschen" icon="trash-outline" variant="ghost" onPress={onDelete} style={styles.delete} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginBottom: spacing.lg },
  multiline: { minHeight: 90, textAlignVertical: 'top', borderRadius: radius.md },
  delete: { marginTop: spacing.sm },
});
