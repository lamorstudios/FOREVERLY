/**
 * i18n – Übersetzungen (leichtgewichtig, ohne externe Abhängigkeit).
 *
 * Aktiv: Deutsch (de) und Englisch (en). Weitere Sprachen sind in
 * `PLANNED_LOCALES` vorgesehen und können später ergänzt werden, indem ein
 * weiteres Wörterbuch (z. B. `es`) nach demselben Schema hinzugefügt und in
 * `SUPPORTED_LOCALES` aufgenommen wird.
 *
 * Fallback-Kette: gewählte Sprache → Englisch → Schlüsseltext (nie leer).
 */

export type Locale = 'de' | 'en';

export const DEFAULT_LOCALE: Locale = 'en';

/** Aktuell auswählbare Sprachen. */
export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
];

/** Geplante Sprachen (Struktur vorbereitet, Übersetzungen folgen später). */
export const PLANNED_LOCALES: string[] = [
  'Español',
  'Français',
  'Italiano',
  'Türkçe',
  'العربية',
  'Polski',
  'Português',
  'Tagalog',
];

type Dict = Record<string, unknown>;

const de: Dict = {
  common: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    back: 'Zurück',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    loading: 'Wird geladen …',
    retry: 'Erneut versuchen',
    error: 'Es ist ein Fehler aufgetreten.',
  },
  settings: {
    title: 'Einstellungen',
    intro: 'Konto, Sicherheit, Speicher und Datenschutz an einem Ort.',
    language: 'Sprache',
    languageSub: 'App-Sprache wählen',
    storage: 'Speicher',
    storageSub: 'Speicherplatz eurer Familie',
    roles: 'Rollen & Rechte',
    rolesSub: 'Wer darf was in der Familie',
    notifications: 'Benachrichtigungen',
    notificationsSub: 'Push & Hinweise je Kategorie',
    privacy: 'Datenschutz & Daten',
    privacySub: 'Export, Löschung, Einwilligungen (DSGVO)',
    feedback: 'Feedback senden',
    feedbackSub: 'Fehler melden, Wünsche & Ideen',
  },
  language: {
    title: 'Sprache',
    intro: 'Wähle die Sprache der App. Du kannst sie jederzeit ändern.',
    note: 'Fehlt eine Übersetzung, wird Englisch angezeigt.',
    deviceHint: 'Beim ersten Start wird die Gerätesprache verwendet.',
  },
};

const en: Dict = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    loading: 'Loading …',
    retry: 'Try again',
    error: 'Something went wrong.',
  },
  settings: {
    title: 'Settings',
    intro: 'Account, security, storage and privacy in one place.',
    language: 'Language',
    languageSub: 'Choose the app language',
    storage: 'Storage',
    storageSub: "Your family's storage space",
    roles: 'Roles & permissions',
    rolesSub: 'Who can do what in the family',
    notifications: 'Notifications',
    notificationsSub: 'Push & alerts per category',
    privacy: 'Privacy & data',
    privacySub: 'Export, deletion, consent (GDPR)',
    feedback: 'Send feedback',
    feedbackSub: 'Report bugs, wishes & ideas',
  },
  language: {
    title: 'Language',
    intro: 'Choose the app language. You can change it anytime.',
    note: 'If a translation is missing, English is shown.',
    deviceHint: 'On first launch the device language is used.',
  },
};

export const TRANSLATIONS: Record<Locale, Dict> = { de, en };
