import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, EmptyState, Loading } from '@/components';
import { getFamilyKnowledge } from '@/api/historian';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import { SourceLine } from './_shared';

type Props = NativeStackScreenProps<HomeStackParamList, 'FamilyKnowledge'>;

export function FamilyKnowledgeScreen({}: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const query = useQuery({
    queryKey: qk.familyKnowledge(familyId),
    queryFn: () => getFamilyKnowledge(familyId, userId ?? undefined),
  });

  if (query.isLoading) {
    return (
      <Screen tint={colors.tintHistorian}>
        <Loading message="Familienwissen wird zusammengestellt …" />
      </Screen>
    );
  }

  const k = query.data;
  const empty = !k || (k.origins.length === 0 && k.professions.length === 0 && k.traditions.length === 0);

  return (
    <Screen tint={colors.tintHistorian} refreshing={query.isFetching} onRefresh={() => query.refetch()}>
      <AppText variant="title">Familienwissen</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Zusammengetragen ausschließlich aus euren vorhandenen Inhalten – nichts erfunden.
      </AppText>

      {empty ? (
        <EmptyState icon="library-outline" title="Noch wenig bekannt" message="Fügt Profile, Erinnerungen und Geschichten hinzu, dann wächst das Familienwissen." />
      ) : (
        <>
          {k!.origins.length > 0 ? (
            <Card>
              <AppText variant="subheading">Woher die Familie stammt</AppText>
              {k!.origins.map((o) => (
                <View key={o.label} style={styles.row}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <AppText variant="body" style={styles.flex}>{o.label}</AppText>
                  <AppText variant="caption" color={colors.textMuted}>{o.count}×</AppText>
                </View>
              ))}
            </Card>
          ) : null}

          {k!.professions.length > 0 ? (
            <Card>
              <AppText variant="subheading">Häufige Berufe</AppText>
              {k!.professions.map((p) => (
                <View key={p.label} style={styles.row}>
                  <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                  <AppText variant="body" style={styles.flex}>{p.label}</AppText>
                  <AppText variant="caption" color={colors.textMuted}>{p.count}×</AppText>
                </View>
              ))}
            </Card>
          ) : null}

          {k!.traditions.length > 0 ? (
            <Card>
              <AppText variant="subheading">Traditionen & wiederkehrende Themen</AppText>
              {k!.traditions.map((t, i) => (
                <View key={`${t.label}-${i}`} style={styles.tradition}>
                  <AppText variant="bodyStrong">🕯️ {t.label}</AppText>
                  <SourceLine source={t.source} />
                </View>
              ))}
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  flex: { flex: 1 },
  tradition: { gap: spacing.xs / 2, paddingVertical: spacing.xs },
});
