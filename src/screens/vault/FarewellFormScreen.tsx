import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Button, Card, SelectField, TextField } from '@/components';
import type { SelectOption } from '@/components';
import { listFarewellMessages, saveFarewellMessage, deleteFarewellMessage } from '@/api/vault';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import type { FarewellKind, FarewellRecipient } from '@/types/models';
import { FAREWELL_KIND_META, FAREWELL_RECIPIENT_META } from './vaultMeta';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FarewellForm'>;

const KINDS: FarewellKind[] = ['text', 'audio', 'video'];
const RECIPIENTS: FarewellRecipient[] = ['spouse', 'children', 'grandchildren', 'inner', 'selected'];

export function FarewellFormScreen({ navigation, route }: Props) {
  const messageId = route.params?.messageId;
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const query = useQuery({ queryKey: qk.farewellMessages(userId!), queryFn: () => listFarewellMessages(userId!) });
  const existing = query.data?.find((m) => m.id === messageId);

  const [kind, setKind] = useState<FarewellKind>(existing?.kind ?? 'text');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [recipient, setRecipient] = useState<FarewellRecipient>(existing?.recipient ?? 'inner');
  const [content, setContent] = useState(existing?.content ?? '');
  const [saving, setSaving] = useState(false);

  const kindOptions: SelectOption<FarewellKind>[] = KINDS.map((k) => ({ value: k, label: FAREWELL_KIND_META[k].label }));
  const recipientOptions: SelectOption<FarewellRecipient>[] = RECIPIENTS.map((r) => ({ value: r, label: FAREWELL_RECIPIENT_META[r] }));

  async function onSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await saveFarewellMessage({ id: existing?.id, familyId, ownerUserId: userId!, kind, title: title.trim(), recipient, content: content.trim() || null });
      await query.refetch();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (!existing) return;
    Alert.alert('Löschen', `„${existing.title}" entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteFarewellMessage(existing.id); await query.refetch(); navigation.goBack(); } },
    ]);
  }

  return (
    <Screen>
      <View style={styles.form}>
        <SelectField label="Art der Nachricht" value={kind} options={kindOptions} onChange={setKind} />
        <TextField label="Titel" value={title} onChangeText={setTitle} placeholder="z.B. Für meine Kinder" />
        <SelectField label="Für wen?" value={recipient} options={recipientOptions} onChange={setRecipient} />
        <TextField
          label={kind === 'text' ? 'Deine Worte' : 'Begleittext / Beschreibung'}
          value={content}
          onChangeText={setContent}
          placeholder="Schreibe von Herzen …"
          multiline
          numberOfLines={6}
          style={styles.multiline}
        />
        {kind !== 'text' ? (
          <Card>
            <AppText variant="caption" color={colors.textSecondary}>
              🎙️ Audio-/Video-Aufnahmen kannst du später hinzufügen. Vorerst wird der Begleittext
              gespeichert.
            </AppText>
          </Card>
        ) : null}
      </View>
      <Button label="Speichern" icon="checkmark-outline" loading={saving} disabled={!title.trim()} onPress={onSave} />
      {existing ? <Button label="Löschen" icon="trash-outline" variant="ghost" onPress={onDelete} style={styles.delete} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginBottom: spacing.lg },
  multiline: { minHeight: 140, textAlignVertical: 'top', borderRadius: radius.md },
  delete: { marginTop: spacing.sm },
});
