import { View, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Card,
  EmptyState,
  Loading,
  SectionHeader,
} from '@/components';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  unreadCount,
} from '@/api/familyNotifications';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { friendlyError } from '@/lib/errors';
import { formatRelative } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import { NOTIFICATION_META, type NotificationData, type NotificationType } from '@/lib/notificationCenter';
import type { HomeStackParamList } from '@/navigation/types';
import type { AppNotification } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

type NotificationCategory = AppNotification['category'];

const CATEGORY_ICONS: Record<
  NotificationCategory,
  keyof typeof Ionicons.glyphMap
> = {
  status: 'heart-outline',
  emergency: 'alert-circle',
  calendar: 'calendar-outline',
  info: 'information-circle-outline',
};

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  status: colors.primary,
  emergency: colors.error,
  calendar: colors.gold,
  info: colors.textSecondary,
};

/** Icon/Farbe – bevorzugt aus dem (fachlichen) Benachrichtigungstyp. */
function visuals(n: AppNotification): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const type = (n.data as NotificationData | undefined)?.type as NotificationType | undefined;
  if (type && NOTIFICATION_META[type]) {
    return { icon: NOTIFICATION_META[type].icon, color: NOTIFICATION_META[type].color };
  }
  return { icon: CATEGORY_ICONS[n.category], color: CATEGORY_COLORS[n.category] };
}

export function NotificationsScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: qk.notifications(familyId),
    queryFn: () => listNotifications(familyId),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications(familyId) });
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications(familyId) });
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  if (isLoading) {
    return (
      <Screen>
        <Loading message="Benachrichtigungen werden geladen …" />
      </Screen>
    );
  }

  const notifications = data ?? [];
  const unread = unreadCount(notifications);

  // Antippen: als gelesen markieren und zum passenden Ziel navigieren.
  function open(n: AppNotification) {
    if (!n.is_read) readMutation.mutate(n.id);
    const target = n.data as NotificationData | undefined;
    const nav = navigation as unknown as { navigate: (n: string, p?: object) => void; getParent: () => { navigate: (n: string, p?: object) => void } | undefined };
    if (target?.tab && target.screen) {
      nav.getParent()?.navigate(target.tab, { screen: target.screen, params: target.params });
    } else if (target?.route) {
      nav.navigate(target.route, target.params);
    }
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <AppText variant="display" style={styles.title}>
        Benachrichtigungen
      </AppText>

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="Keine Benachrichtigungen"
          message="Hier siehst du Neuigkeiten aus deiner Familie, sobald es welche gibt."
        />
      ) : (
        <>
          <SectionHeader
            title={
              unread > 0 ? `${unread} ungelesen` : 'Alle gelesen'
            }
            actionLabel={unread > 0 ? 'Alle gelesen' : undefined}
            onAction={
              unread > 0 ? () => readAllMutation.mutate() : undefined
            }
          />
          <View style={styles.list}>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={() => open(notification)}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const { icon, color: accent } = visuals(notification);
  const unread = !notification.is_read;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardRow}>
        <View
          style={[
            styles.accent,
            { backgroundColor: unread ? accent : 'transparent' },
          ]}
        />
        <View
          style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}
        >
          <Ionicons name={icon} size={26} color={accent} />
        </View>
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <AppText
              variant="bodyStrong"
              color={colors.textPrimary}
              style={styles.cardTitle}
              numberOfLines={2}
            >
              {notification.title}
            </AppText>
            {unread ? <View style={[styles.dot, { backgroundColor: accent }]} /> : null}
          </View>
          {notification.body ? (
            <AppText variant="body" color={colors.textSecondary}>
              {notification.body}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.textMuted}>
            {formatRelative(notification.created_at)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  list: { gap: spacing.md, marginTop: spacing.xs },
  card: { paddingLeft: 0, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  accent: {
    width: 5,
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    marginRight: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: { flex: 1, gap: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: { flex: 1 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
});
