import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Loading, EmptyState } from '@/components';
import { getMemoryJourney } from '@/api/legacy';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'MemoryJourney'>;

export function MemoryJourneyScreen({ route }: Props) {
  const { query, title } = route.params;
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const journeyQuery = useQuery({ queryKey: qk.memoryJourney(familyId, query), queryFn: () => getMemoryJourney(familyId, query, userId ?? undefined) });
  const j = journeyQuery.data;

  if (journeyQuery.isLoading) {
    return (<Screen tint={colors.tintHistorian}><Loading message="Erinnerungsreise wird erstellt …" /></Screen>);
  }

  return (
    <Screen tint={colors.tintHistorian}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="caption" color={colors.textMuted} style={styles.intro}>
        🔎 Eine kleine Dokumentation aus {j?.total ?? 0} echten Inhalten – nichts erfunden.
      </AppText>

      {!j || j.total === 0 ? (
        <EmptyState icon="images-outline" title="Noch nichts gefunden" message="Zu diesem Thema gibt es noch keine Inhalte. Füge Fotos, Audios oder Erinnerungen hinzu." />
      ) : (
        <>
          {j.photos.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="bodyStrong">Bilder</AppText>
              {j.photos.map((d) => (
                <Card key={d.id}>
                  <View style={styles.row}>
                    <Ionicons name="image-outline" size={20} color={colors.primary} />
                    <AppText variant="body" style={styles.flex}>{d.title}</AppText>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          {j.audios.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="bodyStrong">🎙️ Originalstimmen</AppText>
              {j.audios.map((d) => (
                <Card key={d.id}>
                  <View style={styles.row}>
                    <Ionicons name="mic" size={20} color={colors.success} />
                    <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>{d.title}</AppText>
                  </View>
                  <AppText variant="body" color={colors.textSecondary}>{d.text}</AppText>
                </Card>
              ))}
            </View>
          ) : null}

          {j.stories.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="bodyStrong">Geschichten</AppText>
              {j.stories.map((d) => (
                <Card key={d.id}>
                  <AppText variant="bodyStrong">{d.title}</AppText>
                  <AppText variant="body" color={colors.textSecondary}>{d.text}</AppText>
                </Card>
              ))}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  section: { gap: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
