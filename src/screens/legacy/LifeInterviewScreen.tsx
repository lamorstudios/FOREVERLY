import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Screen, AppText, Card, Button, Chip, TextField, Loading, VoiceRecorder, VideoRecorder,
} from '@/components';
import { listLifeStories, addLifeStory } from '@/api/legacy';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatRelative } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { LifeStory, LifeStoryKind } from '@/types/models';
import { INTERVIEW_GROUPS } from './legacyMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'LifeInterview'>;

export function LifeInterviewScreen({ route }: Props) {
  const { personId } = route.params;
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const storiesQuery = useQuery({ queryKey: qk.lifeStories(personId), queryFn: () => listLifeStories(personId) });

  const [question, setQuestion] = useState<string | null>(null);
  const [future, setFuture] = useState(false);
  const [answer, setAnswer] = useState('');
  const [kind, setKind] = useState<LifeStoryKind>('text');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  function pick(q: string, isFuture: boolean) {
    setQuestion(q); setFuture(isFuture); setAnswer(''); setKind('text'); setMediaUri(null); setAudioDuration(null);
  }
  function changeKind(k: LifeStoryKind) {
    setKind(k); setMediaUri(null); setAudioDuration(null);
  }

  const canSave = kind === 'text' ? !!answer.trim() : !!mediaUri;

  async function save() {
    if (!question || !canSave) return;
    setSaving(true);
    try {
      await addLifeStory({
        familyId, personId, question, kind,
        content: answer.trim() || null,
        mediaUri: kind === 'text' ? null : mediaUri,
        isFutureQuestion: future,
      });
      await storiesQuery.refetch();
      setQuestion(null); setAnswer(''); setMediaUri(null); setAudioDuration(null);
      setSavedFlash(true);
      flashTimer.current = setTimeout(() => setSavedFlash(false), 2600);
    } finally {
      setSaving(false);
    }
  }

  if (storiesQuery.isLoading) {
    return (<Screen tint={colors.tintHistorian}><Loading message="Wird geladen …" /></Screen>);
  }
  const stories = storiesQuery.data ?? [];

  return (
    <Screen tint={colors.tintHistorian}>
      <AppText variant="title">Erzähl deine Geschichte</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Beantworte eine Frage als Text, Audio oder Video. Originalaufnahmen bleiben immer erhalten.
      </AppText>

      {savedFlash ? (
        <Card style={styles.savedCard}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <AppText variant="bodyStrong" color={colors.success}>Deine Geschichte wurde gespeichert.</AppText>
        </Card>
      ) : null}

      {question ? (
        <Card>
          <AppText variant="bodyStrong">{question}</AppText>
          <View style={styles.kinds}>
            <Chip label="✍️ Text" selected={kind === 'text'} onPress={() => changeKind('text')} />
            <Chip label="🎙️ Audio" selected={kind === 'audio'} onPress={() => changeKind('audio')} />
            <Chip label="🎬 Video" selected={kind === 'video'} onPress={() => changeKind('video')} />
          </View>

          {kind === 'audio' ? (
            <VoiceRecorder
              value={mediaUri ? { uri: mediaUri, durationSeconds: audioDuration ?? 0 } : null}
              onChange={(v) => { setMediaUri(v?.uri ?? null); setAudioDuration(v?.durationSeconds ?? null); }}
            />
          ) : null}
          {kind === 'video' ? (
            <VideoRecorder
              value={mediaUri ? { uri: mediaUri } : null}
              onChange={(v) => setMediaUri(v?.uri ?? null)}
            />
          ) : null}

          <TextField
            value={answer}
            onChangeText={setAnswer}
            placeholder={kind === 'text' ? 'Deine Antwort …' : 'Begleittext zur Aufnahme (optional) …'}
            multiline
            numberOfLines={5}
            style={styles.multiline}
          />

          <View style={styles.formActions}>
            <Button label="Speichern" icon="checkmark-outline" loading={saving} disabled={!canSave} onPress={save} fullWidth={false} />
            <Button label="Abbrechen" variant="ghost" onPress={() => setQuestion(null)} fullWidth={false} />
          </View>
        </Card>
      ) : (
        <>
          {INTERVIEW_GROUPS.map((group) => (
            <View key={group.title} style={styles.section}>
              <AppText variant="bodyStrong">{group.emoji}  {group.title}</AppText>
              <View style={styles.chips}>
                {group.questions.map((q) => (
                  <Chip key={q} label={q} color={group.future ? colors.gold : undefined} onPress={() => pick(q, !!group.future)} />
                ))}
              </View>
            </View>
          ))}
        </>
      )}

      {stories.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Gespeicherte Antworten</AppText>
          {stories.map((s) => <SavedStory key={s.id} story={s} />)}
        </View>
      ) : null}
    </Screen>
  );
}

function SavedStory({ story: s }: { story: LifeStory }) {
  const audio = useAudioPlayer(s.kind === 'audio' ? s.media_path : null);
  return (
    <Card>
      <View style={styles.row}>
        <Ionicons name={s.kind === 'audio' ? 'mic-outline' : s.kind === 'video' ? 'videocam-outline' : 'chatbubble-outline'} size={20} color={colors.primary} />
        <AppText variant="bodyStrong" style={styles.flex}>{s.question}</AppText>
        {s.is_future_question ? <Chip label="Zukunft" color={colors.gold} /> : null}
      </View>
      {s.content ? <AppText variant="body" color={colors.textSecondary} style={styles.answer}>{s.content}</AppText> : null}

      {s.kind === 'audio' && s.media_path ? (
        <Button
          label={audio.isPlaying ? 'Pause' : 'Aufnahme anhören'}
          icon={audio.isPlaying ? 'pause' : 'play'}
          variant="secondary"
          fullWidth={false}
          onPress={audio.toggle}
        />
      ) : null}
      {s.kind === 'video' && s.media_path ? (
        <Video source={{ uri: s.media_path }} useNativeControls resizeMode={ResizeMode.CONTAIN} style={styles.savedVideo} />
      ) : null}

      <AppText variant="caption" color={colors.textMuted}>{formatRelative(s.created_at)}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  savedCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderColor: colors.success, borderWidth: 1.5, marginTop: spacing.sm },
  section: { gap: spacing.sm, marginTop: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  kinds: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.sm },
  multiline: { minHeight: 100, textAlignVertical: 'top', borderRadius: radius.md, marginTop: spacing.sm },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  answer: { marginVertical: spacing.xs },
  savedVideo: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: '#000', marginTop: spacing.xs },
});
