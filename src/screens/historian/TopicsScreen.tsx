import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, Chip, EmptyState, Loading } from '@/components';
import { getTopics } from '@/api/historian';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import { SourceLine } from './_shared';

type Props = NativeStackScreenProps<HomeStackParamList, 'HistorianTopics'>;

export function TopicsScreen({}: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const query = useQuery({
    queryKey: qk.historianTopics(familyId),
    queryFn: () => getTopics(familyId, userId ?? undefined),
  });

  if (query.isLoading) {
    return (
      <Screen tint={colors.tintHistorian}>
        <Loading message="Themen werden erkannt …" />
      </Screen>
    );
  }

  const topics = query.data ?? [];

  return (
    <Screen tint={colors.tintHistorian} refreshing={query.isFetching} onRefresh={() => query.refetch()}>
      <AppText variant="title">Geschichten & Themen</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Wiederkehrende Themen in euren Erinnerungen, Geschichten und Aufnahmen.
      </AppText>

      {topics.length === 0 ? (
        <EmptyState icon="pricetags-outline" title="Noch keine Themen" message="Sobald mehr Geschichten gespeichert sind, erkennt der Historiker Themen." />
      ) : (
        topics.map((t) => (
          <Card key={t.topic}>
            <View style={styles.head}>
              <AppText variant="subheading" style={styles.flex}>{t.label}</AppText>
              <Chip label={`${t.count} Inhalte`} color={colors.gold} />
            </View>
            <View style={styles.sources}>
              {t.sources.map((s, i) => (
                <SourceLine key={`${s.kind}-${s.entityId}-${i}`} source={s} />
              ))}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  sources: { gap: spacing.sm, marginTop: spacing.sm },
});
