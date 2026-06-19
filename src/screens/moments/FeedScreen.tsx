import { View, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  Card,
  Avatar,
  SignedImage,
  EmptyState,
  Loading,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { listMoments, momentMediaUrl } from '@/api/moments';
import { qk } from '@/api/queryKeys';
import { VISIBILITY_LEVELS } from '@/constants/closeness';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatRelative, formatDuration } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { Moment, VisibilityLevel } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Feed'>;

/** Kleine Zeile zum Abspielen einer Audio-Aufnahme. */
function AudioPlayerRow({ moment }: { moment: Moment }) {
  const { data: url } = useQuery({
    queryKey: ['signedUrl', 'audios', moment.storage_path ?? ''],
    queryFn: () => momentMediaUrl(moment),
    enabled: !!moment.storage_path,
  });
  const { isPlaying, loading, toggle } = useAudioPlayer(url);

  return (
    <Pressable style={styles.audioRow} onPress={toggle}>
      <View style={styles.audioIcon}>
        <Ionicons
          name={isPlaying ? 'pause' : loading ? 'hourglass-outline' : 'play'}
          size={22}
          color={colors.textOnAccent}
        />
      </View>
      <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
      <AppText variant="body" color={colors.textSecondary}>
        {formatDuration(moment.duration_seconds)}
      </AppText>
    </Pressable>
  );
}

function MomentContent({ moment }: { moment: Moment }) {
  if (moment.kind === 'text') {
    return moment.text ? <AppText variant="body">{moment.text}</AppText> : null;
  }
  if (moment.kind === 'photo' || moment.kind === 'video') {
    return (
      <View style={styles.mediaWrapper}>
        <SignedImage bucket="photos" path={moment.storage_path} style={styles.media} />
        {moment.kind === 'video' ? (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={32} color={colors.textOnAccent} />
          </View>
        ) : null}
      </View>
    );
  }
  if (moment.kind === 'audio') {
    return <AudioPlayerRow moment={moment} />;
  }
  return null;
}

export function FeedScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const momentsQuery = useQuery({
    queryKey: qk.moments(familyId, 'feed'),
    queryFn: () => listMoments(familyId, { feedOnly: true }),
  });

  if (momentsQuery.isLoading) {
    return <Loading message="Familienmomente werden geladen …" />;
  }

  const moments = momentsQuery.data ?? [];

  return (
    <Screen
      onRefresh={() => momentsQuery.refetch()}
      refreshing={momentsQuery.isRefetching}
    >
      <View style={styles.intro}>
        <AppText variant="heading">Familienmomente</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Euer privater Familienfeed – zum Teilen von schönen Augenblicken. Kein
          Messenger, sondern ein gemeinsames Album für die ganze Familie.
        </AppText>
      </View>

      <Button
        label="Moment teilen"
        icon="add-circle-outline"
        onPress={() => navigation.navigate('MomentCompose')}
        style={styles.shareButton}
      />

      {moments.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Noch keine Momente"
          message="Teile den ersten Familienmoment – ein Foto, eine Nachricht oder eine Sprachaufnahme."
          actionLabel="Moment teilen"
          onAction={() => navigation.navigate('MomentCompose')}
        />
      ) : (
        moments.map((m) => {
          const vis = VISIBILITY_LEVELS[(m.visibility ?? 'family') as VisibilityLevel];
          return (
            <Card
              key={m.id}
              onPress={() => navigation.navigate('MomentDetail', { momentId: m.id })}
            >
              <View style={styles.header}>
                {m.author?.avatar_url ? (
                  <SignedImage bucket="avatars" path={m.author.avatar_url} style={styles.avatar} />
                ) : (
                  <Avatar name={m.author?.full_name} size={48} />
                )}
                <View style={styles.headerText}>
                  <AppText variant="subheading">
                    {m.author?.full_name ?? 'Familienmitglied'}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {formatRelative(m.created_at)}
                  </AppText>
                </View>
                <View style={styles.badge}>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {vis.emoji} {vis.label}
                  </AppText>
                </View>
              </View>

              <View style={styles.content}>
                <MomentContent moment={m} />
              </View>

              <AppText variant="caption" color={colors.textMuted}>
                💬 {m.comment_count ?? 0} Kommentare
              </AppText>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.md },
  shareButton: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt },
  headerText: { flex: 1, gap: 2 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  content: { marginVertical: spacing.md, gap: spacing.sm },
  mediaWrapper: { position: 'relative' },
  media: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  audioIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
