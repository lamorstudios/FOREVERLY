import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  AppText,
  Button,
  Chip,
  TextField,
  SelectField,
} from '@/components';
import type { SelectOption } from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { listDocuments, upsertDocument } from '@/api/documents';
import { DOCUMENT_KINDS, DOCUMENT_KIND_ORDER } from '@/constants/phase2';
import { friendlyError } from '@/lib/errors';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { DocumentKind } from '@/types/models';

const KIND_OPTIONS: SelectOption<DocumentKind>[] = DOCUMENT_KIND_ORDER.map(
  (kind) => ({
    value: kind,
    label: DOCUMENT_KINDS[kind].label,
  }),
);

export function DocumentFormScreen({
  navigation,
  route,
}: NativeStackScreenProps<HomeStackParamList, 'DocumentForm'>) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const documentId = route.params?.documentId;

  const [hydrated, setHydrated] = useState(false);
  const [kind, setKind] = useState<DocumentKind>('testament');
  const [title, setTitle] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [location, setLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const documentsQuery = useQuery({
    queryKey: qk.documents(familyId),
    queryFn: () => listDocuments(familyId),
  });

  const existing = documentId
    ? documentsQuery.data?.find((d) => d.id === documentId)
    : undefined;

  if (existing && !hydrated) {
    setHydrated(true);
    setKind(existing.kind);
    setTitle(existing.title);
    setIsAvailable(existing.is_available);
    setLocation(existing.location ?? '');
    setContactPerson(existing.contact_person ?? '');
    setNote(existing.note ?? '');
  }

  const mutation = useMutation({
    mutationFn: () =>
      upsertDocument({
        id: documentId,
        familyId,
        kind,
        title: title.trim(),
        isAvailable,
        location: location.trim() || null,
        note: note.trim() || null,
        contactPerson: contactPerson.trim() || null,
        createdBy: userId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.documents(familyId) });
      navigation.goBack();
    },
    onError: (e) => {
      Alert.alert('Fehler', friendlyError(e));
    },
  });

  function handleKindChange(next: DocumentKind) {
    setKind(next);
    if (!title.trim()) {
      setTitle(DOCUMENT_KINDS[next].label);
    }
  }

  function handleSave() {
    if (!title.trim()) {
      setError('Bitte geben Sie einen Titel ein.');
      Alert.alert('Titel fehlt', 'Bitte geben Sie einen Titel für das Dokument ein.');
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <Screen>
      <AppText variant="display">
        {documentId ? 'Dokument bearbeiten' : 'Neues Dokument'}
      </AppText>

      <View style={styles.infoBox}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={colors.primary}
          style={styles.infoIcon}
        />
        <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>
          Sie halten hier nur fest, OB ein Dokument existiert und wo es liegt.
          Inhalte werden niemals gespeichert. Bitte keine Passwörter, PINs, TANs
          oder Zugangsdaten eintragen – nur Hinweise wie „Ordner liegt bei …".
        </AppText>
      </View>

      <View style={styles.form}>
        <SelectField<DocumentKind>
          label="Art"
          value={kind}
          options={KIND_OPTIONS}
          onChange={handleKindChange}
        />

        <TextField
          label="Titel"
          value={title}
          onChangeText={setTitle}
          placeholder="z. B. Testament von Oma"
          error={!title.trim() && error ? error : undefined}
        />

        <View style={styles.field}>
          <AppText variant="label" color={colors.textSecondary}>
            Vorhanden?
          </AppText>
          <View style={styles.chipRow}>
            <Chip
              label="Ja"
              selected={isAvailable}
              color={colors.success}
              onPress={() => setIsAvailable(true)}
            />
            <Chip
              label="Nein"
              selected={!isAvailable}
              onPress={() => setIsAvailable(false)}
            />
          </View>
        </View>

        <TextField
          label="Aufbewahrungsort (optional)"
          value={location}
          onChangeText={setLocation}
          placeholder="z.B. beim Notar / Ordner im Wohnzimmer"
        />

        <TextField
          label="Ansprechpartner (optional)"
          value={contactPerson}
          onChangeText={setContactPerson}
          placeholder="z.B. Max Mustermann"
        />

        <TextField
          label="Notiz (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Weitere Hinweise …"
          multiline
        />

        <Button
          label="Dokument speichern"
          icon="checkmark-circle-outline"
          loading={mutation.isPending}
          onPress={handleSave}
          style={styles.saveButton}
        />
        <Button
          label="Abbrechen"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  infoIcon: { marginTop: 2 },
  infoText: { flex: 1 },
  form: { gap: spacing.lg },
  field: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  saveButton: { marginTop: spacing.md },
});
