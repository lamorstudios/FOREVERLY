import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, EmptyState, Loading } from '@/components';
import { getOnThisDay } from '@/api/historian';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import { SourceLine } from './_shared';

type Props = NativeStackScreenProps<HomeStackParamList, 'OnThisDay'>;

export function OnThisDayScreen({}: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const query = useQuery({
    queryKey: qk.onThisDay(familyId),
    queryFn: () => getOnThisDay(familyId, userId ?? undefined),
  });

  if (query.isLoading) {
    return (
      <Screen tint={colors.tintHistorian}>
        <Loading message="Wird durchsucht …" />
      </Screen>
    );
  }

  const items = query.data ?? [];

  return (
    <Screen tint={colors.tintHistorian} refreshing={query.isFetching} onRefresh={() => query.refetch()}>
      <AppText variant="title">Heute in der Familiengeschichte</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Was an einem Tag wie heute in früheren Jahren passiert ist.
      </AppText>

      {items.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Heute nichts gefunden" message="An diesem Tag liegen in euren Daten keine früheren Ereignisse. Schau morgen wieder vorbei." />
      ) : (
        items.map((it, i) => (
          <Card key={`${it.source.kind}-${it.source.entityId}-${i}`}>
            <View style={styles.head}>
              <View style={styles.badge}>
                <Ionicons name="hourglass-outline" size={16} color={colors.primary} />
                <AppText variant="caption" color={colors.primaryDark}>
                  Heute vor {it.yearsAgo} {it.yearsAgo === 1 ? 'Jahr' : 'Jahren'}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textMuted}>{formatDate(it.date)}</AppText>
            </View>
            <AppText variant="bodyStrong" style={styles.label}>{it.label}</AppText>
            <SourceLine source={it.source} />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { marginVertical: spacing.xs },
});
