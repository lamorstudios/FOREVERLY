import { useLayoutEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Appear,
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
import { listMoments } from '@/api/moments';
import { listCalendarEvents } from '@/api/calendar';
import { listEvents } from '@/api/familyEvents';
import { listSafetyTrips, listSafetyAlerts, listLiveShares } from '@/api/safety';
import { listNotifications, unreadCount } from '@/api/familyNotifications';
import { qk } from '@/api/queryKeys';
import { STATUS_LEVELS } from '@/constants/phase2';
import { formatRelative, openingCountdown, fullName, daysUntil } from '@/lib/format';
import { colors, radius, spacing, shadow, withAlpha, useResponsive } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { Activity, MemberStatus, Moment } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const ACTIVITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  'memory.created': 'sparkles-outline',
  'photo.uploaded': 'image-outline',
  'audio.created': 'mic-outline',
  'time_capsule.created': 'time-outline',
};

type QuickRoute =
  | 'Status'
  | 'Calendar'
  | 'Emergency'
  | 'Documents'
  | 'BookHome'
  | 'TrustedCircle'
  | 'Closeness'
  | 'Branches'
  | 'MomentsHome'
  | 'HistorianHome'
  | 'LiveMap'
  | 'Sos'
  | 'SeniorMode';

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: QuickRoute;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Familienkarte', icon: 'location-outline', color: colors.relationMarried, route: 'LiveMap' },
  { label: 'SOS-Notruf', icon: 'warning-outline', color: colors.error, route: 'Sos' },
  { label: 'Familienmomente', icon: 'images-outline', color: colors.gold, route: 'MomentsHome' },
  { label: 'Historiker', icon: 'sparkles-outline', color: colors.relationAdoption, route: 'HistorianHome' },
  { label: 'Status senden', icon: 'happy-outline', color: colors.success, route: 'Status' },
  { label: 'Kalender', icon: 'calendar-outline', color: colors.relationMarried, route: 'Calendar' },
  { label: 'Notfall', icon: 'alert-circle-outline', color: colors.error, route: 'Emergency' },
  { label: 'Dokumente', icon: 'folder-outline', color: colors.primary, route: 'Documents' },
  { label: 'Familienbuch', icon: 'book-outline', color: colors.primaryDark, route: 'BookHome' },
  { label: 'Vertrauenskreis', icon: 'shield-checkmark-outline', color: colors.relationMarried, route: 'TrustedCircle' },
  { label: 'Familiennähe', icon: 'heart-circle-outline', color: colors.error, route: 'Closeness' },
  { label: 'Familienzweige', icon: 'git-branch-outline', color: colors.success, route: 'Branches' },
  { label: 'Seniorenmodus', icon: 'accessibility-outline', color: colors.gold, route: 'SeniorMode' },
];

interface TodayItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  route?: QuickRoute;
}

/** Tage bis zum nächsten jährlichen Wiederkehrtermin (z. B. Geburtstag). */
function daysUntilAnnual(dateStr: string): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return -1;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(now.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

export function HomeScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const { isTablet } = useResponsive();
  const tileBasis = isTablet ? '31%' : '47%';

  const activities = useQuery({
    queryKey: qk.activities(familyId),
    queryFn: () => listActivities(familyId, 20),
  });
  const moments = useQuery({
    queryKey: qk.moments(familyId, 'all'),
    queryFn: () => listMoments(familyId),
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
  const calendar = useQuery({
    queryKey: qk.calendar(familyId),
    queryFn: () => listCalendarEvents(familyId),
  });
  const events = useQuery({
    queryKey: qk.events(familyId),
    queryFn: () => listEvents(familyId),
  });
  const safetyTripsQuery = useQuery({
    queryKey: qk.safetyTrips(familyId),
    queryFn: () => listSafetyTrips(familyId),
  });
  const safetyAlertsQuery = useQuery({
    queryKey: qk.safetyAlerts(familyId),
    queryFn: () => listSafetyAlerts(familyId),
  });
  const liveSharesQuery = useQuery({
    queryKey: qk.liveShares(familyId),
    queryFn: () => listLiveShares(familyId),
  });

  const unread = unreadCount(notifications.data ?? []);
  const activeTrips = (safetyTripsQuery.data ?? []).filter((t) => t.status === 'active');
  const activeAlerts = (safetyAlertsQuery.data ?? []).filter((a) => a.status === 'active');
  const sharingCount = (liveSharesQuery.data ?? []).length;

  // „Heute in deiner Familie" – kuratierte, emotionale Zusammenfassung.
  const todayItems = useMemo<TodayItem[]>(() => {
    const items: TodayItem[] = [];

    // Nächster Geburtstag (jährlich wiederkehrend).
    const birthdays = (calendar.data ?? [])
      .filter((c) => c.type === 'geburtstag')
      .map((c) => ({ c, days: daysUntilAnnual(c.event_date) }))
      .filter((b) => b.days >= 0 && b.days <= 45)
      .sort((a, b) => a.days - b.days);
    if (birthdays[0]) {
      const { c, days } = birthdays[0];
      items.push({
        id: `bd-${c.id}`,
        icon: 'gift-outline',
        color: colors.gold,
        title: c.title,
        subtitle: days === 0 ? 'Geburtstag heute! 🎉' : `Geburtstag in ${days} ${days === 1 ? 'Tag' : 'Tagen'}`,
      });
    }

    // Familienevent steht an.
    const nextEvent = (events.data ?? [])
      .map((e) => ({ e, days: daysUntil(e.event_date) }))
      .filter((x) => x.days !== null && (x.days as number) >= 0)
      .sort((a, b) => (a.days as number) - (b.days as number))[0];
    if (nextEvent) {
      const d = nextEvent.days as number;
      items.push({
        id: `ev-${nextEvent.e.id}`,
        icon: 'balloon-outline',
        color: colors.relationMarried,
        title: nextEvent.e.title,
        subtitle: d === 0 ? 'Heute' : `Familienevent in ${d} ${d === 1 ? 'Tag' : 'Tagen'}`,
      });
    }

    // Zeitkapsel öffnet bald.
    const nextCapsule = (upcoming.data ?? [])
      .map((c) => ({ c, days: daysUntil(c.open_at) }))
      .filter((x) => x.days !== null && (x.days as number) >= 0)
      .sort((a, b) => (a.days as number) - (b.days as number))[0];
    if (nextCapsule) {
      items.push({
        id: `tc-${nextCapsule.c.id}`,
        icon: 'time-outline',
        color: colors.bronze,
        title: nextCapsule.c.title,
        subtitle: openingCountdown(nextCapsule.c.open_at),
      });
    }

    // Neue Sprachnachricht / neue Erinnerung.
    const audio = (moments.data ?? []).find((m) => m.kind === 'audio');
    if (audio) {
      items.push({
        id: `au-${audio.id}`,
        icon: 'mic-outline',
        color: colors.relationAdoption,
        title: 'Neue Sprachnachricht',
        subtitle: audio.text || formatRelative(audio.created_at),
        route: 'MomentsHome',
      });
    }
    const recentMemory = (activities.data ?? []).find((a) => a.action === 'memory.created');
    if (recentMemory && items.length < 5) {
      items.push({
        id: `me-${recentMemory.id}`,
        icon: 'sparkles-outline',
        color: colors.success,
        title: recentMemory.summary || 'Neue Erinnerung',
        subtitle: `Neue Erinnerung · ${formatRelative(recentMemory.created_at)}`,
      });
    }

    return items.slice(0, 5);
  }, [calendar.data, events.data, upcoming.data, moments.data, activities.data]);
  const photoMoments = (moments.data ?? [])
    .filter((m) => m.kind === 'photo' && m.storage_path)
    .slice(0, 8);

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
    moments.isRefetching ||
    upcoming.isRefetching ||
    statuses.isRefetching ||
    notifications.isRefetching ||
    calendar.isRefetching ||
    events.isRefetching;

  function onRefresh() {
    activities.refetch();
    moments.refetch();
    upcoming.refetch();
    statuses.refetch();
    notifications.refetch();
    calendar.refetch();
    events.refetch();
  }

  if (activities.isLoading) return <Loading message="Einen Moment …" />;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <DemoBanner />

      {/* Emotionaler Held: Familienbild & warme Begrüßung */}
      <Appear>
        <View style={styles.hero}>
          {activeFamily!.image_url ? (
            <SignedImage bucket="photos" path={activeFamily!.image_url} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="heart" size={48} color={colors.gold} />
            </View>
          )}
          <View style={styles.heroScrim} />
          <View style={styles.heroOverlay}>
            <AppText variant="label" color={colors.goldSoft}>
              Willkommen zurück
            </AppText>
            <AppText variant="title" color={colors.textOnAccent}>
              {activeFamily!.name}
            </AppText>
            <AppText variant="body" color={colors.surfaceAlt}>
              Schön, dass du da bist. 💛
            </AppText>
          </View>
        </View>
      </Appear>

      {/* Heute in deiner Familie – emotionale Zusammenfassung */}
      {todayItems.length > 0 ? (
        <Appear delay={40}>
          <View style={styles.section}>
            <SectionHeader title="Heute in deiner Familie" />
            <Card padded={false} style={styles.todayCard}>
              {todayItems.map((it, i) => (
                <TodayRow
                  key={it.id}
                  item={it}
                  showDivider={i > 0}
                  onPress={it.route ? () => navigation.navigate(it.route as QuickRoute) : undefined}
                />
              ))}
            </Card>
          </View>
        </Appear>
      ) : null}

      {/* Familien-Sicherheit */}
      <Appear delay={60}>
        <View style={styles.section}>
          <SectionHeader title="Familien-Sicherheit" actionLabel="Karte" onAction={() => navigation.navigate('LiveMap')} />
          {activeAlerts.length > 0 ? (
            <Card onPress={() => navigation.navigate('Sos')} style={styles.alertCard}>
              <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.error, 0.16) }]}>
                  <Ionicons name="warning" size={22} color={colors.error} />
                </View>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" color={colors.error}>SOS aktiv</AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {fullName(activeAlerts[0]!.person?.first_name, activeAlerts[0]!.person?.last_name) || 'Jemand'} braucht Hilfe
                  </AppText>
                </View>
              </View>
            </Card>
          ) : null}
          {activeTrips.map((t) => (
            <Card key={t.id} onPress={() => navigation.navigate('TripDetail', { tripId: t.id })}>
              <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.relationMarried, 0.16) }]}>
                  <Ionicons name="navigate" size={20} color={colors.relationMarried} />
                </View>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {fullName(t.person?.first_name, t.person?.last_name) || 'Familienmitglied'} ist unterwegs
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    Heimweg → {t.destination_label}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Card>
          ))}
          {activeAlerts.length === 0 && activeTrips.length === 0 ? (
            <Card onPress={() => navigation.navigate('LiveMap')}>
              <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.relationMarried, 0.16) }]}>
                  <Ionicons name="location-outline" size={20} color={colors.relationMarried} />
                </View>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong">Familienkarte</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {sharingCount > 0 ? `${sharingCount} teilen gerade ihren Standort` : 'Niemand teilt gerade – alles ruhig'}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Card>
          ) : null}
        </View>
      </Appear>

      {/* Familienmomente – Fotos im Vordergrund */}
      {photoMoments.length > 0 ? (
        <Appear delay={80}>
          <View style={styles.section}>
            <SectionHeader
              title="Familienmomente"
              actionLabel="Alle ansehen"
              onAction={() => navigation.navigate('MomentsHome')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.momentStrip}
            >
              {photoMoments.map((m) => (
                <MomentCard
                  key={m.id}
                  moment={m}
                  onPress={() => navigation.navigate('MomentsHome')}
                />
              ))}
            </ScrollView>
          </View>
        </Appear>
      ) : null}

      {/* Familienstatus */}
      <Appear delay={140}>
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
      </Appear>

      {/* Anstehende Zeitkapseln */}
      <Appear delay={200}>
        <View style={styles.section}>
          <SectionHeader title="Anstehende Zeitkapseln" />
          {upcoming.data && upcoming.data.length > 0 ? (
            upcoming.data.slice(0, 3).map((c) => (
              <Card key={c.id}>
                <View style={styles.row}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.goldSoft }]}>
                    <Ionicons name="lock-closed-outline" size={22} color={colors.bronze} />
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
      </Appear>

      {/* Entdecken (vormals Schnellzugriff) */}
      <Appear delay={260}>
        <View style={styles.section}>
          <SectionHeader title="Entdecken" />
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.route}
                onPress={() => navigation.navigate(a.route)}
                style={({ pressed }) => [styles.quickTile, { width: tileBasis }, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={a.label}
              >
                <View style={[styles.quickIcon, { backgroundColor: withAlpha(a.color, 0.14) }]}>
                  <Ionicons name={a.icon} size={24} color={a.color} />
                </View>
                <AppText
                  variant="label"
                  center
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={styles.quickLabel}
                >
                  {a.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </Appear>

      {/* Letzte Aktivitäten */}
      <Appear delay={320}>
        <View style={styles.section}>
          <SectionHeader title="Was es Neues gibt" />
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
      </Appear>
    </Screen>
  );
}

function TodayRow({
  item,
  showDivider,
  onPress,
}: {
  item: TodayItem;
  showDivider: boolean;
  onPress?: () => void;
}) {
  const Inner = (
    <View style={styles.todayRow}>
      <View style={[styles.todayIcon, { backgroundColor: withAlpha(item.color, 0.16) }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {item.subtitle}
        </AppText>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </View>
  );
  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
          {Inner}
        </Pressable>
      ) : (
        Inner
      )}
    </View>
  );
}

function MomentCard({ moment, onPress }: { moment: Moment; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.momentCard, pressed && styles.pressed]}>
      <SignedImage bucket="photos" path={moment.storage_path} style={styles.momentImage} />
      {moment.text ? (
        <View style={styles.momentScrim}>
          <AppText variant="caption" color={colors.textOnAccent} numberOfLines={2}>
            {moment.text}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

function StatusBubble({ status }: { status: MemberStatus }) {
  const meta = STATUS_LEVELS[status.level];
  const name = fullName(status.person?.first_name, status.person?.last_name) || 'Familie';
  return (
    <View style={styles.bubble}>
      <View style={styles.bubbleAvatar}>
        <Avatar uri={status.person?.avatar_url} name={name} size={60} />
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
    borderRadius: radius.xl,
    overflow: 'hidden',
    height: 240,
    justifyContent: 'flex-end',
    ...shadow.card,
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroPlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    top: '45%',
    backgroundColor: colors.overlay,
  },
  heroOverlay: { padding: spacing.lg, gap: 2 },
  section: { gap: spacing.sm },
  alertCard: { borderColor: colors.error, borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  // Heute-in-deiner-Familie Digest
  todayCard: { padding: spacing.xs },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  todayIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.sm },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Familienmomente-Strip
  momentStrip: { gap: spacing.md, paddingVertical: spacing.xs, paddingRight: spacing.md },
  momentCard: {
    width: 156,
    height: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'flex-end',
    ...shadow.soft,
  },
  momentImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  momentScrim: { backgroundColor: colors.overlay, padding: spacing.sm },
  // Status-Strip
  statusStrip: { gap: spacing.md, paddingVertical: spacing.xs, paddingRight: spacing.md },
  bubble: { alignItems: 'center', width: 76, gap: spacing.xs },
  bubbleAvatar: { width: 60, height: 60 },
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
  bubbleName: { width: 76 },
  // Entdecken-Kacheln
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickTile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.soft,
  },
  quickLabel: { width: '100%' },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
