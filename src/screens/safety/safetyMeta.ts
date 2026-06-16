import type {
  LiveStatus,
  SafetyAudience,
  ShareDuration,
} from '@/types/models';

export const STATUS_META: Record<LiveStatus, { emoji: string; label: string }> = {
  home: { emoji: '🏠', label: 'Zuhause' },
  moving: { emoji: '🚗', label: 'Unterwegs' },
  work: { emoji: '🏢', label: 'Arbeit' },
  school: { emoji: '🏫', label: 'Schule' },
  doctor: { emoji: '🏥', label: 'Arzt' },
  vacation: { emoji: '✈️', label: 'Urlaub' },
  custom: { emoji: '📍', label: 'Benutzerdefiniert' },
};

export const AUDIENCE_META: Record<SafetyAudience, string> = {
  inner: 'Inner Circle',
  trusted: 'Trusted Circle',
  family: 'Ganze Familie',
  selected: 'Ausgewählte Personen',
};

export const DURATION_META: Record<ShareDuration, string> = {
  off: 'Nicht teilen',
  '1h': '1 Stunde',
  today: 'Bis heute Abend',
  custom: 'Bestimmter Zeitraum',
  permanent: 'Dauerhaft mit Inner Circle',
};

/** Endzeit einer Freigabe aus der gewählten Dauer berechnen. */
export function expiryFor(duration: ShareDuration): string | null {
  const now = new Date();
  if (duration === '1h') return new Date(now.getTime() + 60 * 60000).toISOString();
  if (duration === 'today') {
    const end = new Date(now);
    end.setHours(22, 0, 0, 0);
    if (end <= now) end.setDate(end.getDate() + 1);
    return end.toISOString();
  }
  if (duration === 'custom') return new Date(now.getTime() + 3 * 60 * 60000).toISOString();
  return null; // permanent / off
}
