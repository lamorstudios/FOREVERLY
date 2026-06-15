import { useLayoutEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Card,
  Avatar,
  SignedImage,
  SectionHeader,
  EmptyState,
  Loading,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { DemoBanner } from '@/demo/DemoBanner';
import { listActivities } from '@/api/activities';
import { listUpcomingForMe } from '@/api/timeCapsules';
import { listStatuses } from '@/api/status';
import { listNotifications, unreadCount } from '@/api/familyNotifications';
import { qk } from '@/api/queryKeys';
import { STATUS_LEVELS } from '@/constants/phase2';
import { formatRelative, openingCountdown, fullName } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { Activity, MemberStatus } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const ACTIVITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  'memory.created': 'sparkles-outline',
  'photo.uploaded': 'image-outline',
  'audio.created': 'mic-outline',
  'time_capsule.created': 'time-outline',
};

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: keyof HomeStackParamList;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Status senden', icon: 'happy-outline', color: colors.success, route: 'Status' },
  { label: 'Kalender', icon: 'calendar-outline', color: colors.relationMarried, route: 'Calendar' },
  { label: 'Notfall', icon: 'alert-circle-outline', color: colors.error, route: 'Emergency' },
  { label: 'Dokumente', icon: 'folder-outline', color: colors.primary, route: 'Documents' },
  { label: 'Seniorenmodus', icon: 'accessibility-outline', color: colors.gold, route: 'SeniorMode' },
];

export function HomeScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const activities = useQuery({
    queryKey: qk.activities(familyId),
    queryFn: () => listActivities(familyId, 20),
  });
  const upcoming = useQuery({
    queryKey: qk.upcomingCapsules(),
    queryFn: listUpcomingForMe,
  });
  const statuses = useQuery({
    queryKey: qk.statuses(familyId),
    queryFn: () => listStatuses(familyId),
  });
  const notifications = useQuery({
    queryKey: qk.notifications(familyId),
    queryFn: () => listNotifications(familyId),
  });

  const unread = unreadCount(notifications.data ?? []);

  // Glocke mit Zähler im Header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          hitSlop={12}
          style={styles.bell}
          accessibilityLabel="Benachrichtigungen"
        >
          <Ionicons name="notifications-outline" size={26} color={colors.primaryDark} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <AppText variant="caption" color={colors.textOnAccent} style={styles.badgeText}>
                {unread > 9 ? '9+' : unread}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      ),
    });
  }, [navigation, unread]);

  const refreshing =
    activities.isRefetching ||
    upcoming.isRefetching ||
    statuses.isRefetching ||
    notifications.isRefetching;

  function onRefresh() {
    activities.refetch();
    upcoming.refetch();
    statuses.refetch();
    notifications.refetch();
  }

  if (activities.isLoading) return <Loading message="Einen Moment …" />;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <DemoBanner />

      {/* Familienbild & Begrüßung */}
      <View style={styles.hero}>
        {activeFamily!.image_url ? (
          <SignedImage bucket="photos" path={activeFamily!.image_url} style={styles.heroImage} />
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

      {/* Familienstatus */}
      <View style={styles.section}>
        <SectionHeader
          title="Familienstatus"
          actionLabel="Status senden"
          onAction={() => navigation.navigate('Status')}
        />
        {statuses.data && statuses.data.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusStrip}
          >
            {statuses.data.map((s) => (
              <StatusBubble key={s.id} status={s} />
            ))}
          </ScrollView>
        ) : (
          <Card>
            <AppText variant="body" color={colors.textSecondary}>
              Noch keine Status gesetzt. Teile, wie es dir geht. 💛
            </AppText>
          </Card>
        )}
      </View>

      {/* Schnellzugriff */}
      <View style={styles.section}>
        <SectionHeader title="Schnellzugriff" />
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.route}
              onPress={() => navigation.navigate(a.route)}
              style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.color }]}>
                <Ionicons name={a.icon} size={26} color={colors.textOnAccent} />
              </View>
              <AppText variant="label" center>
                {a.label}
              </AppText>
            </Pressable>
          ))}
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

function StatusBubble({ status }: { status: MemberStatus }) {
  const meta = STATUS_LEVELS[status.level];
  const name = fullName(status.person?.first_name, status.person?.last_name) || 'Familie';
  return (
    <View style={styles.bubble}>
      <View style={styles.bubbleAvatar}>
        <Avatar uri={status.person?.avatar_url} name={name} size={56} />
        <View style={[styles.bubbleEmoji, { borderColor: meta.color }]}>
          <AppText variant="body">{meta.emoji}</AppText>
        </View>
      </View>
      <AppText variant="caption" center numberOfLines={1} style={styles.bubbleName}>
        {status.person?.first_name ?? '—'}
      </AppText>
    </View>
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
  heroOverlay: { backgroundColor: colors.overlay, padding: spacing.md },
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
  // Status-Strip
  statusStrip: { gap: spacing.md, paddingVertical: spacing.xs, paddingRight: spacing.md },
  bubble: { alignItems: 'center', width: 72, gap: spacing.xs },
  bubbleAvatar: { width: 56, height: 56 },
  bubbleEmoji: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleName: { width: 72 },
  // Schnellzugriff
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickTile: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  // Glocke
  bell: { padding: spacing.xs, marginRight: spacing.xs },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
});
