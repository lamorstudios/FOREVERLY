# Phase 6 · Schritt 5 – Einladungsflow live testen (automatisiert)

> Ich kann dein Supabase-Projekt aus der Entwicklungsumgebung **nicht** erreichen
> (Netzwerk nur GitHub). Damit der Test trotzdem **echt** läuft, gibt es ein
> automatisiertes E2E-Skript, das **du lokal** mit deinem Anon-Key startest. Es
> führt zwei echte Testkonten durch den kompletten Flow und gibt **ja/nein pro
> Schritt** aus. Live-App/Demo bleiben unberührt.

## Voraussetzungen (einmalig)

1. Schema + RLS angewandt: `supabase/staging_combined.sql` im SQL Editor.
2. Fix-Migration angewandt: `supabase/migrations/20260617000003_phase6_accept_invitation_link.sql`
   (sorgt dafür, dass das eingeladene Mitglied **im Familienbaum** erscheint).
3. Supabase → **Authentication → Providers → Email**: „**Confirm email**" für den
   Test **AUS** (sonst entstehen keine Test-Sessions). Vor Echtbetrieb wieder AN.
4. Nur auf dem **Staging-Projekt** ausführen (legt echte Wegwerf-Testdaten an).

## Ausführen

```bash
EXPO_PUBLIC_SUPABASE_URL=https://cuptlowskwcukyqrmbnb.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_… \
node scripts/test_invite_flow.mjs
```

## Was das Skript prüft (= deine 9 Punkte)

| # | Schritt | Prüfung im Skript |
|---|---------|-------------------|
| 1 | A registriert sich | `auth.signUp` + Session |
| 2 | A erstellt Familie | `insert families` (+ Trigger macht A zum Admin) |
| 3 | A erzeugt Einladung | `insert invitations` (Smart-Invite mit Person + Beziehung) |
| 4/5 | B öffnet Link / registriert sich | `auth.signUp` (Code wird übergeben) |
| 6 | B wird zugeordnet | `rpc('accept_invitation')` → liefert family_id |
| 7 | Beide sehen dieselbe Familie | `family_members` aus Sicht A **und** B |
| 8 | B im Familienbaum | `persons.user_id == B` **und** Beziehung A→B vorhanden |
| 9 | Rollen | A = `admin`, B = `member` |
| + | **RLS** | Konto C (keine Familie) sieht **0** Personen der Familie |

## Erwartetes Ergebnis (Code-/SQL-verifiziert)

| Frage | Erwartung |
|-------|-----------|
| Einladung funktioniert | **ja** |
| Familienzuordnung funktioniert | **ja** |
| Gemeinsamer Familienbaum funktioniert | **ja** (mit Fix-Migration 0003 + Smart-Invite) |
| Rollen funktionieren | **ja** (A admin, B member) |
| RLS / keine fremden Daten | **ja** (C sieht nichts) |

Bei Erfolg endet das Skript mit `Ergebnis: 8/8 Schritte bestanden` und Exit-Code 0.

## Welche Fehler/Punkte noch offen sind

- **„Confirm email" muss für den Test aus sein** – sonst scheitern die Sessions
  (Schritt 1). Vor Echtbetrieb wieder einschalten.
- **Fix-Migration 0003 nötig** für Schritt 8 (sonst ist B nur Mitglied, kein
  Baumknoten) – das meldet das Skript dann explizit.
- **Web-Einladungslink**: die Code-Eingabe funktioniert; ein klickbarer
  Web-Link (Domain → App) ist später zu konfigurieren.
- **Generische Einladung (nur Code, ohne Person)**: B wird Mitglied, erscheint
  bewusst **nicht** als Baumknoten – für Baum-Sichtbarkeit „Familienmitglied
  einladen" (Smart-Invite) nutzen.
- **Aufräumen**: Das Skript legt Wegwerf-Konten/-daten an; auf dem Staging-
  Projekt unkritisch.

## Sicherheit / Stabilität

- Nur **Anon-Key** (wie die App); kein service_role.
- Test läuft über echte **RLS** (authentifizierte Sessions) → realistische Prüfung.
- **Demo-Modus** unverändert; **kein Login-Zwang** auf Live; keine weißen Screens.

Schick mir die Skript-Ausgabe (die ja/nein-Zeilen) – dann bestätige ich den
Status abschließend und wir gehen den nächsten Schritt an.
