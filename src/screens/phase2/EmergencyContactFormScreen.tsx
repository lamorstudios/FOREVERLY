import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, AppText, Button, TextField } from '@/components';
import { colors, spacing } from '@/theme';
import { qk } from '@/api/queryKeys';
import { createEmergencyContact } from '@/api/emergency';
import { friendlyError } from '@/lib/errors';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';

export function EmergencyContactFormScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'EmergencyContactForm'>) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createEmergencyContact({
        familyId,
        name: name.trim(),
        relation: relation.trim() || null,
        phone: phone.trim() || null,
        note: note.trim() || null,
        createdBy: userId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qk.emergencyContacts(familyId),
      });
      navigation.goBack();
    },
    onError: (e) => {
      Alert.alert('Fehler', friendlyError(e));
    },
  });

  function handleSave() {
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.');
      Alert.alert('Name fehlt', 'Bitte gib einen Namen für den Kontakt ein.');
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <Screen>
      <AppText variant="display">Notfallkontakt</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Diese Person wird im Notfall benachrichtigt.
      </AppText>

      <View style={styles.form}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="z. B. Oma"
          error={!name.trim() && error ? error : undefined}
        />

        <TextField
          label="Beziehung (optional)"
          value={relation}
          onChangeText={setRelation}
          placeholder="z. B. Tochter, Hausarzt"
        />

        <TextField
          label="Telefon (optional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="z. B. 0451 123456"
          keyboardType="phone-pad"
        />

        <TextField
          label="Notiz (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Weitere Hinweise …"
          multiline
        />

        <Button
          label="Kontakt speichern"
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
  intro: { marginTop: spacing.xs, marginBottom: spacing.lg },
  form: { gap: spacing.lg },
  saveButton: { marginTop: spacing.md },
});
