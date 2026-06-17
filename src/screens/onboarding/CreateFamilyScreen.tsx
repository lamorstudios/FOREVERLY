import { useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Button, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { createFamily } from '@/api/families';
import { qk } from '@/api/queryKeys';
import { friendlyError } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'CreateFamily'>;

export function CreateFamilyScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { setActiveFamily, refetch } = useFamily();
  const { pickFromLibrary } = useImagePicker();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createFamily({ name: name.trim(), createdBy: userId!, imageUri }),
    onSuccess: async (family) => {
      await queryClient.invalidateQueries({ queryKey: qk.families() });
      refetch();
      setActiveFamily(family.id);
      // RootNavigator wechselt automatisch in die Haupt-App.
    },
    onError: (e) => setError(friendlyError(e)),
  });

  async function pickImage() {
    const picked = await pickFromLibrary();
    if (picked) setImageUri(picked.uri);
  }

  function handleCreate() {
    setError(null);
    if (!name.trim()) return setError('Bitte gib einen Familiennamen ein.');
    mutation.mutate();
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="title">Familie erstellen</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Gib deiner Familie einen Namen, zum Beispiel „Familie Schmidt".
      </AppText>

      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={36} color={colors.primary} />
            <AppText variant="caption" color={colors.textSecondary}>
              Familienbild wählen
            </AppText>
          </View>
        )}
      </Pressable>

      <TextField
        label="Familienname"
        value={name}
        onChangeText={setName}
        placeholder="Familie Mustermann"
        autoCapitalize="words"
      />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}

      <Button
        label="Familie erstellen"
        onPress={handleCreate}
        loading={mutation.isPending}
      />
      <Button label="Zurück" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.lg },
  imagePicker: { alignSelf: 'center', marginVertical: spacing.sm },
  image: { width: 140, height: 140, borderRadius: radius.lg },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
