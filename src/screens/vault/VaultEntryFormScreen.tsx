import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, Button, SelectField, TextField } from '@/components';
import type { SelectOption } from '@/components';
import { listVaultEntries, saveVaultEntry, deleteVaultEntry } from '@/api/vault';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import type { VaultCategory, EstateAudience } from '@/types/models';
import { VAULT_CATEGORY_ORDER, VAULT_CATEGORY_META, AUDIENCE_META } from './vaultMeta';

type Props = NativeStackScreenProps<ProfileStackParamList, 'VaultEntryForm'>;

const AUDIENCES: EstateAudience[] = ['trustees', 'spouse', 'children', 'inner', 'selected'];

export function VaultEntryFormScreen({ navigation, route }: Props) {
  const entryId = route.params?.entryId;
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const entriesQuery = useQuery({ queryKey: qk.vaultEntries(userId!), queryFn: () => listVaultEntries(userId!) });
  const existing = entriesQuery.data?.find((e) => e.id === entryId);

  const [category, setCategory] = useState<VaultCategory>(existing?.category ?? 'testament');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [contact, setContact] = useState(existing?.contact_person ?? '');
  const [audience, setAudience] = useState<EstateAudience>(existing?.release_audience ?? 'trustees');
  const [saving, setSaving] = useState(false);

  const categoryOptions: SelectOption<VaultCategory>[] = VAULT_CATEGORY_ORDER.map((c) => ({ value: c, label: VAULT_CATEGORY_META[c].label }));
  const audienceOptions: SelectOption<EstateAudience>[] = AUDIENCES.map((a) => ({ value: a, label: AUDIENCE_META[a] }));

  async function onSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await saveVaultEntry({
        id: existing?.id,
        familyId,
        ownerUserId: userId!,
        category,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        contact_person: contact.trim() || null,
        release_audience: audience,
      });
      await entriesQuery.refetch();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (!existing) return;
    Alert.alert('Eintrag löschen', `„${existing.title}" entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive',
        onPress: async () => {
          await deleteVaultEntry(existing.id);
          await entriesQuery.refetch();
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.form}>
        <SelectField label="Kategorie" value={category} options={categoryOptions} onChange={setCategory} />
        <TextField label="Titel" value={title} onChangeText={setTitle} placeholder="z.B. Testament" />
        <TextField label="Beschreibung" value={description} onChangeText={setDescription} placeholder="Worum geht es?" multiline numberOfLines={3} style={styles.multiline} />
        <TextField label="Aufbewahrungsort" value={location} onChangeText={setLocation} placeholder="z.B. Ordner im Büro / beim Notar" />
        <TextField label="Ansprechpartner" value={contact} onChangeText={setContact} placeholder="z.B. Sabine Mielke" />
        <SelectField label="Sichtbar nach Freigabe für" value={audience} options={audienceOptions} onChange={setAudience} />
      </View>

      <Button label="Speichern" icon="checkmark-outline" loading={saving} disabled={!title.trim()} onPress={onSave} />
      {existing ? <Button label="Löschen" icon="trash-outline" variant="ghost" onPress={onDelete} style={styles.delete} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginBottom: spacing.lg },
  multiline: { minHeight: 80, textAlignVertical: 'top', borderRadius: radius.md },
  delete: { marginTop: spacing.sm },
});
