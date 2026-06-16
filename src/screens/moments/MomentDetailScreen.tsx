import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  Card,
  Avatar,
  TextField,
  SignedImage,
  SectionHeader,
  EmptyState,
  Loading,
} from '@/components';
import { useAuth } from '@/context/AuthContext';
import {
  getMoment,
  listMomentComments,
  addMomentComment,
  momentMediaUrl,
} from '@/api/moments';
import { qk } from '@/api/queryKeys';
import { VISIBILITY_LEVELS } from '@/constants/closeness';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatRelative, formatDuration } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { Alert } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { Moment, VisibilityLevel } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'MomentDetail'>;

/** Kleine Zeile zum Abspielen einer Audio-Aufnahme. */
function AudioPlayerRow({ moment }: { moment: Moment }) {
  const { data: url } = useQuery({
    queryKey: ['signedUrl', 'audios', moment.storage_path ?? ''],
    queryFn: () => momentMediaUrl(moment),
    enabled: !!moment.storage_path,
  });
  const { isPlaying, loading, toggle } = useAudioPlayer(url ?? undefined);

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

export function MomentDetailScreen({ route }: Props) {
  const { momentId } = route.params;
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [comment, setComment] = useState('');

  const momentQuery = useQuery({
    queryKey: qk.moment(momentId),
    queryFn: () => getMoment(momentId),
  });

  const commentsQuery = useQuery({
    queryKey: qk.momentComments(momentId),
    queryFn: () => listMomentComments(momentId),
  });

  const commentMutation = useMutation({
    mutationFn: () => addMomentComment(momentId, userId!, comment.trim()),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: qk.momentComments(momentId) });
      queryClient.invalidateQueries({ queryKey: qk.moment(momentId) });
    },
    onError: (err) => Alert.alert('Fehler', friendlyError(err)),
  });

  if (momentQuery.isLoading) {
    return <Loading message="Moment wird geladen …" />;
  }

  const moment = momentQuery.data;
  if (!moment) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Moment nicht gefunden"
          message="Dieser Familienmoment ist nicht mehr verfügbar."
        />
      </Screen>
    );
  }

  const vis = VISIBILITY_LEVELS[(moment.visibility ?? 'family') as VisibilityLevel];
  const comments = commentsQuery.data ?? [];

  const onSend = () => {
    if (comment.trim().length === 0) {
      Alert.alert('Kommentar fehlt', 'Bitte schreibe zuerst einen Kommentar.');
      return;
    }
    commentMutation.mutate();
  };

  return (
    <Screen
      onRefresh={() => {
        momentQuery.refetch();
        commentsQuery.refetch();
      }}
      refreshing={momentQuery.isRefetching || commentsQuery.isRefetching}
    >
      <Card>
        <View style={styles.header}>
          {moment.author?.avatar_url ? (
            <SignedImage bucket="avatars" path={moment.author.avatar_url} style={styles.avatar} />
          ) : (
            <Avatar name={moment.author?.full_name} size={48} />
          )}
          <View style={styles.headerText}>
            <AppText variant="subheading">
              {moment.author?.full_name ?? 'Familienmitglied'}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {formatRelative(moment.created_at)}
            </AppText>
          </View>
          <View style={styles.badge}>
            <AppText variant="caption" color={colors.textSecondary}>
              {vis.emoji} {vis.label}
            </AppText>
          </View>
        </View>

        <View style={styles.content}>
          <MomentContent moment={moment} />
        </View>
      </Card>

      <SectionHeader title="Kommentare" />

      {commentsQuery.isLoading ? (
        <Loading message="Kommentare werden geladen …" />
      ) : comments.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Noch keine Kommentare"
          message="Sei der Erste, der einen lieben Gruß hinterlässt."
        />
      ) : (
        comments.map((c) => (
          <Card key={c.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Avatar name={c.author?.full_name} size={36} />
              <View style={styles.headerText}>
                <AppText variant="bodyStrong">
                  {c.author?.full_name ?? 'Familienmitglied'}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {formatRelative(c.created_at)}
                </AppText>
              </View>
            </View>
            <AppText variant="body" style={styles.commentText}>
              {c.text}
            </AppText>
          </Card>
        ))
      )}

      <View style={styles.commentForm}>
        <TextField
          label="Dein Kommentar"
          value={comment}
          onChangeText={setComment}
          multiline
          placeholder="Schreibe einen lieben Gruß …"
        />
        <Button
          label="Kommentar senden"
          icon="send-outline"
          onPress={onSend}
          loading={commentMutation.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt },
  headerText: { flex: 1, gap: 2 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  content: { marginTop: spacing.md, gap: spacing.sm },
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
  commentCard: { marginBottom: spacing.sm },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  commentText: { marginTop: spacing.sm },
  commentForm: { gap: spacing.md, marginTop: spacing.lg },
});
