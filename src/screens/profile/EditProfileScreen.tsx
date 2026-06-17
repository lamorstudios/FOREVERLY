import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, TextField, Avatar, Loading } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, uploadAvatar } from '@/api/profiles';
import type { UpdateProfileInput } from '@/api/profiles';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { friendlyError } from '@/lib/errors';
import { colors, spacing, radius, shadow } from '@/theme';
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
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Animationen für Erfolgs-Häkchen und Snackbar.
  const successAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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

  function showToast(msg: string, ok: boolean, autoHideMs = 2500) {
    setToast({ msg, ok });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    timers.current.push(
      setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, autoHideMs),
    );
  }

  async function handlePick() {
    const picked = await pickFromLibrary();
    if (picked) setLocalImageUri(picked.uri);
  }

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
      setSaved(true);
      // Erfolgs-Animation
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }).start();
      // Snackbar/Toast
      showToast('Profil erfolgreich aktualisiert', true, 1600);
      // Automatisch zurück nach kurzer Bestätigung
      timers.current.push(setTimeout(() => navigation.goBack(), 1500));
    },
    onError: (e) => {
      setError(friendlyError(e));
      showToast('Speichern fehlgeschlagen. Bitte erneut versuchen.', false);
    },
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

  const saving = saveMutation.isPending;

  return (
    <View style={styles.root}>
      <Screen>
        <AppText variant="display" style={styles.title}>
          Profil bearbeiten
        </AppText>

        <View style={styles.avatarBlock}>
          <Pressable onPress={handlePick} disabled={saving || saved}>
            {localImageUri ? (
              <Image source={{ uri: localImageUri }} style={styles.avatar} />
            ) : existingAvatar ? (
              <SignedImage bucket="avatars" path={existingAvatar} style={styles.avatar} />
            ) : (
              <Avatar name={fullName} size={120} />
            )}
          </Pressable>
          <Button
            label="Foto ändern"
            icon="image-outline"
            variant="ghost"
            fullWidth={false}
            disabled={saving || saved}
            onPress={handlePick}
          />
        </View>

        <View style={styles.form}>
          <TextField
            label="Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="z. B. Maria Schmidt"
            editable={!saving && !saved}
          />
          <TextField
            label="Über mich"
            value={bio}
            onChangeText={setBio}
            placeholder="Erzähle etwas über dich …"
            multiline
            numberOfLines={5}
            style={styles.bio}
            editable={!saving && !saved}
          />

          {error ? (
            <AppText variant="caption" color={colors.error}>
              {error}
            </AppText>
          ) : null}

          {/* Erfolgs-Bestätigung mit kleiner Animation */}
          {saved ? (
            <Animated.View
              style={[
                styles.successRow,
                { opacity: successAnim, transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] },
              ]}
            >
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <AppText variant="bodyStrong" color={colors.success}>
                Profil erfolgreich gespeichert
              </AppText>
            </Animated.View>
          ) : null}

          <Button
            label={saving ? 'Wird gespeichert…' : saved ? 'Gespeichert ✓' : 'Speichern'}
            icon={saved ? 'checkmark-circle' : 'checkmark-circle-outline'}
            loading={saving}
            disabled={saving || saved}
            onPress={handleSave}
          />
        </View>
      </Screen>

      {/* Toast / Snackbar */}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { backgroundColor: toast.ok ? colors.success : colors.error },
            { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <Ionicons name={toast.ok ? 'checkmark-circle' : 'alert-circle'} size={20} color={colors.textOnAccent} />
          <AppText variant="bodyStrong" color={colors.textOnAccent} style={styles.toastText}>
            {toast.msg}
          </AppText>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { marginBottom: spacing.lg },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  form: { gap: spacing.md },
  bio: { minHeight: 120, textAlignVertical: 'top' },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center' },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...shadow.card,
  },
  toastText: { flex: 1 },
});
