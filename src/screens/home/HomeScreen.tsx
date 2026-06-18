import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, type TextStyle, type ViewStyle, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Screen,
  AppText,
  Appear,
  BetaBanner,
  Button,
  Card,
  Avatar,
  SignedImage,
  SectionHeader,
  EmptyState,
  Loading,
  InviteFamilyButton,
  IconChip,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useTour, useTourTarget } from '@/context/TourContext';
import { DemoBanner } from '@/demo/DemoBanner';
import { listActivities } from '@/api/activities';
import { listUpcomingForMe } from '@/api/timeCapsules';
import { listStatuses } from '@/api/status';
import { listMoments } from '@/api/moments';
import { listCalendarEvents } from '@/api/calendar';
import { listEvents } from '@/api/familyEvents';
import { listSafetyTrips, listSafetyAlerts, listLiveShares } from '@/api/safety';
import { listVaultEntries } from '@/api/vault';
import { listTrustees, getEstateInfo } from '@/api/estate';
import { getOnThisDay } from '@/api/historian';
import { getMemoryOfTheDay, getTreasurePrompts, getElderToAsk } from '@/api/legacyMoments';
import { getFamilyGrowth } from '@/api/familyNetwork';
import { getFirstSteps, type FirstStepKey } from '@/api/onboarding';
import { listNotifications, unreadCount } from '@/api/familyNotifications';
import { qk } from '@/api/queryKeys';
import { STATUS_LEVELS } from '@/constants/phase2';
import { formatRelative, openingCountdown, fullName, daysUntil } from '@/lib/format';
import { colors, radius, spacing, shadow, gradients, withAlpha, useResponsive } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { Activity, MemberStatus, Moment } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const ACTIVITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  'memory.created': 'sparkles-outline',
  'photo.uploaded': 'image-outline',
  'audio.created': 'mic-outline',
  'time_capsule.created': 'time-outline',
};

const MEMORY_KIND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  photo: 'image-outline',
  audio: 'mic-outline',
  video: 'videocam-outline',
  memory: 'sparkles-outline',
  event: 'balloon-outline',
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
  | 'Assistant'
  | 'GlobalSearch'
  | 'LegacyHub'
  | 'MuseumHub'
  | 'FilmGallery'
  | 'LiveMap'
  | 'Sos'
  | 'FamilyYear'
  | 'FamilyWisdoms'
  | 'SeniorMode';

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: QuickRoute;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Familienassistent', icon: 'sparkles', color: colors.secondary, route: 'Assistant' },
  { label: 'Suche', icon: 'search', color: colors.secondary, route: 'GlobalSearch' },
  { label: 'Familienkarte', icon: 'location', color: colors.primary, route: 'LiveMap' },
  { label: 'SOS-Notruf', icon: 'warning', color: colors.error, route: 'Sos' },
  { label: 'Familienmomente', icon: 'images', color: colors.iconMemories, route: 'MomentsHome' },
  { label: 'Familienfilm', icon: 'film', color: colors.accent, route: 'FilmGallery' },
  { label: 'Familienstimmen', icon: 'mic', color: colors.iconAudio, route: 'LegacyHub' },
  { label: 'Euer Familienjahr', icon: 'calendar-number', color: colors.iconBirthday, route: 'FamilyYear' },
  { label: 'Familienweisheiten', icon: 'heart-circle', color: colors.sectionHealth, route: 'FamilyWisdoms' },
  { label: 'Familienmuseum', icon: 'business', color: colors.iconVorsorge, route: 'MuseumHub' },
  { label: 'Historiker', icon: 'sparkles', color: colors.secondary, route: 'HistorianHome' },
  { label: 'Status senden', icon: 'happy', color: colors.success, route: 'Status' },
  { label: 'Kalender', icon: 'calendar', color: colors.accent, route: 'Calendar' },
  { label: 'Notfall', icon: 'alert-circle', color: colors.error, route: 'Emergency' },
  { label: 'Dokumente', icon: 'folder', color: colors.iconDocument, route: 'Documents' },
  { label: 'Familienbuch', icon: 'book', color: colors.primary, route: 'BookHome' },
  { label: 'Vertrauenskreis', icon: 'shield-checkmark', color: colors.secondary, route: 'TrustedCircle' },
  { label: 'Familiennähe', icon: 'heart-circle', color: colors.error, route: 'Closeness' },
  { label: 'Familienzweige', icon: 'git-branch', color: colors.iconFamily, route: 'Branches' },
  { label: 'Seniorenmodus', icon: 'accessibility', color: colors.iconBirthday, route: 'SeniorMode' },
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
  const { activeFamily, isAdmin } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const { isTablet, width } = useResponsive();
  // <340px: 1 Spalte; ab 360px: 2 Spalten (Tablet: 3). Werte ohne Restraum.
  const tileBasis = width < 340 ? '100%' : isTablet ? '31%' : '48%';

  // --- Geführte Tour: Scroll-Steuerung & Ziel-Elemente registrieren ---
  const { setScroller } = useTour();
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  useEffect(() => {
    setScroller({
      scrollTo: (y: number) => scrollRef.current?.scrollTo({ y, animated: true }),
      getOffset: () => scrollOffset.current,
    });
    return () => setScroller(null);
  }, [setScroller]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
  };
  const inviteTarget = useTourTarget('invite');
  const statusTarget = useTourTarget('status');
  const momentsTarget = useTourTarget('moments');
  const tileTargets: Record<string, ReturnType<typeof useTourTarget>> = {
    HistorianHome: useTourTarget('tile-HistorianHome'),
    LiveMap: useTourTarget('tile-LiveMap'),
    Documents: useTourTarget('tile-Documents'),
    Sos: useTourTarget('tile-Sos'),
    Calendar: useTourTarget('tile-Calendar'),
  };

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

  const vaultQuery = useQuery({
    queryKey: qk.vaultEntries(userId ?? ''),
    queryFn: () => listVaultEntries(userId!),
    enabled: !!userId,
  });
  const trusteesQuery = useQuery({
    queryKey: qk.trustees(userId ?? ''),
    queryFn: () => listTrustees(userId!),
    enabled: !!userId,
  });
  const estateQuery = useQuery({
    queryKey: qk.estateInfo(userId ?? ''),
    queryFn: () => getEstateInfo(userId!),
    enabled: !!userId,
  });
  const onThisDayQuery = useQuery({
    queryKey: qk.onThisDay(familyId),
    queryFn: () => getOnThisDay(familyId, userId ?? undefined),
  });
  const onThisDayItems = onThisDayQuery.data ?? [];

  // Legacy Moments & Family Memories
  const memoryOfDayQuery = useQuery({
    queryKey: qk.memoryOfTheDay(familyId),
    queryFn: () => getMemoryOfTheDay(familyId, userId ?? undefined),
  });
  const treasuresQuery = useQuery({
    queryKey: qk.treasurePrompts(familyId),
    queryFn: () => getTreasurePrompts(familyId, userId ?? undefined),
  });
  const elderQuery = useQuery({
    queryKey: qk.elderToAsk(familyId),
    queryFn: () => getElderToAsk(familyId, userId ?? undefined),
  });
  const growthQuery = useQuery({
    queryKey: qk.familyGrowth(familyId),
    queryFn: () => getFamilyGrowth(familyId, userId ?? undefined),
  });
  const memoryOfDay = memoryOfDayQuery.data ?? null;
  const treasures = treasuresQuery.data ?? [];
  const elder = elderQuery.data ?? null;
  const growth = growthQuery.data ?? null;

  // Onboarding · „Deine ersten Schritte"
  const FIRST_STEPS_KEY = 'foreverly.firstStepsDismissed';
  const [stepsDismissed, setStepsDismissed] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(FIRST_STEPS_KEY).then((v) => setStepsDismissed(v === 'true'));
  }, []);
  const firstStepsQuery = useQuery({
    queryKey: qk.firstSteps(familyId, userId ?? ''),
    queryFn: () => getFirstSteps(familyId, userId!),
    enabled: !!userId,
  });
  const firstSteps = firstStepsQuery.data ?? null;
  const showFirstSteps = !stepsDismissed && !!firstSteps && !firstSteps.complete;
  function dismissFirstSteps() {
    setStepsDismissed(true);
    void AsyncStorage.setItem(FIRST_STEPS_KEY, 'true');
  }
  function openStep(key: FirstStepKey) {
    const parent = navigation.getParent() as { navigate: (n: string, p?: object) => void } | undefined;
    if (key === 'profile') parent?.navigate('ProfileTab', { screen: 'EditProfile' });
    else if (key === 'invite') parent?.navigate('FamilyTab', { screen: 'SmartInvite' });
    else if (key === 'memory') parent?.navigate('MemoriesTab', { screen: 'MemoryForm' });
    else if (key === 'tree') parent?.navigate('FamilyTab', { screen: 'Network' });
    else parent?.navigate('CapsulesTab', { screen: 'CapsuleForm' });
  }

  // Familienschatz-Aktion → passende Aufnahme-Route (teils tab-übergreifend).
  function startTreasure(action: 'interview' | 'memory' | 'audio', personId: string | null) {
    if (action === 'interview' && personId) {
      navigation.navigate('LifeInterview', { personId });
      return;
    }
    const parent = navigation.getParent() as { navigate: (n: string, p?: object) => void } | undefined;
    if (action === 'audio') {
      parent?.navigate('MemoriesTab', { screen: 'AudioRecord', params: personId ? { personId } : undefined });
    } else {
      parent?.navigate('MemoriesTab', { screen: 'MemoryForm', params: personId ? { personId } : undefined });
    }
  }

  const unread = unreadCount(notifications.data ?? []);
  const activeTrips = (safetyTripsQuery.data ?? []).filter((t) => t.status === 'active');
  const activeAlerts = (safetyAlertsQuery.data ?? []).filter((a) => a.status === 'active');
  const sharingCount = (liveSharesQuery.data ?? []).length;

  // Vorsorge-Status (fehlende Dokumente, Vertrauenspersonen, Einstellungen)
  const vaultEntries = vaultQuery.data ?? [];
  const vorsorgeMissing: string[] = [];
  if (!vaultEntries.some((e) => e.category === 'testament')) vorsorgeMissing.push('Testament-Hinweis');
  if (!vaultEntries.some((e) => e.category === 'patientenverfuegung')) vorsorgeMissing.push('Patientenverfügung');
  if ((trusteesQuery.data?.length ?? 0) < 2) vorsorgeMissing.push('Vertrauenspersonen');
  if (!estateQuery.data) vorsorgeMissing.push('Nachlass-Einstellungen');
  const vorsorgeUpdated = estateQuery.data?.updated_at ?? vaultEntries[0]?.updated_at ?? null;
  const openVault = () => {
    const parent = navigation.getParent() as
      | { navigate: (name: string, params?: object) => void }
      | undefined;
    parent?.navigate('ProfileTab', { screen: 'VaultHub' });
  };

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
    <Screen onRefresh={onRefresh} refreshing={refreshing} scrollRef={scrollRef} onScroll={onScroll}>
      <BetaBanner />
      <DemoBanner />

      {/* Emotionaler Held: Familienbild & warme Begrüßung */}
      <Appear>
        <View style={[styles.hero, webHeroShadow]}>
          {activeFamily!.image_url ? (
            <SignedImage bucket="photos" path={activeFamily!.image_url} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroImage, styles.heroPlaceholder]}
            >
              {/* Großes, gläsernes Herz rechts als Tiefen-Element (~18% Deckkraft) */}
              <Ionicons name="heart" size={170} color="rgba(255,255,255,0.18)" style={styles.heroHeart} />
            </LinearGradient>
          )}
          {/* Weiche, transparente Lichtflächen für emotionale Tiefe */}
          <View style={styles.heroBlob1} pointerEvents="none" />
          <View style={styles.heroBlob2} pointerEvents="none" />
          <View style={styles.heroBlob3} pointerEvents="none" />
          {/* Sanfter Verlaufs-Scrim (transparent -> dunkel) für Lesbarkeit & Premium-Look */}
          <LinearGradient
            colors={['rgba(20,22,40,0)', 'rgba(20,22,40,0.18)', 'rgba(20,22,40,0.66)'] as const}
            style={styles.heroScrim}
            pointerEvents="none"
          />
          <View style={styles.heroOverlay}>
            <AppText variant="label" color="rgba(255,255,255,0.85)">
              Willkommen zurück
            </AppText>
            <AppText variant="title" color="#FFFFFF">
              {activeFamily!.name}
            </AppText>
            <AppText variant="body" color="rgba(255,255,255,0.92)">
              Schön, dass du da bist. 💛
            </AppText>
          </View>
        </View>
      </Appear>

      {/* Prominenter Einladungs-Button (Wachstum) */}
      <Appear delay={20}>
        <View ref={inviteTarget} collapsable={false}>
          <InviteFamilyButton />
        </View>
      </Appear>

      {/* Onboarding · Deine ersten Schritte */}
      {showFirstSteps && firstSteps ? (
        <Appear delay={25}>
          <Card style={styles.stepsCard}>
            <View style={styles.stepsHeader}>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">🎯 Deine ersten Schritte</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {firstSteps.doneCount}/{firstSteps.total} erledigt
                </AppText>
              </View>
              <Pressable onPress={dismissFirstSteps} hitSlop={10}>
                <AppText variant="label" color={colors.textMuted}>Ausblenden</AppText>
              </Pressable>
            </View>
            {firstSteps.steps.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => openStep(s.key)}
                style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}
                disabled={s.done}
              >
                <Ionicons
                  name={s.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={s.done ? colors.success : colors.primary}
                />
                <AppText
                  variant="body"
                  color={s.done ? colors.textMuted : colors.textPrimary}
                  style={[styles.flex, s.done && styles.stepDone]}
                >
                  {s.label}
                </AppText>
                {!s.done ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
              </Pressable>
            ))}
          </Card>
        </Appear>
      ) : null}

      {/* Familienwachstum */}
      {growth ? (
        <Appear delay={25}>
          <Card onPress={() => { const p = navigation.getParent() as { navigate: (n: string, x?: object) => void } | undefined; p?.navigate('FamilyTab', { screen: 'Network' }); }} style={styles.growthCard}>
            <View style={styles.growthHeader}>
              <Ionicons name="leaf-outline" size={20} color={colors.success} />
              <AppText variant="bodyStrong">Eure Familie wächst</AppText>
            </View>
            <View style={styles.growthGrid}>
              <GrowthStat value={growth.members} label={growth.members === 1 ? 'Mitglied' : 'Mitglieder'} />
              <GrowthStat value={growth.generations} label={growth.generations === 1 ? 'Generation' : 'Generationen'} />
              <GrowthStat value={growth.memories} label="Erinnerungen" />
              <GrowthStat value={growth.capsules} label="Zeitkapseln" />
            </View>
          </Card>
        </Appear>
      ) : null}

      {/* Admin Dashboard – nur für Admins, separater Einstieg (nicht im Profil-Tab) */}
      {isAdmin ? (
        <Appear delay={30}>
          <Card onPress={() => navigation.navigate('AdminDashboard')} gradient={gradients.brand} style={styles.adminCard}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                <Ionicons name="stats-chart-outline" size={22} color={colors.textOnAccent} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong" color={colors.textOnAccent}>Admin Dashboard</AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.85)">
                  Insights & Kennzahlen · nur für Admins
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textOnAccent} />
            </View>
          </Card>
        </Appear>
      ) : null}

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

      {/* Heute in der Familiengeschichte */}
      {onThisDayItems.length > 0 ? (
        <Appear delay={70}>
          <View style={styles.section}>
            <SectionHeader title="Heute in der Familiengeschichte" actionLabel="Alle" onAction={() => navigation.navigate('OnThisDay')} />
            <Card onPress={() => navigation.navigate('OnThisDay')}>
              <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.gold, 0.16) }]}>
                  <Ionicons name="hourglass-outline" size={22} color={colors.bronze} />
                </View>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    Heute vor {onThisDayItems[0]!.yearsAgo} {onThisDayItems[0]!.yearsAgo === 1 ? 'Jahr' : 'Jahren'}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {onThisDayItems[0]!.label}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Card>
          </View>
        </Appear>
      ) : null}

      {/* Erinnerung des Tages */}
      {memoryOfDay ? (
        <Appear delay={72}>
          <View style={styles.section}>
            <SectionHeader title="Erinnerung des Tages" />
            <Card padded={false} style={styles.memoryDayCard}>
              {memoryOfDay.bucket && memoryOfDay.mediaPath ? (
                <SignedImage bucket={memoryOfDay.bucket} path={memoryOfDay.mediaPath} style={styles.memoryDayImage} />
              ) : (
                <View style={[styles.memoryDayImage, styles.memoryDayPlaceholder]}>
                  <Ionicons name={MEMORY_KIND_ICON[memoryOfDay.kind]} size={40} color={colors.gold} />
                </View>
              )}
              <View style={styles.memoryDayBody}>
                <AppText variant="bodyStrong" numberOfLines={2}>{memoryOfDay.title}</AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
                  {memoryOfDay.personName ? `${memoryOfDay.personName} · ` : ''}{memoryOfDay.subtitle}
                </AppText>
              </View>
            </Card>
          </View>
        </Appear>
      ) : null}

      {/* Frag …, solange du noch kannst */}
      {elder ? (
        <Appear delay={74}>
          <View style={styles.section}>
            <Card style={styles.elderCard}>
              <View style={styles.row}>
                <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.gold, 0.18) }]}>
                  <Ionicons name="mic-outline" size={22} color={colors.bronze} />
                </View>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong">{elder.title}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>{elder.message}</AppText>
                </View>
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {elder.score.memories} Erinnerungen · {elder.score.audios} Audios · {elder.score.interviews} Interviews · {elder.score.hint}
              </AppText>
              <Button
                label="Interview starten"
                icon="chatbubbles-outline"
                onPress={() => navigation.navigate('LifeInterview', { personId: elder.score.person.id })}
                style={styles.elderBtn}
              />
            </Card>
          </View>
        </Appear>
      ) : null}

      {/* Familienschatz-Karten */}
      {treasures.length > 0 ? (
        <Appear delay={76}>
          <View style={styles.section}>
            <SectionHeader title="Familienschatz" />
            {treasures.map((t) => (
              <Card key={t.id} style={styles.treasureCard}>
                <View style={styles.row}>
                  <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.bronze, 0.14) }]}>
                    <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.bronze} />
                  </View>
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong">{t.title}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>{t.message}</AppText>
                  </View>
                </View>
                <Button
                  label="Jetzt festhalten"
                  icon="add-circle-outline"
                  variant="secondary"
                  onPress={() => startTreasure(t.action, t.personId)}
                  style={styles.treasureBtn}
                />
              </Card>
            ))}
          </View>
        </Appear>
      ) : null}

      {/* Euer Familienjahr & Familienweisheiten */}
      <Appear delay={78}>
        <View style={styles.section}>
          <Card onPress={() => navigation.navigate('FamilyYear')}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.gold, 0.16) }]}>
                <Ionicons name="calendar-number-outline" size={22} color={colors.bronze} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">Euer Familienjahr {new Date().getFullYear()}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>Automatischer Jahresrückblick eurer Familie</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
          <Card onPress={() => navigation.navigate('FamilyWisdoms')}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.success, 0.16) }]}>
                <Ionicons name="heart-circle-outline" size={22} color={colors.success} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">Familienweisheiten</AppText>
                <AppText variant="caption" color={colors.textSecondary}>Kurze Sätze, die ihr weitergebt – für Buch & Film</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        </View>
      </Appear>

      {/* Vorsorge */}
      <Appear delay={80}>
        <View style={styles.section}>
          <SectionHeader title="Vorsorge" actionLabel="Öffnen" onAction={openVault} />
          <Card onPress={openVault}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: withAlpha(colors.primary, 0.14) }]}>
                <Ionicons name="file-tray-full-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                {vorsorgeMissing.length === 0 ? (
                  <>
                    <AppText variant="bodyStrong">Alles Wichtige hinterlegt 💛</AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {vorsorgeUpdated ? `Zuletzt aktualisiert ${formatRelative(vorsorgeUpdated)}` : 'Dokumente & Nachlass'}
                    </AppText>
                  </>
                ) : (
                  <>
                    <AppText variant="bodyStrong">Noch offen: {vorsorgeMissing.length}</AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {vorsorgeMissing.join(' · ')}
                    </AppText>
                  </>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        </View>
      </Appear>

      {/* Familienmomente – Fotos im Vordergrund */}
      {photoMoments.length > 0 ? (
        <Appear delay={80}>
          <View ref={momentsTarget} collapsable={false} style={styles.section}>
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
        <View ref={statusTarget} collapsable={false} style={styles.section}>
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
                ref={tileTargets[a.route]}
                onPress={() => navigation.navigate(a.route)}
                style={({ pressed }) => [
                  styles.quickTile,
                  { width: tileBasis, maxWidth: tileBasis, flexBasis: tileBasis },
                  pressed && styles.quickTilePressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={a.label}
              >
                {({ pressed }) => (
                  <>
                    <LinearGradient
                      colors={ICON_GLASS}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.quickIcon, iconContainerFx(a.color, pressed)]}
                    >
                      <Ionicons name={a.icon} size={28} color={a.color} />
                    </LinearGradient>
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
                  </>
                )}
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

// Weicher Premium-Schatten + leichter Blur für die Hero-Karte (nur Web).
const webHeroShadow =
  Platform.OS === 'web'
    ? ({
        boxShadow: '0 20px 50px rgba(138,125,255,0.18)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      } as unknown as ViewStyle)
    : null;

// Glas-Verlauf für den Icon-Container der Feature-Kacheln (Apple/Notion-Look).
const ICON_GLASS = ['rgba(255,255,255,0.95)', 'rgba(248,248,255,0.95)'] as const;

// Premium-Icon-Container: weicher Schatten + dezenter, farbiger Glow (stärker beim Tap).
function iconContainerFx(color: string, pressed: boolean): ViewStyle {
  const glow = pressed ? 0.3 : 0.18;
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 8px 24px rgba(91,124,255,0.10), 0 0 18px ${withAlpha(color, glow)}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    } as unknown as ViewStyle;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: glow,
    shadowRadius: 12,
    elevation: 3,
  };
}

// Verlaufstext (nur Web): Zahl im Farbverlauf #5D7CFF -> #A46CFF.
const webGradientNumber =
  Platform.OS === 'web'
    ? ({
        backgroundImage: 'linear-gradient(90deg,#5D7CFF,#A46CFF)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      } as unknown as TextStyle)
    : null;

function GrowthStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.growthStat}>
      <AppText variant="title" color={colors.primaryDark} style={webGradientNumber}>{value}</AppText>
      <AppText variant="caption" color={colors.textSecondary} center>{label}</AppText>
    </View>
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
        <IconChip name={icon} />
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
    // Weicher Premium-Schatten (nativ); Web ergänzt Blur via webHeroShadow.
    shadowColor: '#8A7DFF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 50,
    elevation: 6,
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroPlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  // Links oben – sanftes Weiß
  heroBlob1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -70,
    left: -50,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  // Rechts oben – Apricot
  heroBlob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -50,
    backgroundColor: 'rgba(255,184,108,0.12)',
  },
  // Links unten – Blau
  heroBlob3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: -50,
    left: -40,
    backgroundColor: 'rgba(91,124,255,0.10)',
  },
  heroHeart: { position: 'absolute', right: -6, top: 24 },
  heroOverlay: { padding: spacing.lg, gap: 2 },
  section: { gap: spacing.sm },
  flex: { flex: 1 },
  // Onboarding-Checkliste
  stepsCard: { borderColor: colors.goldSoft, borderWidth: 1.5, backgroundColor: colors.warmWhite, gap: spacing.xs },
  stepsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  stepDone: { textDecorationLine: 'line-through' },
  adminCard: {
    // Premium-Verlaufskarte (Glow); Hintergrund kommt vom gradient-Prop.
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  growthCard: { gap: spacing.sm },
  growthHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // 4 Spalten, wenn Platz – sonst automatisch 2x2 (flexWrap + minWidth).
  growthGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md, columnGap: spacing.md },
  growthStat: { flexGrow: 1, flexBasis: '20%', minWidth: 76, alignItems: 'center', gap: 2 },
  alertCard: { borderColor: colors.error, borderWidth: 1.5 },
  // Legacy Moments
  memoryDayCard: { overflow: 'hidden' },
  memoryDayImage: { width: '100%', height: 180 },
  memoryDayPlaceholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  memoryDayBody: { padding: spacing.md, gap: 2 },
  elderCard: { borderColor: colors.goldSoft, borderWidth: 1.5, backgroundColor: colors.warmWhite, gap: spacing.sm },
  elderBtn: { marginTop: spacing.xs },
  treasureCard: { gap: spacing.sm },
  treasureBtn: { marginTop: spacing.xs },
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
    width: 180,
    height: 236,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'flex-end',
    ...shadow.card,
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
  // Entdecken-Kacheln: 2 gleich breite Spalten, gleiche Ränder, kein Restraum
  quickGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    rowGap: spacing.sm,
  },
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
  // Premium-Glas-Container (abgerundetes Quadrat) statt flachem Kreis.
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTilePressed: { transform: [{ scale: 0.98 }] },
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
