# Phase 8 – Private Beta vorbereiten

Launch-Vorbereitung, keine neuen Features. Nur Verbesserungen an Onboarding,
Leerzuständen, Teilen, Fehlerseiten, Beta-Hinweis und Feedback.

## 1. Beta-Onboarding ✅
- Willkommens-Flow (`WelcomeFlowScreen`) + interaktive Tour bei Erststart.
- „Erste Schritte"-Karte auf der Startseite (geführte Aktionen).
- Ehrenmitglied/Erinnerung mit klaren Formularen; seniorenfreundliche Sprache.
→ verständlich für Nicht-Techniker; keine technischen Begriffe im Kernpfad.

## 2. Leere Zustände ✅
- Zentrale Listen nutzen `EmptyState` mit Erklärung + Call-to-Action
  (z. B. Familienchronik: „Jede Familie schreibt Geschichte … Erste Erinnerung
  hinzufügen"; Familienbaum: „Person hinzufügen"; Notfallkontakte usw.).
- Keine leeren weißen Seiten in den Kernflows.

## 3. Einladungslink teilen ✅ (verbessert)
Neu im Einladungs-Ergebnis (`SmartInviteScreen`): drei klare Buttons —
**WhatsApp**, **E-Mail**, **Link kopieren** — plus der allgemeine Teilen-Dialog.
- Web-tauglich über `Linking` (WhatsApp/E-Mail) und Clipboard (Kopieren).
- Helfer: `src/lib/share.ts` (`openWhatsApp`, `openEmail`, `copyText`, `shareText`).
- Der Einladungslink wird weiterhin sichtbar angezeigt (zum manuellen Kopieren).

## 4. Fehlerseiten ✅
- `ErrorBoundary` fängt Render-Fehler ab (freundliche Meldung statt Absturz).
- Deploy-`index.html`: Start-Platzhalter + `onerror`-Selbstheilung (kein
  White-Screen bei Bundle-/Netzwerkfehler).
- Auth-Watchdog (4 s) + Demo-Fallback → kein endloser Ladezustand.
- Web-tote Bestätigungsdialoge in allen Kernflows behoben (Phase 7).

## 5. Beta-Hinweis ✅
Footer zeigt jetzt exakt:
> „FAMII befindet sich aktuell in der privaten Beta. Vielen Dank für euer Feedback."
(plus dezentes „FAMII Beta"-Badge).

## 6. Feedback-System ✅
- Einstellungen → **„Feedback senden"** (`FeedbackScreen`): Bug/Wunsch/Idee.
- Im Demo lokal gespeichert; im Echt-Modus über Supabase.

## 7. Erfolgsprüfung / Skalierung

| Umfang | Bewertung |
|--------|-----------|
| **5 Familien** | ✅ **Bereit** – sobald die 3 Supabase-Vorbedingungen erfüllt sind (Confirm-email-Setting, Fix-Migration 0003, Schema+Buckets). Kernflows funktionieren, web-tauglich, keine White-Screens. |
| **10 Familien** | ✅ Voraussichtlich bereit – gleiche Architektur (Supabase + RLS skaliert problemlos). Empfohlen: vorher restliche Web-Confirms in Nebenbereichen migrieren + Web-Reset/Invite-Link. |
| **25 Familien** | ⚠️ Technisch tragfähig, aber vorher empfehlenswert: echtes Push (statt nur In-App), gerätelokale Einstellungen serverseitig, Monitoring/Fehlertracking, Web-Invite-Deeplink, vollständige i18n der sichtbaren Texte. |

## Beta Ready: **JA** (für 5–10 Familien)

### Kritische offene Punkte (Supabase-seitig, kein App-Bug)
1. **„Confirm email"** in Supabase bewusst setzen.
2. **Fix-Migration `0003`** anwenden (eingeladenes Mitglied erscheint im Baum).
3. **Schema + Storage-Buckets** angewandt (`staging_combined.sql`).

### Empfehlung für den ersten Testlauf
- **Mit 5 Familien starten** (Freunde/Familie), Echt-Modus (Supabase), „Confirm
  email" für den Start ggf. AUS für reibungslosen Einstieg.
- Einladungen über **WhatsApp/Link kopieren** verschicken.
- Feedback-Button aktiv bewerben („Problem melden").
- Nach 1–2 Wochen Feedback auswerten, dann MITTEL-Punkte abarbeiten und auf
  10–25 Familien erweitern.

## Verifiziert
- `npx tsc --noEmit` → fehlerfrei
- Web-Export + Render → **len 2592, 0 Console-Errors**, kein White-Screen
- Demo unverändert; Live bleibt Demo, kein Login-Zwang
