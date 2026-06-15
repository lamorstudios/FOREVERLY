import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, Card, EmptyState, Loading } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { listAudios, deleteAudio, audioUrl } from '@/api/media';
import { qk } from '@/api/queryKeys';
import { formatDuration, formatRelative } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, spacing, radius } from '@/theme';
import type { Audio } from '@/types/models';
import type { MemoriesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'AudioList'>;

export function AudioListScreen({ navigation, route }: Props) {
  const personId = route.params?.personId;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: qk.audios(familyId, personId),
    queryFn: () => listAudios(familyId, { personId }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAudio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.audios(familyId, personId) });
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function confirmDelete(audio: Audio) {
    Alert.alert(
      'Aufnahme löschen',
      'Möchtest du diese Audioaufnahme wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(audio.id),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <Loading message="Aufnahmen werden geladen …" />
      </Screen>
    );
  }

  const audios = data ?? [];

  return (
    <Screen
      refreshing={isRefetching}
      onRefresh={refetch}
      contentStyle={styles.content}
    >
      <Button
        label="Audio aufnehmen"
        icon="mic"
        onPress={() => navigation.navigate('AudioRecord', { personId })}
      />

      {audios.length === 0 ? (
        <EmptyState
          icon="mic-outline"
          title="Noch keine Aufnahmen"
          message="Halte eine Stimme oder eine Geschichte für immer fest."
          actionLabel="Audio aufnehmen"
          onAction={() => navigation.navigate('AudioRecord', { personId })}
        />
      ) : (
        <View style={styles.list}>
          {audios.map((audio) => (
            <AudioPlayerRow
              key={audio.id}
              path={audio.storage_path}
              label={audio.title ?? 'Audioaufnahme'}
              durationSeconds={audio.duration_seconds}
              createdAt={audio.created_at}
              canDelete={audio.recorded_by === userId}
              onDelete={() => confirmDelete(audio)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function AudioPlayerRow({
  path,
  label,
  durationSeconds,
  createdAt,
  canDelete,
  onDelete,
}: {
  path: string;
  label: string;
  durationSeconds?: number | null;
  createdAt: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const { data: url } = useQuery({
    queryKey: ['signedUrl', 'audios', path],
    queryFn: () => audioUrl(path),
  });
  const { isPlaying, loading, toggle } = useAudioPlayer(url);

  return (
    <Card style={styles.row}>
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
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {formatDuration(durationSeconds)} · {formatRelative(createdAt)}
        </AppText>
      </View>
      {canDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Aufnahme löschen"
        >
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.md },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: spacing.xs },
});
