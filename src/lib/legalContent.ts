/**
 * Rechtstexte für die Beta. Betreiber: Lamor Studios (Inhaber: Nick Mielke).
 * Bewusst als Daten gehalten, leicht mit finalen Unternehmensdaten ergänzbar.
 * Platzhalter ([…]) vor dem öffentlichen Launch vervollständigen.
 */

export type LegalDoc = 'impressum' | 'datenschutz' | 'agb';

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

export const OPERATOR = {
  company: 'Lamor Studios',
  owner: 'Nick Mielke',
  email: 'lamorstudios@gmail.com',
  productLine: 'Foreverly ist ein Produkt von Lamor Studios.',
} as const;

const TODO = '[Bitte vor dem öffentlichen Launch durch finale Angaben ersetzen.]';

export const LEGAL_DOCS: { doc: LegalDoc; label: string; icon: string }[] = [
  { doc: 'impressum', label: 'Impressum', icon: 'business-outline' },
  { doc: 'datenschutz', label: 'Datenschutzerklärung', icon: 'shield-checkmark-outline' },
  { doc: 'agb', label: 'AGB', icon: 'document-text-outline' },
];

export const LEGAL_CONTENT: Record<LegalDoc, LegalContent> = {
  impressum: {
    title: 'Impressum',
    updated: 'Stand: Beta',
    intro: 'Angaben gemäß § 5 DDG / § 18 MStV.',
    sections: [
      { heading: 'Betreiber', body: `${OPERATOR.company}\nInhaber: ${OPERATOR.owner}\n[Straße & Hausnummer]\n[PLZ Ort]\n[Land]\n\n${TODO}` },
      { heading: 'Kontakt', body: `E-Mail: ${OPERATOR.email}\nTelefon: [optional]` },
      { heading: 'Verantwortlich für den Inhalt', body: `${OPERATOR.owner} (Anschrift wie oben).` },
      { heading: 'Umsatzsteuer-ID', body: `[USt-IdNr., falls vorhanden] – ${TODO}` },
      { heading: 'Hinweis', body: OPERATOR.productLine },
    ],
  },
  datenschutz: {
    title: 'Datenschutzerklärung',
    updated: 'Stand: Beta',
    intro: 'Wir verarbeiten personenbezogene Daten sparsam und DSGVO-konform. Diese Beta-Fassung wird vor dem Launch final geprüft.',
    sections: [
      { heading: 'Verantwortlicher', body: `${OPERATOR.company}, ${OPERATOR.owner} (siehe Impressum). Kontakt: ${OPERATOR.email}.` },
      { heading: 'Welche Daten wir verarbeiten', body: 'Nutzerkonto (Name, E-Mail, Profilbild), Familienprofile, sowie von dir hinzugefügte Inhalte: Fotos, Videos, Audios, Dokumente, Erinnerungen und Zeitkapseln. Optional – nur mit deiner ausdrücklichen Freigabe – Standortdaten und Benachrichtigungs-Token.' },
      { heading: 'Zwecke & Rechtsgrundlagen', body: 'Bereitstellung der Familien-Funktionen (Art. 6 Abs. 1 lit. b DSGVO) sowie – für optionale Funktionen wie Standortfreigabe, Benachrichtigungen und KI-Auswertung – auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).' },
      { heading: 'Standortfreigabe', body: 'Die Standortfreigabe ist freiwillig, standardmäßig deaktiviert und jederzeit widerrufbar. Jedes Familienmitglied entscheidet selbst, welche Inhalte und ob es seinen Standort teilt.' },
      { heading: 'Sichtbarkeit & Familienfreigaben', body: 'Inhalte sind nur für Mitglieder der jeweiligen Familie sichtbar; zusätzlich steuerst du je Inhalt die Sichtbarkeit (privat / Inner Circle / Familie). Du entscheidest selbst, welche Inhalte du teilst.' },
      { heading: 'Speicherung & Auftragsverarbeitung', body: `Daten werden bei unserem Hosting-Dienstleister gespeichert; Zugriff ist über Sicherheitsregeln auf Familienmitglieder beschränkt. ${TODO} (AVV mit Dienstleister, Serverstandort, Speicherfristen).` },
      { heading: 'Deine Rechte', body: 'Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerruf von Einwilligungen. Datenexport und Kontolöschung findest du unter „Datenschutz & Daten".' },
      { heading: 'Verantwortung für Inhalte', body: 'Für hochgeladene Fotos, Videos, Audios, Dokumente und Erinnerungen bleiben die jeweiligen Nutzer verantwortlich.' },
      { body: OPERATOR.productLine },
    ],
  },
  agb: {
    title: 'Allgemeine Geschäftsbedingungen (AGB)',
    updated: 'Stand: Beta',
    intro: 'Diese Bedingungen regeln die Nutzung von Foreverly. Beta-Fassung; vor dem Launch final.',
    sections: [
      { heading: '1 · Geltungsbereich & Anbieter', body: `Anbieter ist ${OPERATOR.company}, Inhaber ${OPERATOR.owner}. Mit der Nutzung von Foreverly stimmst du diesen AGB zu.` },
      { heading: '2 · Leistung', body: 'Foreverly ist eine Plattform zum Bewahren von Familienerinnerungen (Familienbaum, Erinnerungen, Zeitkapseln, Dokumente u. a.). Die App ist in der Beta; Funktionen können sich ändern oder zeitweise nicht verfügbar sein.' },
      { heading: '3 · Nutzerinhalte', body: 'Du bleibst Eigentümer deiner Inhalte und bist für sie verantwortlich. Lade nur Inhalte hoch, an denen du die nötigen Rechte hast und für die ggf. Einwilligungen abgebildeter Personen vorliegen.' },
      { heading: '4 · Premium-Abonnements', body: 'Kostenpflichtige Tarife (Plus, Premium) werden – sobald aktiv – über die jeweiligen App-Store-/Zahlungsanbieter abgewickelt. Laufzeit, Verlängerung und Kündigung richten sich nach den dortigen Bedingungen. In der Beta findet keine echte Abrechnung statt.' },
      { heading: '5 · Zeitkapseln & Dokumente', body: 'Zeitkapseln werden bis zum gewählten Zeitpunkt gesperrt. Dokumente dienen ausschließlich der Information/Archivierung. Es werden keine Passwörter, TANs oder Bank-/Wallet-Zugangsdaten gespeichert.' },
      { heading: '6 · Kein Notruf / keine Rechtsberatung', body: 'Die SOS-Funktion ersetzt keine Rettungsdienste oder Notrufeinrichtungen. Foreverly ersetzt keine notarielle Verwahrung, Rechtsberatung oder offizielle Nachlassverwaltung.' },
      { heading: '7 · Haftungsbegrenzung', body: `Foreverly wird mit angemessener Sorgfalt bereitgestellt, in der Beta jedoch „wie besehen" ohne Gewähr für ununterbrochene Verfügbarkeit oder Fehlerfreiheit. Haftung nur nach den gesetzlichen Vorgaben. ${TODO}` },
      { heading: '8 · Kündigung & Kontolöschung', body: 'Du kannst dein Konto jederzeit über „Datenschutz & Daten → Konto/Daten löschen" beenden. Mit der Löschung werden deine personenbezogenen Daten entfernt (gesetzliche Aufbewahrungspflichten bleiben unberührt).' },
      { heading: '9 · Änderungen', body: 'Wir können diese AGB anpassen; über wesentliche Änderungen informieren wir in der App.' },
      { body: OPERATOR.productLine },
    ],
  },
};
