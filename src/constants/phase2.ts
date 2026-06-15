import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import type {
  StatusLevel,
  CalendarEventType,
  DocumentKind,
} from '@/types/models';

export interface StatusMeta {
  level: StatusLevel;
  emoji: string;
  label: string;
  color: string;
  /** Löst eine Benachrichtigung an ausgewählte Mitglieder aus. */
  isAlert: boolean;
}

export const STATUS_LEVELS: Record<StatusLevel, StatusMeta> = {
  gut: { level: 'gut', emoji: '😊', label: 'Mir geht es gut', color: colors.success, isAlert: false },
  okay: { level: 'okay', emoji: '😐', label: 'Alles okay', color: colors.gold, isAlert: false },
  allein: { level: 'allein', emoji: '😔', label: 'Ich fühle mich allein', color: colors.relationMarried, isAlert: true },
  unwohl: { level: 'unwohl', emoji: '🤒', label: 'Mir geht es nicht gut', color: colors.warning, isAlert: true },
  hilfe: { level: 'hilfe', emoji: '🚨', label: 'Ich brauche Hilfe', color: colors.error, isAlert: true },
};

export const STATUS_ORDER: StatusLevel[] = ['gut', 'okay', 'allein', 'unwohl', 'hilfe'];

export interface CalendarTypeMeta {
  type: CalendarEventType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const CALENDAR_TYPES: Record<CalendarEventType, CalendarTypeMeta> = {
  geburtstag: { type: 'geburtstag', label: 'Geburtstag', icon: 'gift-outline', color: colors.relationAdoption },
  jahrestag: { type: 'jahrestag', label: 'Jahrestag', icon: 'heart-outline', color: colors.relationMarried },
  arzttermin: { type: 'arzttermin', label: 'Arzttermin', icon: 'medkit-outline', color: colors.error },
  familienereignis: { type: 'familienereignis', label: 'Familienereignis', icon: 'people-outline', color: colors.primary },
  erinnerung: { type: 'erinnerung', label: 'Erinnerung', icon: 'sparkles-outline', color: colors.gold },
};

export const CALENDAR_TYPE_ORDER: CalendarEventType[] = [
  'geburtstag',
  'jahrestag',
  'arzttermin',
  'familienereignis',
  'erinnerung',
];

export interface DocumentKindMeta {
  kind: DocumentKind;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const DOCUMENT_KINDS: Record<DocumentKind, DocumentKindMeta> = {
  testament: { kind: 'testament', label: 'Testament', icon: 'document-text-outline' },
  patientenverfuegung: { kind: 'patientenverfuegung', label: 'Patientenverfügung', icon: 'pulse-outline' },
  vorsorgevollmacht: { kind: 'vorsorgevollmacht', label: 'Vorsorgevollmacht', icon: 'shield-checkmark-outline' },
  versicherung: { kind: 'versicherung', label: 'Versicherungsunterlagen', icon: 'umbrella-outline' },
  sonstige: { kind: 'sonstige', label: 'Sonstiges Dokument', icon: 'folder-outline' },
};

export const DOCUMENT_KIND_ORDER: DocumentKind[] = [
  'testament',
  'patientenverfuegung',
  'vorsorgevollmacht',
  'versicherung',
  'sonstige',
];
