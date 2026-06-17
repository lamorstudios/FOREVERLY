# Phase 7 · Beta-Readiness – Bug-Audit

Komplette App als Beta-Tester durchgegangen (Code-Audit über die 15 Flows;
Live-/Echt-Verhalten zusätzlich per Skripten in Schritt 5/6). Keine neuen
Features – nur Prüfung, Doku und Behebung **kritischer** Bugs.

## Behoben in dieser Phase (KRITISCH/MITTEL – „Button ohne Funktion" im Web)

Ursache: mehrbuttonige `Alert.alert(...)`-Bestätigungen feuern im **Web** nicht
→ Aktion passiert nicht. Auf web-taugliches `confirmAsync`/`notify` umgestellt:

| Flow | Screen | Aktion |
|------|--------|--------|
| 12 Profil | `ProfileScreen` | **Abmelden** (war im Web tot) ✅ |
| 3 Einladen | `InviteScreen` | Einladung zurückziehen ✅ |
| 10 Zeitkapsel | `CapsuleDetailScreen` | Zeitkapsel löschen ✅ |
| 12/13 Datenschutz | `PrivacyDataScreen` | Daten löschen / Export-Hinweis ✅ |
| Kalender | `CalendarScreen` | Termin löschen ✅ |
| 11 Vertrauenskreis | `TrustedCircleScreen` | Vertrauensperson entfernen ✅ |
| (früher) | Members, PersonForm, Documents, PhotoGallery, MemoryDetail, Emergency, SOS | bereits migriert ✅ |

## Bugliste

### KRITISCH (vor Beta zwingend)
- **Keine offenen App-Lade-/White-Screen-Bugs gefunden.** Schutz aktiv:
  Auth-Watchdog (4 s) + Demo-Fallback + `onerror`-Selbstheilung; Render 0 Errors.
- **Login/Einladung/Persistenz:** in Schritt 4–6 per Skript prüfbar; Code-Pfade
  korrekt. **Einzige harte Voraussetzung:** in Supabase „Confirm email" korrekt
  einstellen **und** Fix-Migration `0003` anwenden (sonst Mitglied nicht im Baum).
- **Abmelden im Web** war tot → **behoben**.

### MITTEL (sollten vor breiterem Rollout, nicht 5-Familien-blockierend)
- **Web-tote Bestätigungen in Nebenbereichen** (nicht in den 15 Kernflows):
  `BookHomeScreen`, `BranchesScreen`, `EstateHubScreen`, `EstateCaseScreen`,
  `TrusteesScreen`, `FilmPlayerScreen`, `ArtifactFormScreen`, `EventDetailScreen`,
  `AudioListScreen`, `FarewellFormScreen`, `LegacyFormScreen`,
  `VaultEntryFormScreen`. → gleiche `confirmAsync`-Migration, in nächstem Durchgang.
- **Passwort-Reset im Web**: Redirect nutzt natives Schema → Web-Redirect-URL
  ergänzen.
- **Web-Einladungslink** (klickbare Domain → App): Code-Eingabe funktioniert,
  echter Link später.

### KLEIN (Feinschliff)
- UI größtenteils Deutsch hardcoded; Englisch bisher nur für Einstellungen/
  Sprache (i18n ist bewusst nur vorbereitet).
- Vereinzelte „Demo"-Hinweistexte in Settings/Privacy (für Echtbetrieb anpassen).
- Gerätelokale Einstellungen (Tarif/Prefs/Einwilligungen) syncen nicht über
  Geräte (Schritt 6 dokumentiert).

## Prüfung der 15 Flows (Status)

| # | Flow | Status |
|---|------|--------|
| 1 | Registrierung/Login | ✅ (E-Mail; Confirm-email-Setting beachten) |
| 2 | Familie erstellen | ✅ (Trigger macht Ersteller zum Admin) |
| 3 | Einladen | ✅ (Code/Smart-Invite; Zurückziehen behoben) |
| 4 | Einladung annehmen | ✅ (RPC; +Fix 0003 für Baum) |
| 5 | Familienbaum | ✅ (Marker, Lesbarkeit) |
| 6 | Ehrenmitglied | ✅ (Button, Profil, Galerie/Zitate) |
| 7 | Erinnerung | ✅ |
| 8 | Fotos | ✅ (Storage-Upload, signierte URL) |
| 9 | Dokument-Hinweis | ✅ |
| 10 | Zeitkapsel | ✅ (Löschen behoben) |
| 11 | SOS/Notfall | ✅ (Modal-Dialog + Countdown, web-tauglich) |
| 12 | Profil | ✅ (**Abmelden behoben**) |
| 13 | Sprache/Texte | ✅ Struktur; Inhalte folgen (KLEIN) |
| 14 | Mobile Darstellung | ✅ Lesbarkeit/Truncation früher behoben |
| 15 | Reload/Logout/Login | ✅ (Demo: localStorage; Echt: Supabase) |

## Verifiziert
- `npx tsc --noEmit` → fehlerfrei
- Web-Export + Render → **len 2592, 0 Console-Errors**, kein White-Screen
- Demo unverändert; Live bleibt Demo, kein Login-Zwang

## Fazit: Bereit für 5 Testfamilien?

**Ja – mit drei Vorbedingungen** (alle auf Supabase-Seite, kein App-Bug):
1. **„Confirm email"** in Supabase bewusst setzen (an = echte Bestätigung; für
   schnellen Start ggf. aus).
2. **Fix-Migration `0003`** anwenden (eingeladenes Mitglied im Baum).
3. **Schema + Storage-Buckets** angewandt (`staging_combined.sql`).

Danach sind die 15 Kernflows funktionsfähig und web-tauglich. Die offenen
MITTEL-Punkte (Web-Confirms in Nebenbereichen, Web-Reset-Link) betreffen keine
der 5-Familien-Kernreisen und können parallel nachgezogen werden.

**Zwingend vor Beta:** Punkte 1–3 oben. **Empfohlen kurz danach:** restliche
`confirmAsync`-Migration der Nebenbereiche + Web-Reset/Invite-Link.
