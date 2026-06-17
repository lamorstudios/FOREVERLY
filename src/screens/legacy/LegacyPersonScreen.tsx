import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, Avatar, SignedImage, Loading, EmptyState } from '@/components';
import { getPersonStory, setLegend } from '@/api/legacy';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName, formatDate } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'LegacyPerson'>;

export function LegacyPersonScreen({ navigation, route }: Props) {
  const { personId } = route.params;
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const storyQuery = useQuery({ queryKey: qk.personStory(familyId, personId), queryFn: () => getPersonStory(familyId, personId, userId ?? undefined) });
  const story = storyQuery.data;

  if (storyQuery.isLoading) {
    return (<Screen tint={colors.tintHistorian}><Loading message="Lebensgeschichte wird zusammengestellt …" /></Screen>);
  }
  if (!story) {
    return (<Screen tint={colors.tintHistorian}><EmptyState icon="person-outline" title="Keine Informationen" message="Zu dieser Person sind noch keine Inhalte vorhanden." /></Screen>);
  }

  const name = fullName(story.person.first_name, story.person.last_name);
  const sourceText = `Basiert auf ${story.counts.memories} Erinnerungen, ${story.counts.photos} Fotos und ${story.counts.audios} Audioaufnahmen.`;

  async function toggleLegend() {
    await setLegend(personId, !story!.person.is_legend);
    await storyQuery.refetch();
  }

  return (
    <Screen tint={colors.tintHistorian} refreshing={storyQuery.isRefetching} onRefresh={() => void storyQuery.refetch()}>
      <View style={styles.header}>
        {story.person.avatar_url ? <SignedImage bucket="photos" path={story.person.avatar_url} style={styles.avatar} /> : <Avatar name={name} size={96} />}
        <AppText variant="title" center>{name}</AppText>
        {story.person.is_legend ? <Chip label="★ Familienlegende" selected color={colors.gold} /> : null}
      </View>

      <Card>
        <AppText variant="subheading">Lebensgeschichte</AppText>
        <AppText variant="body" color={colors.textSecondary}>{story.biography}</AppText>
        <AppText variant="caption" color={colors.textMuted} style={styles.source}>🔎 {sourceText}</AppText>
      </Card>

      <View style={styles.actions}>
        <Button label="Erzähl deine Geschichte" icon="chatbubbles-outline" variant="secondary" onPress={() => navigation.navigate('LifeInterview', { personId })} />
        <Button label="Über diese Person fragen" icon="search-outline" variant="ghost" onPress={() => navigation.navigate('HistorianAnswer', { query: `Welche Erinnerungen gibt es an ${story.person.first_name}?` })} />
      </View>

      {/* Stimmenarchiv */}
      <View style={styles.section}>
        <AppText variant="bodyStrong">🎙️ Stimmenarchiv</AppText>
        {story.audios.length === 0 ? (
          <Card><AppText variant="body" color={colors.textSecondary}>Noch keine Sprachaufnahmen vorhanden.</AppText></Card>
        ) : (
          story.audios.map((a) => (
            <Card key={a.id}>
              <View style={styles.row}>
                <Ionicons name="mic" size={22} color={colors.success} />
                <AppText variant="bodyStrong" style={styles.flex} numberOfLines={2}>{a.title ?? 'Audioaufnahme'}</AppText>
                <View style={styles.voiceBadge}>
                  <AppText variant="caption" color={colors.success}>Originalstimme</AppText>
                </View>
              </View>
              {a.transcript ? <AppText variant="body" color={colors.textSecondary} style={styles.transcript}>„{a.transcript}"</AppText> : null}
            </Card>
          ))
        )}
      </View>

      {/* Themen */}
      {story.topics.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Themen</AppText>
          <View style={styles.chips}>
            {story.topics.map((t) => <Chip key={t.topic} label={`${t.label} (${t.count})`} />)}
          </View>
        </View>
      ) : null}

      {/* Lebenslektionen */}
      {story.wisdoms.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Lebenslektionen</AppText>
          {story.wisdoms.map((w) => (
            <Card key={w.id}><AppText variant="body">„{w.text}"</AppText></Card>
          ))}
        </View>
      ) : null}

      {/* Zeitleiste */}
      {story.timeline.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Lebensweg</AppText>
          {story.timeline.map((e) => (
            <View key={e.id} style={styles.timelineRow}>
              <View style={styles.year}><AppText variant="caption" color={colors.primaryDark}>{e.year}</AppText></View>
              <AppText variant="body" style={styles.flex}>{e.label}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        label={story.person.is_legend ? 'Als Legende entfernen' : 'Als Familienlegende markieren'}
        icon="star-outline"
        variant="ghost"
        onPress={toggleLegend}
        style={styles.legendBtn}
      />
      <AppText variant="caption" center color={colors.textMuted}>
        {formatDate(story.person.birth_date)}{story.person.death_date ? ` – ${formatDate(story.person.death_date)}` : ''}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  source: { marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginVertical: spacing.sm },
  section: { gap: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  voiceBadge: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  transcript: { fontStyle: 'italic', marginTop: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  year: { width: 56, height: 30, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  legendBtn: { marginTop: spacing.lg },
});
