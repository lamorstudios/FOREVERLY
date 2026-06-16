# Foreverly – Release & Skalierung (Phase 15)

## App-Store-Texte (Entwurf)

**Name:** Foreverly – Familiengedächtnis

**Untertitel:** Erinnerungen, Familiengeschichte & Vorsorge

**Kurzbeschreibung:**
Foreverly ist das digitale Zuhause eurer Familiengeschichte: Familienbaum,
Erinnerungen, Fotos, Stimmen, Familienfilme, Zeitkapseln, ein KI-Assistent und
sichere Vorsorge – emotional, privat und für kommende Generationen.

**Keywords:** Familie, Stammbaum, Erinnerungen, Zeitkapsel, Nachlass, Vorsorge,
Familienbuch, Genealogie, Familienfilm.

## Datenschutz (Kurzfassung)
- Inhalte gehören der Familie; Sichtbarkeit ist pro Inhalt/Nähe steuerbar.
- KI-Funktionen nutzen nur freigegebene Inhalte und erfinden nichts.
- DSGVO: Datenexport, Löschung und Einwilligungen in der App
  (Profil → Einstellungen → Datenschutz & Daten).
- Keine Passwörter/Bankzugänge im Nachlassbereich – nur Hinweise.

## Rollen
Admin, Mitglied, Inner Circle, Vertrauensperson (Trustee), Trusted Circle,
Gast – Rechte zentral in `src/lib/roles.ts`.

## Monetarisierung
- Free: kleine Familien (bis 5 Mitglieder, 2 GB).
- Family Premium (9,99 €/Monat): Filme, Historiker/Familienstimmen,
  PDF-Familienbuch, Premium-Zeitkapseln, 200 GB – ein Abo für die ganze Familie.
- Definition: `src/lib/premium.ts`, Status: `PremiumContext` (Store-Abwicklung
  im Realbetrieb).

## Skalierung & Performance
- Familienwelt: ego-zentrierter Graph (nur relevante Knoten je Ansicht) bleibt
  auch bei großen Familien flüssig.
- Listen über React-Query gecacht; Aggregationen (Historiker/Assistent/Museum)
  laufen über eine gemeinsame, gefilterte Datensammlung.
- Architektur-Flags: `src/lib/productionFlags.ts`
  (Push, E2E, Backups, Audit-Logs, Geräte-/Sitzungsverwaltung, Medien-
  Komprimierung/Transkodierung, Analytics, Billing).

## Offene Schritte für echten Store-Release
- Supabase-Migrationen für neue Tabellen (estate, vault, safety, film, life,
  artifacts, feedback) + RLS-Policies.
- App-Icons & Splash, Store-Screenshots.
- Echte Push-Tokens (expo-notifications) + Server.
- Zahlungsabwicklung (App Store / Google Play / Stripe).
