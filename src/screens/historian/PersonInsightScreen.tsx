import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  AppText,
  Card,
  Avatar,
  SignedImage,
  EmptyState,
  Loading,
} from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { getPersonInsight, getPersonTimeline, getPersonConnections } from '@/api/historian';
import { fullName } from '@/lib/format';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import type { HomeStackParamList } from '@/navigation/types';
import { SourceLine } from './_shared';

const AVATAR_SIZE = 88;

interface CountItem {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}

export function PersonInsightScreen({
  route,
}: NativeStackScreenProps<HomeStackParamList, 'PersonInsight'>) {
  const { personId } = route.params;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;

  const insightQuery = useQuery({
    queryKey: qk.personInsight(familyId, personId),
    queryFn: () => getPersonInsight(familyId, personId, userId ?? undefined),
  });
  const timelineQuery = useQuery({
    queryKey: qk.personTimeline(familyId, personId),
    queryFn: () => getPersonTimeline(familyId, personId, userId ?? undefined),
  });
  const connectionsQuery = useQuery({
    queryKey: qk.personConnections(familyId, personId),
    queryFn: () => getPersonConnections(familyId, personId, userId ?? undefined),
  });

  if (insightQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Profil wird zusammengestellt …" />
      </Screen>
    );
  }

  const insight = insightQuery.data;

  if (!insight) {
    return (
      <Screen
        refreshing={insightQuery.isFetching}
        onRefresh={() => insightQuery.refetch()}
      >
        <EmptyState
          icon="person-outline"
          title="Keine Informationen vorhanden"
          message="Zu dieser Person sind in euren Familiendaten noch keine Angaben gespeichert."
        />
      </Screen>
    );
  }

  const name = fullName(insight.person.first_name, insight.person.last_name);
  const counts: CountItem[] = [
    { icon: 'sparkles-outline', value: insight.memoryCount, label: 'Erinnerungen' },
    { icon: 'image-outline', value: insight.photoCount, label: 'Fotos' },
    { icon: 'mic-outline', value: insight.audioCount, label: 'Audios' },
  ];

  return (
    <Screen
      refreshing={insightQuery.isFetching}
      onRefresh={() => insightQuery.refetch()}
    >
      <View style={styles.header}>
        {insight.person.avatar_url ? (
          <SignedImage
            bucket="photos"
            path={insight.person.avatar_url}
            style={styles.avatar}
          />
        ) : (
          <Avatar name={name} size={AVATAR_SIZE} />
        )}
        <AppText variant="title" center>
          {name}
        </AppText>
        <AppText variant="body" color={colors.textSecondary} center>
          Wer war diese Person?
        </AppText>
      </View>

      <View style={styles.countsRow}>
        {counts.map((item) => (
          <View key={item.label} style={styles.countItem}>
            <Ionicons name={item.icon} size={26} color={colors.primary} />
            <AppText variant="heading">{item.value}</AppText>
            <AppText variant="caption" color={colors.textMuted} center>
              {item.label}
            </AppText>
          </View>
        ))}
      </View>

      <Card>
        <AppText variant="subheading">KI-Kurzzusammenfassung</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {insight.biography}
        </AppText>
      </Card>

      {timelineQuery.data && timelineQuery.data.length > 0 ? (
        <Card>
          <AppText variant="subheading">Lebenszeitleiste</AppText>
          <View style={styles.timeline}>
            {timelineQuery.data.map((e) => (
              <View key={e.id} style={styles.timelineRow}>
                <AppText variant="bodyStrong" color={colors.primary} style={styles.year}>
                  {e.year}
                </AppText>
                <AppText variant="body" style={styles.flex}>
                  {e.label}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {connectionsQuery.data && connectionsQuery.data.length > 0 ? (
        <Card>
          <AppText variant="subheading">Häufig gemeinsam erwähnt</AppText>
          <View style={styles.timeline}>
            {connectionsQuery.data.map((c) => (
              <View key={c.person.id} style={styles.connectionRow}>
                <Avatar name={fullName(c.person.first_name, c.person.last_name)} size={36} />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {fullName(c.person.first_name, c.person.last_name)}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {c.reason}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {insight.sources.length > 0 ? (
        <Card>
          <AppText variant="subheading">Quellen:</AppText>
          <View style={styles.sources}>
            {insight.sources.map((source, index) => (
              <SourceLine
                key={`${source.kind}-${source.entityId}-${index}`}
                source={source}
              />
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  countItem: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  sources: { gap: spacing.sm, marginTop: spacing.xs },
  timeline: { gap: spacing.sm, marginTop: spacing.xs },
  timelineRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  year: { width: 52 },
  flex: { flex: 1 },
  connectionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
