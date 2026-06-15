import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Card,
  SignedImage,
  SectionHeader,
  EmptyState,
  Loading,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { DemoBanner } from '@/demo/DemoBanner';
import { listActivities } from '@/api/activities';
import { listUpcomingForMe } from '@/api/timeCapsules';
import { qk } from '@/api/queryKeys';
import { formatRelative, openingCountdown, fullName } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { Activity } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const ACTIVITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  'memory.created': 'sparkles-outline',
  'photo.uploaded': 'image-outline',
  'audio.created': 'mic-outline',
  'time_capsule.created': 'time-outline',
};

export function HomeScreen(_props: Props) {
  const { activeFamily } = useFamily();
  const navigation = useNavigation<any>();
  const familyId = activeFamily!.id;

  const activities = useQuery({
    queryKey: qk.activities(familyId),
    queryFn: () => listActivities(familyId, 20),
  });
  const upcoming = useQuery({
    queryKey: qk.upcomingCapsules(),
    queryFn: listUpcomingForMe,
  });

  const refreshing = activities.isRefetching || upcoming.isRefetching;
  function onRefresh() {
    activities.refetch();
    upcoming.refetch();
  }

  if (activities.isLoading) return <Loading message="Einen Moment …" />;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <DemoBanner />

      {/* Familienbild & Begrüßung */}
      <View style={styles.hero}>
        {activeFamily!.image_url ? (
          <SignedImage
            bucket="photos"
            path={activeFamily!.image_url}
            style={styles.heroImage}
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="heart" size={40} color={colors.gold} />
          </View>
        )}
        <View style={styles.heroOverlay}>
          <AppText variant="caption" color={colors.textOnAccent}>
            Willkommen zurück
          </AppText>
          <AppText variant="title" color={colors.textOnAccent}>
            {activeFamily!.name}
          </AppText>
        </View>
      </View>

      {/* Anstehende Zeitkapseln */}
      <View style={styles.section}>
        <SectionHeader title="Anstehende Zeitkapseln" />
        {upcoming.data && upcoming.data.length > 0 ? (
          upcoming.data.slice(0, 3).map((c) => (
            <Card key={c.id}>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Ionicons name="lock-closed-outline" size={22} color={colors.gold} />
                </View>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong">{c.title}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {openingCountdown(c.open_at)}
                  </AppText>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card>
            <AppText variant="body" color={colors.textSecondary}>
              Aktuell warten keine Zeitkapseln auf dich.
            </AppText>
          </Card>
        )}
      </View>

      {/* Letzte Aktivitäten */}
      <View style={styles.section}>
        <SectionHeader title="Letzte Aktivitäten" />
        {activities.data && activities.data.length > 0 ? (
          activities.data.map((a) => <ActivityRow key={a.id} activity={a} />)
        ) : (
          <EmptyState
            icon="leaf-outline"
            title="Noch keine Aktivitäten"
            message="Fügt eure ersten Erinnerungen, Fotos oder Zeitkapseln hinzu – sie erscheinen dann hier."
          />
        )}
      </View>
    </Screen>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const icon = ACTIVITY_ICON[activity.action] ?? 'ellipse-outline';
  const actorName = fullName(activity.actor?.full_name) || 'Jemand';
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.rowText}>
          <AppText variant="body">
            <AppText variant="bodyStrong">{actorName}</AppText>
            {'  '}
            {activity.summary ?? ''}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {formatRelative(activity.created_at)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 200,
    justifyContent: 'flex-end',
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroPlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    backgroundColor: colors.overlay,
    padding: spacing.md,
  },
  section: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
