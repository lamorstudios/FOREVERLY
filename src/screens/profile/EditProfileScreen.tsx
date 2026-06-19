import { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, TextField, Avatar, Loading, useSuccess } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, uploadAvatar } from '@/api/profiles';
import type { UpdateProfileInput } from '@/api/profiles';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { pickFromLibrary } = useImagePicker();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [existingAvatar, setExistingAvatar] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: qk.profile(userId!),
    queryFn: () => getProfile(userId!),
  });

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setFullName(p.full_name ?? '');
    setBio(p.bio ?? '');
    setExistingAvatar(p.avatar_url ?? null);
  }, [profileQuery.data]);

  async function handlePick() {
    const picked = await pickFromLibrary();
    if (picked) setLocalImageUri(picked.uri);
  }

  const { show } = useSuccess();
  const saveMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = existingAvatar;
      if (localImageUri) {
        avatarUrl = await uploadAvatar(userId!, localImageUri);
      }
      const input: UpdateProfileInput = {
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      };
      return updateProfile(userId!, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile(userId!) });
      show('Profil aktualisiert');
      navigation.goBack();
    },
    onError: (e) => setError(friendlyError(e)),
  });

  function handleSave() {
    setError(null);
    if (!fullName.trim()) {
      setError('Bitte gib deinen Namen ein.');
      return;
    }
    saveMutation.mutate();
  }

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Profil wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="display" style={styles.title}>
        Profil bearbeiten
      </AppText>

      <View style={styles.avatarBlock}>
        <Pressable onPress={handlePick}>
          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.avatar} />
          ) : existingAvatar ? (
            <SignedImage
              bucket="avatars"
              path={existingAvatar}
              style={styles.avatar}
            />
          ) : (
            <Avatar name={fullName} size={120} />
          )}
        </Pressable>
        <Button
          label="Foto ändern"
          icon="image-outline"
          variant="ghost"
          fullWidth={false}
          onPress={handlePick}
        />
      </View>

      <View style={styles.form}>
        <TextField
          label="Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="z. B. Maria Schmidt"
        />
        <TextField
          label="Über mich"
          value={bio}
          onChangeText={setBio}
          placeholder="Erzähle etwas über dich …"
          multiline
          numberOfLines={5}
          style={styles.bio}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  form: { gap: spacing.md },
  bio: { minHeight: 120, textAlignVertical: 'top' },
});
