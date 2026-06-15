import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
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
