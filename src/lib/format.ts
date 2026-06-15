import { format, formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
import { de } from 'date-fns/locale';

/** Datum als TT.MM.JJJJ. */
export function formatDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'dd.MM.yyyy', { locale: de });
}

/** Datum & Uhrzeit. */
export function formatDateTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, "dd.MM.yyyy 'um' HH:mm", { locale: de });
}

/** "vor 3 Stunden" usw. */
export function formatRelative(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true, locale: de });
}

/** Verbleibende Tage bis zu einem Datum (z.B. Zeitkapsel). */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return differenceInCalendarDays(date, new Date());
}

/** Menschlich lesbarer Countdown bis zur Öffnung. */
export function openingCountdown(value?: string | null): string {
  const days = daysUntil(value);
  if (days === null) return '';
  if (days < 0) return 'Bereit zum Öffnen';
  if (days === 0) return 'Öffnet heute';
  if (days === 1) return 'Öffnet morgen';
  return `Öffnet in ${days} Tagen`;
}

/** Sekunden als m:ss. */
export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Vollständiger Name einer Person. */
export function fullName(
  first?: string | null,
  last?: string | null,
): string {
  return [first, last].filter(Boolean).join(' ').trim();
}
