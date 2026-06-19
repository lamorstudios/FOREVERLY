import { Ionicons } from '@expo/vector-icons';
import type {
  VaultCategory,
  LegacyKind,
  FarewellKind,
  FarewellRecipient,
  EstateAudience,
} from '@/types/models';

type IoniconName = keyof typeof Ionicons.glyphMap;

export const VAULT_CATEGORY_META: Record<VaultCategory, { label: string; icon: IoniconName }> = {
  testament: { label: 'Testament', icon: 'document-text-outline' },
  patientenverfuegung: { label: 'Patientenverfügung', icon: 'medkit-outline' },
  vorsorgevollmacht: { label: 'Vorsorgevollmacht', icon: 'hand-left-outline' },
  versicherung: { label: 'Versicherungen', icon: 'umbrella-outline' },
  immobilie: { label: 'Immobilienunterlagen', icon: 'home-outline' },
  mietvertrag: { label: 'Mietverträge', icon: 'key-outline' },
  fahrzeug: { label: 'Fahrzeugunterlagen', icon: 'car-outline' },
  notar: { label: 'Notarkontakte', icon: 'briefcase-outline' },
  sonstige: { label: 'Sonstige Dokumente', icon: 'folder-outline' },
};

export const VAULT_CATEGORY_ORDER: VaultCategory[] = [
  'testament', 'patientenverfuegung', 'vorsorgevollmacht', 'versicherung',
  'immobilie', 'mietvertrag', 'fahrzeug', 'notar', 'sonstige',
];

export const LEGACY_META: Record<LegacyKind, { emoji: string; label: string }> = {
  wert: { emoji: '💛', label: 'Familienwerte' },
  lektion: { emoji: '🧭', label: 'Lebenslektionen' },
  geschichte: { emoji: '📖', label: 'Familiengeschichten' },
  rezept: { emoji: '🍲', label: 'Lieblingsrezepte' },
  ort: { emoji: '📍', label: 'Familienorte' },
  erinnerung: { emoji: '✨', label: 'Erinnerungen' },
};

export const FAREWELL_KIND_META: Record<FarewellKind, { label: string; icon: IoniconName }> = {
  text: { label: 'Textnachricht', icon: 'chatbubble-ellipses-outline' },
  audio: { label: 'Audio-Nachricht', icon: 'mic-outline' },
  video: { label: 'Video-Nachricht', icon: 'videocam-outline' },
};

export const FAREWELL_RECIPIENT_META: Record<FarewellRecipient, string> = {
  spouse: 'Ehepartner',
  children: 'Kinder',
  grandchildren: 'Enkel',
  inner: 'Inner Circle',
  selected: 'Ausgewählte Personen',
};

export const AUDIENCE_META: Record<EstateAudience, string> = {
  children: 'Alle Kinder',
  spouse: 'Ehepartner',
  inner: 'Inner Circle',
  trustees: 'Vertrauenspersonen',
  selected: 'Ausgewählte Personen',
};
