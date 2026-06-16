import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, EmptyState, Loading } from '@/components';
import { listFilmProjects, getAutoFilmSuggestions, createFilmProject } from '@/api/film';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { FilmKind } from '@/types/models';
import { FILM_KIND_META, MUSIC_META, LOCK_META } from './filmMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'FilmGallery'>;

const FILTERS: { value: FilmKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'event', label: 'Ereignisse' },
  { value: 'year', label: 'Jahre' },
  { value: 'person', label: 'Personen' },
  { value: 'legacy', label: 'Vermächtnis' },
];

export function FilmGalleryScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const [filter, setFilter] = useState<FilmKind | 'all'>('all');
  const [busy, setBusy] = useState(false);

  const projectsQuery = useQuery({ queryKey: qk.filmProjects(familyId), queryFn: () => listFilmProjects(familyId) });
  const autoQuery = useQuery({ queryKey: qk.autoFilms(familyId), queryFn: () => getAutoFilmSuggestions(familyId, userId!, userId ?? undefined), enabled: !!userId });

  const projects = (projectsQuery.data ?? []).filter((p) => filter === 'all' || p.kind === filter);
  const existingKeys = new Set((projectsQuery.data ?? []).map((p) => `${p.kind}:${JSON.stringify(p.options)}`));
  const suggestions = (autoQuery.data ?? []).filter((s) => !existingKeys.has(`${s.kind}:${JSON.stringify(s.options)}`)).slice(0, 5);

  async function createFromSuggestion(s: (typeof suggestions)[number]) {
    setBusy(true);
    try {
      const p = await createFilmProject({
        familyId,
        ownerUserId: userId!,
        kind: s.kind,
        title: s.title,
        subtitle: s.subtitle,
        options: s.options,
        music: s.kind === 'year' ? 'feierlich' : s.kind === 'person' ? 'nostalgisch' : 'froehlich',
        auto: true,
      });
      await projectsQuery.refetch();
      navigation.navigate('FilmPlayer', { projectId: p.id });
    } finally {
      setBusy(false);
    }
  }

  if (projectsQuery.isLoading) {
    return (
      <Screen tint={colors.tintMemories}>
        <Loading message="Familienfilme werden geladen …" />
      </Screen>
    );
  }

  return (
    <Screen
      tint={colors.tintMemories}
      refreshing={projectsQuery.isRefetching}
      onRefresh={() => { void projectsQuery.refetch(); void autoQuery.refetch(); }}
    >
      <AppText variant="title">Familienfilm</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Emotionale Filme aus euren echten Fotos, Videos, Audios und Erinnerungen – inklusive
        Originalstimmen. Nichts wird erfunden.
      </AppText>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">✨ Automatisch vorgeschlagen</AppText>
          {suggestions.map((s, i) => {
            const meta = FILM_KIND_META[s.kind];
            return (
              <Card key={`${s.kind}-${i}`} onPress={() => createFromSuggestion(s)}>
                <View style={styles.row}>
                  <View style={styles.iconCircle}><Ionicons name={meta.icon} size={22} color={colors.primary} /></View>
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>{s.title}</AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>{s.subtitle}</AppText>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="bodyStrong">Eure Filme</AppText>
        {projects.length === 0 ? (
          <EmptyState icon="film-outline" title="Noch keine Filme" message="Erstelle deinen ersten Familienfilm oder wähle einen Vorschlag." />
        ) : (
          projects.map((p) => {
            const meta = FILM_KIND_META[p.kind];
            const locked = p.lock !== 'none';
            return (
              <Card key={p.id} onPress={() => navigation.navigate('FilmPlayer', { projectId: p.id })}>
                <View style={styles.row}>
                  <View style={styles.iconCircle}><Ionicons name={locked ? 'lock-closed-outline' : meta.icon} size={22} color={locked ? colors.gold : colors.primary} /></View>
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>{p.title}</AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {meta.label} · {MUSIC_META[p.music].emoji} {MUSIC_META[p.music].label}
                    </AppText>
                  </View>
                  {locked ? <Chip label="Zeitkapsel" color={colors.gold} /> : null}
                </View>
                {locked ? (
                  <AppText variant="caption" color={colors.textMuted} style={styles.lockText}>{LOCK_META[p.lock]}</AppText>
                ) : null}
              </Card>
            );
          })
        )}
      </View>

      <Button label="Eigenen Film erstellen" icon="add-outline" loading={busy} onPress={() => navigation.navigate('FilmCreate', {})} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  section: { gap: spacing.sm, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  lockText: { marginTop: spacing.xs },
});
