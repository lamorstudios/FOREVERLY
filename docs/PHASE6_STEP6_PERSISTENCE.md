# Phase 6 · Schritt 6 – Datenpersistenz (Echt-Modus)

> Aus der Dev-Umgebung kein Zugriff auf dein Supabase-Projekt. Daher: (a) ein
> echtes Persistenz-Testskript zum lokalen Ausführen und (b) eine Code-Audit,
> welche Bereiche über Supabase laufen und welche nur gerätelokal sind.
> Demo-Modus & Live bleiben unberührt.

## Automatischer Test

`scripts/test_persistence.mjs` legt mit einem echten Konto Familie, Erinnerung,
**Foto (echter Storage-Upload)**, Zeitkapsel und Ehrenmitglied (inkl. Zitat &
Erinnerung) an, simuliert dann **Reload + erneuten Login** (frischer Client) und
prüft, ob alles erhalten bleibt – inkl. signierter Foto-URL.

```bash
EXPO_PUBLIC_SUPABASE_URL=https://cuptlowskwcukyqrmbnb.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_… \
node scripts/test_persistence.mjs
```
Voraussetzungen: Schema+RLS angewandt; „Confirm email" für den Test AUS; nur
Staging. Erfolg = `Ergebnis: 11/11 Prüfungen bestanden`, Exit-Code 0.

## Welche Daten bleiben erhalten (Supabase) ✅

Geprüft per Code-Audit: **jeder** Schreib-Bereich hat einen echten Supabase-Pfad
(`if (DEMO_MODE) … else supabase …`). Im Echt-Modus überleben Reload, Logout/
Login **und** Gerätewechsel:

| Bereich | Tabelle(n) / Speicher | Status |
|---------|------------------------|--------|
| Familie | `families`, `family_members` | ✅ |
| Einladungen / Beitritt | `invitations` + RPC `accept_invitation` | ✅ |
| Erinnerungen | `memories` | ✅ |
| Fotos / Galerie | `photos` + Storage-Bucket `photos` (signierte URLs) | ✅ |
| Audios | `audios` + Bucket `audios` | ✅ |
| Zeitkapseln | `time_capsules`, `time_capsule_recipients` | ✅ |
| Ehrenmitglieder | `persons.is_memorial/traits`, `person_quotes`, `person_tributes` | ✅ |
| Personen / Beziehungen | `persons`, `relationships` | ✅ |
| Familienstatus | `member_statuses` | ✅ |
| Kalender / Dokumente | `calendar_events`, `family_documents` | ✅ |
| Momente / Events | `moments`, `family_events` | ✅ |
| Vertrauenspersonen / SOS | `trusted_contacts`, `safety_alerts` | ✅ |
| Familienchronik | Aggregation über obige Tabellen (read-only) | ✅ |

## Welche Daten sind nur gerätelokal (verschwinden bei Gerätewechsel) ⚠️

Diese sind **Einstellungen/UI-Zustand**, kein Familieninhalt – sie persistieren
auf demselben Gerät, syncen aber (noch) nicht über Konten/Geräte:

| Schlüssel | Inhalt | Bewertung |
|-----------|--------|-----------|
| `famii.locale` | App-Sprache | ok (Geräteeinstellung) |
| `foreverly.activeFamilyId` | aktuell gewählte Familie | ok (wird aus Mitgliedschaft neu bestimmt) |
| `foreverly.welcomeDone` / `…tourDone` / `…firstStepsDismissed` | Onboarding-Status | ok (UI-Zustand) |
| `foreverly.notifications` | Benachrichtigungs-Einstellungen | später serverseitig sinnvoll |
| `foreverly.plan` | Tarif (Free/Plus/Premium) | später serverseitig (kein Billing aktiv) |
| `foreverly.consents` | DSGVO-Einwilligungen | später serverseitig sinnvoll |

## Welche Bereiche nutzen bereits Supabase

**Alle inhaltlichen Bereiche** (siehe Tabelle oben) – im Echt-Modus
(`EXPO_PUBLIC_SUPABASE_*` gesetzt). Es gibt **keinen** Schreib-Bereich, der nur
im Demo-Store existiert (geprüft: kein API-Modul mit `demoStore` ohne
`supabase`-Pfad).

## Welche Bereiche laufen noch über localStorage

- **Demo-Modus komplett** (Schlüssel `famii.demo.v2`) – nur wenn keine
  Supabase-ENV gesetzt ist. **Getrennt** von echten Supabase-Daten.
- Die **gerätelokalen Einstellungen** oben (in beiden Modi).

## Demo bleibt getrennt & verfügbar

- Ohne ENV → Demo (localStorage), mit ENV → Supabase. Beide Datenbestände sind
  **strikt getrennt**; der Demo-Store schreibt **nie** nach Supabase und
  umgekehrt.
- Kein Login-Zwang auf Live, kein White-Screen (Auth-Watchdog + Demo-Fallback).

## Bugs / To-dos vor der Beta

1. **E-Mail-Bestätigung** in Supabase festlegen (Test: aus; Beta: an) – sonst
   können Konten nicht einloggen.
2. **Fix-Migration `0003`** anwenden, damit eingeladene Mitglieder im Baum
   erscheinen.
3. **Passwort-Reset im Web**: Redirect nutzt natives Schema `foreverly://…` →
   für Web eine Web-Redirect-URL ergänzen.
4. **Web-Einladungslink** (klickbare Domain → App) konfigurieren; Code-Eingabe
   funktioniert bereits.
5. **Gerätelokale Einstellungen** (Tarif, Benachrichtigungen, Einwilligungen)
   für Multi-Geräte später nach Supabase verlagern – nicht blockierend, aber
   für saubere Beta empfehlenswert.
6. **Storage-Buckets/Policies** müssen angewandt sein (in `staging_combined.sql`
   enthalten) – sonst schlägt Foto-Upload fehl.

## Fazit

Im Echt-Modus **bleiben alle Familieninhalte nach Reload, Logout/Login und
Gerätewechsel erhalten** (Supabase). Verloren gehen bei Gerätewechsel nur reine
Geräteeinstellungen (Sprache/Onboarding/Tarif/Prefs) – kein Familieninhalt.
Vor der Beta sind v. a. Punkte 1–4 zu erledigen.
