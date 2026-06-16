import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import {
  NOTIFICATION_META,
  buildNotificationMessage,
  simulatePush,
  type NotificationType,
  type NotificationTarget,
  type MessageInput,
} from '@/lib/notificationCenter';
import { getNotificationPrefs, isTypeEnabled } from '@/lib/notificationPrefs';
import { presentLocalNotification } from '@/lib/notifications';
import type { AppNotification } from '@/types/models';

export async function listNotifications(
  familyId: string,
): Promise<AppNotification[]> {
  if (DEMO_MODE) return demoStore.listNotifications();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.markNotificationRead(id);
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(
  familyId: string,
): Promise<void> {
  if (DEMO_MODE) return demoStore.markAllNotificationsRead();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('family_id', familyId)
    .eq('is_read', false);
  if (error) throw error;
}

export function unreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.is_read).length;
}

export interface NotifyInput extends MessageInput {
  familyId: string;
  actorUserId: string;
  type: NotificationType;
  /** Ziel beim Antippen (Tab/Screen/Route). */
  target?: NotificationTarget;
}

/**
 * Zentrale Stelle, um eine Familien-Benachrichtigung auszulösen:
 * baut den warmen Text, respektiert die Nutzer-Einstellungen, legt sie im
 * In-App-Center ab und zeigt (auf dem Gerät) eine lokale Push-Mitteilung.
 * Liefert die erstellte Benachrichtigung – oder null, wenn die Kategorie
 * in den Einstellungen deaktiviert ist.
 */
export async function notifyFamily(input: NotifyInput): Promise<AppNotification | null> {
  const prefs = await getNotificationPrefs();
  if (!isTypeEnabled(prefs, input.type)) return null;

  const meta = NOTIFICATION_META[input.type];
  const message = buildNotificationMessage(input.type, {
    name: input.name,
    subject: input.subject,
    days: input.days,
  });
  const data = { type: input.type, ...(input.target ?? {}) };

  let created: AppNotification;
  if (DEMO_MODE) {
    created = demoStore.addNotification({
      familyId: input.familyId,
      actorUserId: input.actorUserId,
      category: meta.category,
      title: message.title,
      body: message.body,
      data,
    });
  } else {
    const { data: row, error } = await supabase
      .from('notifications')
      .insert({
        family_id: input.familyId,
        actor_user_id: input.actorUserId,
        category: meta.category,
        title: message.title,
        body: message.body,
        data,
      })
      .select('*')
      .single();
    if (error) throw error;
    created = row as AppNotification;
  }

  // Geräte-Mitteilung (lokal) + Demo-Log; echtes Server-Push folgt später.
  void presentLocalNotification(message.title, message.body, data);
  simulatePush(message);
  return created;
}
