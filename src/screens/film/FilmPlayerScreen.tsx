import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, Loading } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { getFilmProject, generateFilmForProject, updateFilmProject } from '@/api/film';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { openingCountdown, formatDuration } from '@/lib/format';
import { colors, spacing, radius, shadow } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { FilmScene } from '@/types/models';
import { FILM_KIND_META, MUSIC_META, LOCK_META } from './filmMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'FilmPlayer'>;

export function FilmPlayerScreen({ route }: Props) {
  const { projectId } = route.params;
  const { userId } = useAuth();
  const [preview, setPreview] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);

  const projectQuery = useQuery({ queryKey: qk.filmProject(projectId), queryFn: () => getFilmProject(projectId) });
  const project = projectQuery.data ?? null;

  const filmQuery = useQuery({
    queryKey: qk.generatedFilm(projectId),
    queryFn: () => generateFilmForProject(project!, userId ?? undefined),
    enabled: !!project,
  });
  const film = filmQuery.data ?? null;
  const scenes: FilmScene[] = film ? film.chapters.flatMap((c) => c.scenes) : [];

  useEffect(() => {
    if (!playing || scenes.length === 0) return;
    const t = setInterval(() => {
      setIdx((i) => {
        if (i + 1 >= scenes.length) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 3200);
    return () => clearInterval(t);
  }, [playing, scenes.length]);

  if (projectQuery.isLoading || !project) {
    return (
      <Screen tint={colors.tintMemories}>
        <Loading message="Film wird vorbereitet …" />
      </Screen>
    );
  }

  const meta = FILM_KIND_META[project.kind];
  const locked = project.lock !== 'none' && !preview;
  const lockReason = project.lock === 'death'
    ? 'Dieser Film öffnet sich nach der Nachlassfreigabe.'
    : project.open_at
      ? openingCountdown(project.open_at)
      : LOCK_META[project.lock];

  function share() {
    Alert.alert('Film teilen', 'Mit wem möchtest du diesen Film teilen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ganze Familie', onPress: () => {} },
      { text: 'Inner Circle', onPress: () => {} },
    ]);
  }

  async function toggleChapter(key: string) {
    const hidden = project!.hidden_chapters.includes(key)
      ? project!.hidden_chapters.filter((k) => k !== key)
      : [...project!.hidden_chapters, key];
    await updateFilmProject(project!.id, { hidden_chapters: hidden });
    await projectQuery.refetch();
    await filmQuery.refetch();
  }

  return (
    <Screen tint={colors.tintMemories} refreshing={filmQuery.isFetching} onRefresh={() => filmQuery.refetch()}>
      {/* Cover */}
      <View style={styles.cover}>
        <View style={styles.coverScrim} />
        <View style={styles.coverContent}>
          <AppText variant="caption" color={colors.goldSoft}>{meta.label}</AppText>
          <AppText variant="title" color={colors.textOnAccent}>{project.title}</AppText>
          {project.subtitle ? <AppText variant="body" color={colors.surfaceAlt}>{project.subtitle}</AppText> : null}
        </View>
      </View>

      <View style={styles.metaRow}>
        <Chip label={`${MUSIC_META[project.music].emoji} ${MUSIC_META[project.music].label}`} color={colors.gold} />
        {film ? <Chip label={`${film.sceneCount} Szenen · ${formatDuration(film.durationSec)}`} /> : null}
        {film?.hasOriginalVoices ? <Chip label="🎙️ Originalstimmen" color={colors.success} /> : null}
      </View>

      {locked ? (
        <Card style={styles.lockCard}>
          <Ionicons name="lock-closed" size={32} color={colors.gold} />
          <AppText variant="subheading" center>Zeitkapsel-Film</AppText>
          <AppText variant="body" center color={colors.textSecondary}>{lockReason}</AppText>
          <Button label="Vorschau ansehen (nur du)" variant="secondary" icon="eye-outline" onPress={() => setPreview(true)} />
        </Card>
      ) : filmQuery.isLoading ? (
        <Loading message="Storyboard wird erstellt …" />
      ) : !film || scenes.length === 0 ? (
        <Card><AppText variant="body" color={colors.textSecondary}>Für diesen Film sind noch nicht genug Inhalte vorhanden. Füge Fotos, Audios oder Erinnerungen hinzu.</AppText></Card>
      ) : (
        <>
          <Button label="Film abspielen" icon="play-circle-outline" onPress={() => { setIdx(0); setPlaying(true); }} />

          {film.chapters.map((c) => (
            <View key={c.key} style={styles.chapter}>
              <AppText variant="subheading">{c.title}</AppText>
              {c.scenes.map((s) => <SceneCard key={s.id} scene={s} />)}
            </View>
          ))}

          <Card>
            <AppText variant="bodyStrong">Kapitel anpassen (Storyboard)</AppText>
            <AppText variant="caption" color={colors.textSecondary}>Tippe ein Kapitel an, um es ein- oder auszublenden.</AppText>
            <View style={styles.chips}>
              {['intro', 'highlights', 'voices', 'memories', 'family', 'events', 'moments', 'message', 'values'].map((key) => (
                <Chip key={key} label={key} selected={!project.hidden_chapters.includes(key)} onPress={() => toggleChapter(key)} />
              ))}
            </View>
          </Card>

          <Button label="Film teilen" icon="share-social-outline" variant="secondary" onPress={share} />
        </>
      )}

      {/* Wiedergabe */}
      <Modal visible={playing} transparent animationType="fade" onRequestClose={() => setPlaying(false)}>
        <Pressable style={styles.playerBackdrop} onPress={() => setPlaying(false)}>
          <View style={styles.playerStage}>
            {scenes[idx] ? <PlayingScene scene={scenes[idx]!} /> : null}
            <View style={styles.progress}>
              {scenes.map((_, i) => (
                <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
              ))}
            </View>
            <AppText variant="caption" color={colors.surfaceAlt} center>Tippen zum Beenden · {MUSIC_META[project.music].label}e Musik</AppText>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function SceneCard({ scene }: { scene: FilmScene }) {
  if (scene.type === 'title') {
    return (
      <Card style={styles.titleScene}>
        <AppText variant="subheading" center>{scene.title}</AppText>
        {scene.caption ? <AppText variant="caption" center color={colors.textSecondary}>{scene.caption}</AppText> : null}
      </Card>
    );
  }
  if (scene.type === 'photo' && scene.mediaPath) {
    return (
      <View style={styles.photoScene}>
        <SignedImage bucket="photos" path={scene.mediaPath} style={styles.photo} />
        {scene.caption ? <AppText variant="caption" color={colors.textSecondary} style={styles.cap}>{scene.caption}</AppText> : null}
      </View>
    );
  }
  if (scene.type === 'video') {
    return (
      <View style={styles.photoScene}>
        {scene.mediaPath ? <SignedImage bucket="photos" path={scene.mediaPath} style={styles.photo} /> : <View style={[styles.photo, styles.videoPlaceholder]} />}
        <View style={styles.videoBadge}><Ionicons name="play" size={16} color={colors.textOnAccent} /></View>
        {scene.caption ? <AppText variant="caption" color={colors.textSecondary} style={styles.cap}>{scene.caption}</AppText> : null}
      </View>
    );
  }
  if (scene.type === 'audio') {
    return (
      <Card style={styles.audioScene}>
        <View style={styles.audioRow}>
          <Ionicons name="mic" size={22} color={colors.success} />
          <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>{scene.title ?? 'Originalstimme'}</AppText>
          <Chip label="Originalstimme" color={colors.success} />
        </View>
        {scene.transcript ? <AppText variant="body" color={colors.textSecondary} style={styles.transcript}>„{scene.transcript}"</AppText> : null}
      </Card>
    );
  }
  return (
    <Card>
      <AppText variant="bodyStrong">{scene.title}</AppText>
      {scene.caption ? <AppText variant="body" color={colors.textSecondary}>{scene.caption}</AppText> : null}
    </Card>
  );
}

function PlayingScene({ scene }: { scene: FilmScene }) {
  if ((scene.type === 'photo' || scene.type === 'video') && scene.mediaPath) {
    return (
      <View style={styles.stageMedia}>
        <SignedImage bucket="photos" path={scene.mediaPath} style={styles.stageImage} />
        {scene.caption ? <AppText variant="bodyStrong" center color={colors.textOnAccent} style={styles.stageCap}>{scene.caption}</AppText> : null}
      </View>
    );
  }
  return (
    <View style={styles.stageText}>
      {scene.type === 'audio' ? <Ionicons name="mic" size={40} color={colors.goldSoft} /> : null}
      <AppText variant="title" center color={colors.textOnAccent}>{scene.title ?? scene.caption}</AppText>
      {scene.transcript ? <AppText variant="body" center color={colors.surfaceAlt} style={styles.stageCap}>„{scene.transcript}"</AppText> : null}
      {scene.caption && scene.title ? <AppText variant="body" center color={colors.surfaceAlt}>{scene.caption}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { height: 180, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.primaryDark, justifyContent: 'flex-end', ...shadow.card },
  coverScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  coverContent: { padding: spacing.lg, gap: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.sm },
  lockCard: { alignItems: 'center', gap: spacing.sm },
  chapter: { gap: spacing.sm, marginTop: spacing.sm },
  titleScene: { backgroundColor: colors.surfaceAlt, alignItems: 'center', gap: spacing.xs },
  photoScene: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  photo: { width: '100%', height: 200 },
  videoPlaceholder: { backgroundColor: colors.surfaceMuted },
  videoBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: colors.overlay, borderRadius: 999, padding: 6 },
  cap: { padding: spacing.sm },
  audioScene: { gap: spacing.xs },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  transcript: { fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  // Wiedergabe
  playerBackdrop: { flex: 1, backgroundColor: 'rgba(20,16,12,0.94)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  playerStage: { width: '100%', alignItems: 'center', gap: spacing.lg },
  stageMedia: { width: '100%', alignItems: 'center', gap: spacing.md },
  stageImage: { width: '100%', height: 320, borderRadius: radius.lg },
  stageCap: { marginTop: spacing.xs },
  stageText: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  progress: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: colors.gold, width: 18 },
});
