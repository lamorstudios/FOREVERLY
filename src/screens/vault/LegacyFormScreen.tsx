import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, Button, SelectField, TextField } from '@/components';
import type { SelectOption } from '@/components';
import { listLegacyItems, saveLegacyItem, deleteLegacyItem } from '@/api/vault';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import type { LegacyKind, EstateAudience } from '@/types/models';
import { LEGACY_META, AUDIENCE_META } from './vaultMeta';

type Props = NativeStackScreenProps<ProfileStackParamList, 'LegacyForm'>;

const KINDS: LegacyKind[] = ['wert', 'lektion', 'geschichte', 'rezept', 'ort', 'erinnerung'];
const AUDIENCES: EstateAudience[] = ['inner', 'children', 'spouse', 'trustees', 'selected'];

export function LegacyFormScreen({ navigation, route }: Props) {
  const itemId = route.params?.itemId;
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const itemsQuery = useQuery({ queryKey: qk.legacyItems(userId!), queryFn: () => listLegacyItems(userId!) });
  const existing = itemsQuery.data?.find((i) => i.id === itemId);

  const [kind, setKind] = useState<LegacyKind>(existing?.kind ?? 'geschichte');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [audience, setAudience] = useState<EstateAudience>(existing?.for_audience ?? 'inner');
  const [saving, setSaving] = useState(false);

  const kindOptions: SelectOption<LegacyKind>[] = KINDS.map((k) => ({ value: k, label: `${LEGACY_META[k].emoji} ${LEGACY_META[k].label}` }));
  const audienceOptions: SelectOption<EstateAudience>[] = AUDIENCES.map((a) => ({ value: a, label: AUDIENCE_META[a] }));

  async function onSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await saveLegacyItem({ id: existing?.id, familyId, ownerUserId: userId!, kind, title: title.trim(), content: content.trim(), for_audience: audience });
      await itemsQuery.refetch();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (!existing) return;
    Alert.alert('Löschen', `„${existing.title}" entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteLegacyItem(existing.id); await itemsQuery.refetch(); navigation.goBack(); } },
    ]);
  }

  return (
    <Screen>
      <View style={styles.form}>
        <SelectField label="Art" value={kind} options={kindOptions} onChange={setKind} />
        <TextField label="Titel" value={title} onChangeText={setTitle} placeholder="z.B. Omas Streuselkuchen" />
        <TextField label="Inhalt" value={content} onChangeText={setContent} placeholder="Was möchtest du weitergeben?" multiline numberOfLines={6} style={styles.multiline} />
        <SelectField label="Für wen?" value={audience} options={audienceOptions} onChange={setAudience} />
      </View>
      <Button label="Speichern" icon="checkmark-outline" loading={saving} disabled={!title.trim() || !content.trim()} onPress={onSave} />
      {existing ? <Button label="Löschen" icon="trash-outline" variant="ghost" onPress={onDelete} style={styles.delete} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginBottom: spacing.lg },
  multiline: { minHeight: 140, textAlignVertical: 'top', borderRadius: radius.md },
  delete: { marginTop: spacing.sm },
});
