import { Ionicons } from '@expo/vector-icons';
import type { FilmKind, FilmMusicMood, FilmLock } from '@/types/models';

type IoniconName = keyof typeof Ionicons.glyphMap;

export const FILM_KIND_META: Record<FilmKind, { label: string; icon: IoniconName }> = {
  event: { label: 'Ereignis-Film', icon: 'sparkles-outline' },
  year: { label: 'Jahresrückblick', icon: 'calendar-outline' },
  person: { label: 'Lebensfilm', icon: 'person-outline' },
  legacy: { label: 'Vermächtnis-Film', icon: 'heart-outline' },
  documentary: { label: 'Familiendokumentation', icon: 'film-outline' },
};

export const MUSIC_META: Record<FilmMusicMood, { label: string; emoji: string }> = {
  emotional: { label: 'Emotional', emoji: '💛' },
  nostalgisch: { label: 'Nostalgisch', emoji: '📻' },
  froehlich: { label: 'Fröhlich', emoji: '🎉' },
  feierlich: { label: 'Feierlich', emoji: '🎺' },
  dokumentarisch: { label: 'Dokumentarisch', emoji: '🎬' },
};

export const LOCK_META: Record<FilmLock, string> = {
  none: 'Sofort sichtbar',
  years5: 'Öffnet in 5 Jahren',
  years10: 'Öffnet in 10 Jahren',
  years20: 'Öffnet in 20 Jahren',
  death: 'Öffnet nach Nachlassfreigabe',
};

/** KI-Vorbereitung – Flags für spätere echte Filmproduktion. */
export const FILM_FEATURE_FLAGS = {
  aiNarration: false, // automatische Erzählstimme
  aiCut: false, // KI-Schnitt / Tempo
  aiSubtitles: false, // automatische Untertitel
  aiChapters: false, // automatische Kapitel
  aiVoiceover: false, // automatische Sprecher
  realRendering: false, // echtes Video-Rendering (Server)
} as const;
