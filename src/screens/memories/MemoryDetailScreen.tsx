import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, Card, Loading } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useFamily } from '@/context/FamilyContext';
import { getMemory, deleteMemory } from '@/api/memories';
import { listPhotos, listAudios, audioUrl } from '@/api/media';
import { qk } from '@/api/queryKeys';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDate, formatDateTime, formatDuration } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, spacing, radius } from '@/theme';
import type { MemoriesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'MemoryDetail'>;

export function MemoryDetailScreen({ navigation, route }: Props) {
  const { memoryId } = route.params;
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const memoryQuery = useQuery({
    queryKey: ['memory', memoryId],
    queryFn: () => getMemory(memoryId),
  });

  const photosQuery = useQuery({
    queryKey: ['photos', familyId, 'memory', memoryId],
    queryFn: () => listPhotos(familyId, { memoryId }),
  });

  const audiosQuery = useQuery({
    queryKey: ['audios', familyId, 'memory', memoryId],
    queryFn: () => listAudios(familyId, { memoryId }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMemory(memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.memories(familyId) });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function confirmDelete() {
    Alert.alert(
      'Erinnerung löschen',
      'Möchtest du diese Erinnerung wirklich löschen? Das kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  }

  if (memoryQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Erinnerung wird geladen …" />
      </Screen>
    );
  }

  const memory = memoryQuery.data;
  if (!memory) {
    return (
      <Screen>
        <AppText variant="heading">Erinnerung nicht gefunden</AppText>
      </Screen>
    );
  }

  const photos = photosQuery.data ?? [];
  const audios = audiosQuery.data ?? [];

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="display">{memory.title}</AppText>

      <AppText variant="caption" color={colors.textMuted}>
        {memory.occurred_on
          ? formatDate(memory.occurred_on)
          : formatDateTime(memory.created_at)}
      </AppText>

      {memory.description ? (
        <AppText variant="body" color={colors.textSecondary}>
          {memory.description}
        </AppText>
      ) : null}

      {photos.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="heading">Fotos</AppText>
          {photos.map((photo) => (
            <Card key={photo.id} padded={false} style={styles.photoCard}>
              <SignedImage
                bucket="photos"
                path={photo.storage_path}
                style={styles.photo}
              />
              {photo.caption ? (
                <AppText variant="caption" style={styles.caption}>
                  {photo.caption}
                </AppText>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {audios.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="heading">Audios</AppText>
          {audios.map((audio) => (
            <AudioPlayerRow
              key={audio.id}
              path={audio.storage_path}
              label={audio.title ?? 'Audioaufnahme'}
              durationSeconds={audio.duration_seconds}
            />
          ))}
        </View>
      ) : null}

      <Button
        label="Erinnerung löschen"
        variant="danger"
        icon="trash-outline"
        onPress={confirmDelete}
        loading={deleteMutation.isPending}
        style={styles.delete}
      />
    </Screen>
  );
}

function AudioPlayerRow({
  path,
  label,
  durationSeconds,
}: {
  path: string;
  label: string;
  durationSeconds?: number | null;
}) {
  const { data: url } = useQuery({
    queryKey: ['signedUrl', 'audios', path],
    queryFn: () => audioUrl(path),
  });
  const { isPlaying, loading, toggle } = useAudioPlayer(url);

  return (
    <Card style={styles.audioRow}>
      <Pressable
        onPress={toggle}
        disabled={loading || !url}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Abspielen'}
        style={styles.playButton}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={28}
          color={colors.textOnAccent}
        />
      </Pressable>
      <View style={styles.audioTexts}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {formatDuration(durationSeconds)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.md },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  photoCard: { overflow: 'hidden' },
  photo: { width: '100%', height: 240 },
  caption: { padding: spacing.sm },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTexts: { flex: 1, gap: spacing.xs },
  delete: { marginTop: spacing.lg },
});
