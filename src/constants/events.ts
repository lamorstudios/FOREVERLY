import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import type {
  FamilyEventType,
  RsvpStatus,
  MomentKind,
  MemoryChallenge,
} from '@/types/models';

export interface EventTypeMeta {
  type: FamilyEventType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const EVENT_TYPES: Record<FamilyEventType, EventTypeMeta> = {
  grillfest: { type: 'grillfest', label: 'Grillfest', icon: 'flame-outline', color: colors.error },
  geburtstag: { type: 'geburtstag', label: 'Geburtstag', icon: 'gift-outline', color: colors.relationAdoption },
  weihnachten: { type: 'weihnachten', label: 'Weihnachten', icon: 'snow-outline', color: colors.relationMarried },
  hochzeit: { type: 'hochzeit', label: 'Hochzeit', icon: 'heart-outline', color: colors.gold },
  taufe: { type: 'taufe', label: 'Taufe', icon: 'water-outline', color: colors.relationMarried },
  einschulung: { type: 'einschulung', label: 'Einschulung', icon: 'school-outline', color: colors.success },
  urlaub: { type: 'urlaub', label: 'Familienurlaub', icon: 'airplane-outline', color: colors.primary },
  feier: { type: 'feier', label: 'Familienfeier', icon: 'sparkles-outline', color: colors.gold },
  sonstige: { type: 'sonstige', label: 'Sonstiges', icon: 'calendar-outline', color: colors.textMuted },
};

export const EVENT_TYPE_ORDER: FamilyEventType[] = [
  'grillfest', 'geburtstag', 'weihnachten', 'hochzeit', 'taufe',
  'einschulung', 'urlaub', 'feier', 'sonstige',
];

export interface RsvpMeta {
  status: RsvpStatus;
  emoji: string;
  label: string;
  color: string;
}

export const RSVP_META: Record<RsvpStatus, RsvpMeta> = {
  yes: { status: 'yes', emoji: '✅', label: 'Komme', color: colors.success },
  maybe: { status: 'maybe', emoji: '❓', label: 'Vielleicht', color: colors.warning },
  no: { status: 'no', emoji: '❌', label: 'Kann nicht', color: colors.error },
};

export const RSVP_ORDER: RsvpStatus[] = ['yes', 'maybe', 'no'];

/** Vorschläge für „Ich bringe mit". */
export const BRING_SUGGESTIONS: string[] = [
  '🍰 Kuchen',
  '🥤 Getränke',
  '🔥 Grillkohle',
  '🥗 Salat',
  '🍞 Brot',
  '🍷 Wein',
];

export const MOMENT_KIND_META: Record<
  MomentKind,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  text: { label: 'Text', icon: 'chatbubble-ellipses-outline' },
  photo: { label: 'Foto', icon: 'image-outline' },
  video: { label: 'Video', icon: 'videocam-outline' },
  audio: { label: 'Audio', icon: 'mic-outline' },
};

export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/** Monatliche Erinnerungs-Challenges (rotierend). */
export const MEMORY_CHALLENGES: MemoryChallenge[] = [
  { key: 'jan', month: 1, title: 'Macht heute ein Familienfoto', description: 'Haltet einen ganz normalen Tag im Bild fest.', prompt_type: 'photo' },
  { key: 'feb', month: 2, title: 'Erzählt eure Lieblingsgeschichte', description: 'Welche Geschichte wird in eurer Familie immer wieder erzählt?', prompt_type: 'memory' },
  { key: 'mar', month: 3, title: 'Nehmt eine Nachricht für eure Enkel auf', description: 'Was möchtet ihr kommenden Generationen mitgeben?', prompt_type: 'audio' },
  { key: 'apr', month: 4, title: 'Erzählt von eurer Kindheit', description: 'Eine Erinnerung aus jungen Jahren.', prompt_type: 'memory' },
  { key: 'may', month: 5, title: 'Zeigt euren Lieblingsort', description: 'Ein Foto von einem Ort, der euch viel bedeutet.', prompt_type: 'photo' },
  { key: 'jun', month: 6, title: 'Ein Sommermoment', description: 'Haltet einen schönen Sommermoment fest.', prompt_type: 'photo' },
  { key: 'jul', month: 7, title: 'Eine Familienweisheit', description: 'Welcher Spruch begleitet eure Familie?', prompt_type: 'audio' },
  { key: 'aug', month: 8, title: 'Ein Rezept der Familie', description: 'Erzählt von einem Lieblingsgericht.', prompt_type: 'memory' },
  { key: 'sep', month: 9, title: 'Ein Foto mit den Großeltern', description: 'Macht ein Foto mit Oma oder Opa.', prompt_type: 'photo' },
  { key: 'oct', month: 10, title: 'Eine Reiseerinnerung', description: 'Erzählt von einer besonderen Reise.', prompt_type: 'memory' },
  { key: 'nov', month: 11, title: 'Eine Stimme bewahren', description: 'Nehmt jemanden auf, der etwas erzählt.', prompt_type: 'audio' },
  { key: 'dec', month: 12, title: 'Ein Festtagsfoto', description: 'Haltet einen festlichen Moment fest.', prompt_type: 'photo' },
];

export function challengeOfMonth(month: number): MemoryChallenge {
  return MEMORY_CHALLENGES[(month - 1) % 12]!;
}
