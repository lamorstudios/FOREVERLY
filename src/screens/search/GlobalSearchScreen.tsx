import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, TextField, Button, Chip, Loading } from '@/components';
import { globalSearch, type GlobalResult, type GlobalResultKind } from '@/api/search';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'GlobalSearch'>;

const ICONS: Record<GlobalResultKind, keyof typeof Ionicons.glyphMap> = {
  person: 'person-outline',
  memory: 'sparkles-outline',
  photo: 'image-outline',
  audio: 'mic-outline',
  time_capsule: 'time-outline',
  film: 'film-outline',
  artifact: 'cube-outline',
};

const EXAMPLES = ['Italien', 'Oma', 'Hochzeit', 'Streuselkuchen'];

export function GlobalSearchScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      setResults(await globalSearch(familyId, trimmed, userId ?? undefined));
    } finally {
      setLoading(false);
    }
  }

  function openResult(r: GlobalResult) {
    if (r.kind === 'film') navigation.navigate('FilmPlayer', { projectId: r.id });
    else if (r.personId) navigation.navigate('LegacyPerson', { personId: r.personId });
  }

  return (
    <Screen tint={colors.tintHistorian}>
      <AppText variant="title">Suche über alles</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Durchsuche Personen, Erinnerungen, Fotos, Audios, Filme, Dokumente und Artefakte.
      </AppText>

      <Card>
        <TextField value={query} onChangeText={setQuery} placeholder="z. B. Italien, Oma, Hochzeit" returnKeyType="search" onSubmitEditing={() => run(query)} />
        <Button label="Suchen" icon="search-outline" onPress={() => run(query)} disabled={!query.trim()} />
      </Card>

      <View style={styles.chips}>
        {EXAMPLES.map((q) => <Chip key={q} label={q} onPress={() => { setQuery(q); run(q); }} />)}
      </View>

      {loading ? (
        <Loading message="Suche läuft …" />
      ) : results ? (
        results.length === 0 ? (
          <Card><AppText variant="body" color={colors.textSecondary}>Keine Treffer in euren Familiendaten.</AppText></Card>
        ) : (
          <View style={styles.section}>
            <AppText variant="caption" color={colors.textMuted}>{results.length} Treffer</AppText>
            {results.map((r) => (
              <Card key={`${r.kind}-${r.id}`} onPress={() => openResult(r)}>
                <View style={styles.row}>
                  <View style={styles.iconCircle}><Ionicons name={ICONS[r.kind]} size={20} color={colors.primary} /></View>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong" numberOfLines={1}>{r.title}</AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>{r.subtitle}</AppText>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.sm },
  section: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
});
