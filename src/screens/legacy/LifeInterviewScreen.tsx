import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, TextField, Loading } from '@/components';
import { listLifeStories, addLifeStory } from '@/api/legacy';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { formatRelative } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { LifeStoryKind } from '@/types/models';
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
  const [saving, setSaving] = useState(false);

  function pick(q: string, isFuture: boolean) {
    setQuestion(q); setFuture(isFuture); setAnswer(''); setKind('text');
  }

  async function save() {
    if (!question || !answer.trim()) return;
    setSaving(true);
    try {
      await addLifeStory({ familyId, personId, question, kind, content: answer.trim(), isFutureQuestion: future });
      await storiesQuery.refetch();
      setQuestion(null); setAnswer('');
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

      {question ? (
        <Card>
          <AppText variant="bodyStrong">{question}</AppText>
          <View style={styles.kinds}>
            <Chip label="✍️ Text" selected={kind === 'text'} onPress={() => setKind('text')} />
            <Chip label="🎙️ Audio" selected={kind === 'audio'} onPress={() => setKind('audio')} />
            <Chip label="🎬 Video" selected={kind === 'video'} onPress={() => setKind('video')} />
          </View>
          <TextField
            value={answer}
            onChangeText={setAnswer}
            placeholder={kind === 'text' ? 'Deine Antwort …' : 'Begleittext zur Aufnahme …'}
            multiline
            numberOfLines={5}
            style={styles.multiline}
          />
          {kind !== 'text' ? (
            <AppText variant="caption" color={colors.textMuted}>🎙️ Aufnahme kannst du später hinzufügen – der Begleittext wird gespeichert.</AppText>
          ) : null}
          <View style={styles.formActions}>
            <Button label="Speichern" icon="checkmark-outline" loading={saving} disabled={!answer.trim()} onPress={save} fullWidth={false} />
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
                  <Chip
                    key={q}
                    label={q}
                    color={group.future ? colors.gold : undefined}
                    onPress={() => pick(q, !!group.future)}
                  />
                ))}
              </View>
            </View>
          ))}
        </>
      )}

      {stories.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Gespeicherte Antworten</AppText>
          {stories.map((s) => (
            <Card key={s.id}>
              <View style={styles.row}>
                <Ionicons name={s.kind === 'audio' ? 'mic-outline' : s.kind === 'video' ? 'videocam-outline' : 'chatbubble-outline'} size={20} color={colors.primary} />
                <AppText variant="bodyStrong" style={styles.flex}>{s.question}</AppText>
                {s.is_future_question ? <Chip label="Zukunft" color={colors.gold} /> : null}
              </View>
              {s.content ? <AppText variant="body" color={colors.textSecondary} style={styles.answer}>{s.content}</AppText> : null}
              <AppText variant="caption" color={colors.textMuted}>{formatRelative(s.created_at)}</AppText>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  section: { gap: spacing.sm, marginTop: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  kinds: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.sm },
  multiline: { minHeight: 120, textAlignVertical: 'top', borderRadius: radius.md },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  answer: { marginVertical: spacing.xs },
});
