import { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, TextField, Card } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateFamily, uploadFamilyImage } from '@/api/families';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { friendlyError } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FamilySettings'>;

export function FamilySettingsScreen(_props: Props) {
  const { activeFamily, isAdmin } = useFamily();
  const queryClient = useQueryClient();
  const { pickFromLibrary } = useImagePicker();

  const familyId = activeFamily!.id;

  const [name, setName] = useState(activeFamily!.name);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(activeFamily!.name);
    setLocalImageUri(null);
  }, [activeFamily]);

  async function handlePick() {
    const picked = await pickFromLibrary();
    if (picked) setLocalImageUri(picked.uri);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined;
      if (localImageUri) {
        imageUrl = await uploadFamilyImage(familyId, localImageUri);
      }
      return updateFamily(familyId, {
        name: name.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.families() });
      queryClient.invalidateQueries({ queryKey: qk.family(familyId) });
      setLocalImageUri(null);
      Alert.alert('Gespeichert', 'Die Familie wurde aktualisiert.');
    },
    onError: (e) => setError(friendlyError(e)),
  });

  function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError('Bitte gib einen Familiennamen ein.');
      return;
    }
    saveMutation.mutate();
  }

  return (
    <Screen>
      <AppText variant="display" style={styles.title}>
        Familie verwalten
      </AppText>

      <View style={styles.imageBlock}>
        <Pressable onPress={isAdmin ? handlePick : undefined}>
          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.image} />
          ) : activeFamily!.image_url ? (
            <SignedImage
              bucket="photos"
              path={activeFamily!.image_url}
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.imageEmpty]}>
              <Ionicons name="people" size={56} color={colors.textMuted} />
            </View>
          )}
        </Pressable>
        {isAdmin ? (
          <Button
            label="Familienbild ändern"
            icon="image-outline"
            variant="ghost"
            fullWidth={false}
            onPress={handlePick}
          />
        ) : null}
      </View>

      {isAdmin ? (
        <View style={styles.form}>
          <TextField
            label="Familienname"
            value={name}
            onChangeText={setName}
            placeholder="z. B. Familie Schmidt"
          />

          {error ? (
            <AppText variant="caption" color={colors.error}>
              {error}
            </AppText>
          ) : null}

          <Button
            label="Speichern"
            icon="checkmark-circle-outline"
            loading={saveMutation.isPending}
            onPress={handleSave}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <AppText variant="title">{activeFamily!.name}</AppText>
          <Card>
            <View style={styles.note}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={colors.textMuted}
              />
              <AppText variant="body" color={colors.textSecondary} style={styles.noteText}>
                Nur Administratoren können die Familie bearbeiten.
              </AppText>
            </View>
          </Card>
        </View>
      )}

      <AppText variant="caption" color={colors.textMuted} style={styles.created}>
        Erstellt am {formatDate(activeFamily!.created_at)}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  imageBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  image: { width: 160, height: 160, borderRadius: radius.lg },
  imageEmpty: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  form: { gap: spacing.md },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noteText: { flex: 1 },
  created: { marginTop: spacing.xl },
});
