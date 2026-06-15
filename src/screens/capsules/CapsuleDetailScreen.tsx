import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, Card, Loading, EmptyState } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { getCapsule, capsuleMediaUrl, deleteCapsule } from '@/api/timeCapsules';
import { qk } from '@/api/queryKeys';
import { formatDateTime, openingCountdown } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, spacing, radius } from '@/theme';
import type { TimeCapsule } from '@/types/models';
import type { CapsulesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<CapsulesStackParamList, 'CapsuleDetail'>;

export function CapsuleDetailScreen({ navigation, route }: Props) {
  const { capsuleId } = route.params;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: qk.capsule(capsuleId),
    queryFn: () => getCapsule(capsuleId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCapsule(capsuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.capsules(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.upcomingCapsules() });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function confirmDelete() {
    Alert.alert(
      'Zeitkapsel löschen',
      'Möchtest du diese Zeitkapsel wirklich für immer löschen?',
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

  if (isLoading) {
    return (
      <Screen>
        <Loading message="Zeitkapsel wird geladen …" />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <EmptyState
          icon="time-outline"
          title="Zeitkapsel nicht gefunden"
          message="Diese Zeitkapsel ist leider nicht mehr verfügbar."
        />
      </Screen>
    );
  }

  const capsule = data;
  const isCreator = capsule.creator_id === userId;
  const canReveal = capsule.is_opened || isCreator;

  return (
    <Screen
      refreshing={isRefetching}
      onRefresh={refetch}
      contentStyle={styles.content}
    >
      <AppText variant="display">{capsule.title}</AppText>

      {capsule.description ? (
        <AppText variant="body" color={colors.textSecondary}>
          {capsule.description}
        </AppText>
      ) : null}

      <View style={styles.metaRow}>
        <Ionicons
          name={capsule.is_opened ? 'lock-open-outline' : 'lock-closed-outline'}
          size={20}
          color={capsule.is_opened ? colors.success : colors.textMuted}
        />
        <AppText
          variant="bodyStrong"
          color={capsule.is_opened ? colors.success : colors.textMuted}
        >
          {capsule.is_opened ? 'Geöffnet' : 'Verschlossen'}
        </AppText>
      </View>

      <AppText variant="caption" color={colors.textMuted}>
        Öffnet sich am {formatDateTime(capsule.open_at)}
      </AppText>

      {canReveal ? (
        <CapsuleContent capsule={capsule} />
      ) : (
        <LockedState capsule={capsule} />
      )}

      {isCreator ? (
        <Button
          label="Zeitkapsel löschen"
          icon="trash-outline"
          variant="danger"
          loading={deleteMutation.isPending}
          onPress={confirmDelete}
          style={styles.delete}
        />
      ) : null}
    </Screen>
  );
}

function LockedState({ capsule }: { capsule: TimeCapsule }) {
  return (
    <Card style={styles.lockedCard}>
      <View style={styles.lockCircle}>
        <Ionicons name="lock-closed" size={48} color={colors.gold} />
      </View>
      <AppText variant="heading" center>
        Diese Zeitkapsel ist noch verschlossen
      </AppText>
      <AppText variant="body" color={colors.textSecondary} center>
        {openingCountdown(capsule.open_at)}
      </AppText>
    </Card>
  );
}

function CapsuleContent({ capsule }: { capsule: TimeCapsule }) {
  if (capsule.content_type === 'text') {
    return (
      <Card style={styles.contentCard}>
        <AppText variant="body">{capsule.text_content ?? ''}</AppText>
      </Card>
    );
  }

  if (capsule.content_type === 'photo') {
    return (
      <Card padded={false} style={styles.photoCard}>
        <SignedImage
          bucket="photos"
          path={capsule.storage_path}
          style={styles.photo}
        />
      </Card>
    );
  }

  return <AudioContent capsule={capsule} />;
}

function AudioContent({ capsule }: { capsule: TimeCapsule }) {
  const { data: url } = useQuery({
    queryKey: ['capsuleMedia', capsule.id],
    queryFn: () => capsuleMediaUrl(capsule),
  });
  const player = useAudioPlayer(url);

  return (
    <Card style={styles.audioCard}>
      <Ionicons name="musical-notes-outline" size={40} color={colors.primary} />
      <Button
        label={player.isPlaying ? 'Pause' : 'Abspielen'}
        icon={player.isPlaying ? 'pause' : 'play'}
        variant="secondary"
        loading={player.loading}
        disabled={!url}
        onPress={player.toggle}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lockedCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    marginTop: spacing.md,
  },
  lockCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCard: { marginTop: spacing.md },
  photoCard: { overflow: 'hidden', marginTop: spacing.md },
  photo: { width: '100%', height: 280 },
  audioCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    marginTop: spacing.md,
  },
  delete: { marginTop: spacing.lg },
});
