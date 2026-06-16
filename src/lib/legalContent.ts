/**
 * Rechtstexte (vorläufige Platzhalter). Vor dem öffentlichen Launch durch
 * final geprüfte Fassungen ersetzen. Bewusst als Daten gehalten, damit sie
 * leicht aktualisiert und an mehreren Stellen (Auth & Profil) verlinkt werden.
 */

export type LegalDoc = 'impressum' | 'datenschutz' | 'agb' | 'cookies' | 'einwilligungen';

export interface LegalSection {
  heading?: string;
  body: string;
}

export interface LegalContent {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const PLACEHOLDER = 'Platzhalter – wird vor dem öffentlichen Launch durch eine final geprüfte Fassung ersetzt.';

export const LEGAL_DOCS: { doc: LegalDoc; label: string; icon: string }[] = [
  { doc: 'impressum', label: 'Impressum', icon: 'business-outline' },
  { doc: 'datenschutz', label: 'Datenschutzerklärung', icon: 'shield-checkmark-outline' },
  { doc: 'agb', label: 'AGB & Nutzungsbedingungen', icon: 'document-text-outline' },
  { doc: 'cookies', label: 'Cookie-Hinweis', icon: 'cafe-outline' },
  { doc: 'einwilligungen', label: 'Einwilligungen', icon: 'checkmark-done-outline' },
];

export const LEGAL_CONTENT: Record<LegalDoc, LegalContent> = {
  impressum: {
    title: 'Impressum',
    updated: 'Stand: Beta',
    intro: 'Angaben gemäß § 5 DDG / § 18 MStV.',
    sections: [
      { heading: 'Betreiber', body: `Lamor Studios\n[Straße, PLZ Ort]\n[Land]\n\n${PLACEHOLDER}` },
      { heading: 'Kontakt', body: 'E-Mail: lamorstudios@gmail.com' },
      { heading: 'Verantwortlich für den Inhalt', body: `[Name], Anschrift wie oben.\n\n${PLACEHOLDER}` },
    ],
  },
  datenschutz: {
    title: 'Datenschutzerklärung',
    updated: 'Stand: Beta',
    intro: 'Wir verarbeiten personenbezogene Daten DSGVO-konform und sparsam. Diese Fassung ist ein Platzhalter.',
    sections: [
      { heading: 'Verantwortlicher', body: 'Lamor Studios (siehe Impressum).' },
      { heading: 'Welche Daten', body: 'Konto (Name, E-Mail, Profilbild über Google-Login), Familieninhalte (Erinnerungen, Fotos, Videos, Audios, Dokumente, Zeitkapseln) sowie optional Standortdaten – nur, wenn du sie aktiv freigibst.' },
      { heading: 'Zweck & Rechtsgrundlage', body: 'Bereitstellung der App-Funktionen (Art. 6 Abs. 1 lit. b DSGVO) sowie auf Basis deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) für optionale Funktionen wie Standort und KI-Auswertung.' },
      { heading: 'Speicherung', body: 'Daten werden bei unserem Hosting-Dienstleister (Supabase) gespeichert. Zugriff ist über Sicherheitsregeln (RLS) auf Familienmitglieder beschränkt.' },
      { heading: 'Deine Rechte', body: 'Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerruf von Einwilligungen. Datenexport und Kontolöschung findest du unter „Datenschutz & Daten".' },
      { heading: 'Verantwortung für Inhalte', body: 'Für hochgeladene Fotos, Videos, Audios, Dokumente und Erinnerungen bleiben die jeweiligen Nutzer verantwortlich.' },
      { body: PLACEHOLDER },
    ],
  },
  agb: {
    title: 'AGB & Nutzungsbedingungen',
    updated: 'Stand: Beta',
    intro: 'Mit der Nutzung von Foreverly stimmst du diesen Bedingungen zu. Vorläufige Fassung.',
    sections: [
      { heading: 'Leistung', body: 'Foreverly ist eine Plattform zum Bewahren von Familienerinnerungen. Die App befindet sich in der Beta; Funktionen können sich ändern.' },
      { heading: 'Nutzerinhalte', body: 'Du bleibst Eigentümer deiner Inhalte und bist für sie verantwortlich. Lade nur Inhalte hoch, an denen du die nötigen Rechte hast und für die du Einwilligungen abgebildeter Personen besitzt.' },
      { heading: 'Kein Notrufsystem', body: 'Die SOS-Funktion ersetzt keine Rettungsdienste oder Notrufeinrichtungen. Wende dich im Ernstfall an den offiziellen Notruf (z. B. 112).' },
      { heading: 'Keine Rechts-/Nachlassberatung', body: 'Foreverly ersetzt keine notarische Verwahrung, Rechtsberatung oder offizielle Nachlassverwaltung. Dokumente- und Nachlassfunktionen dienen ausschließlich Informations- und Archivzwecken.' },
      { heading: 'Standort', body: 'Standortfreigaben sind freiwillig, standardmäßig deaktiviert und jederzeit widerrufbar.' },
      { body: PLACEHOLDER },
    ],
  },
  cookies: {
    title: 'Cookie-Hinweis',
    updated: 'Stand: Beta',
    intro: 'Foreverly verwendet nur technisch notwendige Speichermechanismen.',
    sections: [
      { heading: 'Notwendig', body: 'Zur Anmeldung und für deine Einstellungen speichern wir Daten lokal auf deinem Gerät (z. B. Sitzung, Spracheinstellungen). Diese sind für den Betrieb erforderlich.' },
      { heading: 'Kein Tracking', body: 'Es werden keine Werbe- oder Tracking-Cookies Dritter gesetzt. Optionale anonyme Nutzungsstatistiken kannst du unter „Datenschutz & Daten" steuern.' },
      { body: PLACEHOLDER },
    ],
  },
  einwilligungen: {
    title: 'Einwilligungen',
    updated: 'Stand: Beta',
    intro: 'Diese Funktionen sind optional und nur mit deiner ausdrücklichen Einwilligung aktiv.',
    sections: [
      { heading: 'Standortfreigabe', body: 'Teilen des Standorts auf der Familienkarte – standardmäßig AUS, jederzeit deaktivierbar.' },
      { heading: 'Benachrichtigungen', body: 'Push-/Familienbenachrichtigungen – pro Kategorie einstellbar.' },
      { heading: 'KI-Auswertung', body: 'Auswertung eigener Inhalte für Historiker/Assistent – widerrufbar.' },
      { heading: 'Verwalten', body: 'Alle Einwilligungen kannst du unter „Datenschutz & Daten" jederzeit anpassen oder widerrufen.' },
    ],
  },
};
