# Phase 6 · Schritt 4 – Auth / Login (Staging) – Status & Test

> **Ergebnis:** Auth ist **bereits vollständig implementiert** und Staging-bereit.
> Es waren **keine neuen Features und keine UI-Änderungen** nötig. Auth ist
> **optional**: ohne Supabase-ENV bleibt die Demo aktiv, auf Live kein Login-Zwang.

## 1. E-Mail-Login – Status: ✅ fertig

| Funktion | Wo im Code | Status |
|----------|-----------|--------|
| Registrieren (+ Name + DSGVO-Einwilligung) | `RegisterScreen` → `AuthContext.signUp` | ✅ |
| Einloggen | `LoginScreen` → `AuthContext.signIn` | ✅ |
| Passwort vergessen | `ForgotPasswordScreen` → `AuthContext.resetPassword` | ✅ |
| E-Mail-Bestätigung erneut senden | `VerifyEmailScreen` → `resendConfirmation` | ✅ |

- Beim Registrieren wird der **Name** als `full_name` mitgegeben; der DB-Trigger
  `handle_new_user` legt automatisch das **Profil** an und übernimmt Name (und
  optionales Avatar) aus den Metadaten.

## 2. Google-Login – Status: ⏭️ späterer Schritt

Bewusst **noch nicht** eingebaut, weil sauber nur mit zusätzlicher Einrichtung
möglich (Google-OAuth-Provider im Supabase-Dashboard + Redirect-URLs + nativer
Redirect-Flow), die hier nicht testbar ist. Es wurde **kein** halbfertiger/toter
Google-Button hinzugefügt. Aktivierung später als eigener kleiner Schritt:
Supabase → Authentication → Providers → Google + Redirect-URLs, dann
`signInWithOAuth` ergänzen.

## 3. Auth ist optional / kein White-Screen – Status: ✅

- **Demo-Fallback:** `DEMO_MODE = demoMode==='true' || !isSupabaseConfigured`
  → ohne gültige ENV läuft alles in der Demo.
- **Live ohne Login:** Deploy erzwingt `EXPO_PUBLIC_DEMO_MODE: 'true'`.
- **Kein Hänger:** Auth-Watchdog (4 s + `.catch`) im `AuthContext`; zusätzlich
  Start-Platzhalter + `onerror`-Selbstheilung im Deploy.

## 4. Nach Login – Status: ✅

Gesteuert vom `RootNavigator`:
- keine Sitzung → **Auth** (Welcome/Login/Register)
- Sitzung, 0 Familien → **Onboarding**: Familie erstellen **oder** Einladung
  annehmen (`NoFamily` → `CreateFamily` / `JoinFamily`)
- Sitzung + Familie → **Haupt-App**

Profil: automatisch angelegt (Trigger), Name gespeichert, Profilbild optional
über `EditProfile`.

## 5. Staging-Test (auf deinem Rechner, Echt-Modus)

Voraussetzung: kombinierte SQL ausgeführt (38 Tabellen + RLS) und lokale `.env`
mit `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

**Empfohlene Supabase-Einstellung für schnelles Testen:**
Authentication → Providers → **Email aktiv**. Für zügiges Staging optional
**„Confirm email" vorübergehend AUS** (sonst muss jede Test-Mail bestätigt
werden). Für den späteren Echtbetrieb wieder AN.

**Ablauf:**
1. `npx expo start --web` → es erscheint Login/Registrieren (= verbunden).
2. **Testkonto A**: registrieren → Onboarding → **Familie erstellen**.
3. In der App **Einladung** erzeugen (Familie → Einladen → Code kopieren).
4. Zweiter Browser/Inkognito → **Testkonto B**: registrieren → Onboarding →
   **Einladung annehmen** (Code eingeben).
5. **Erwartung:** Beide Konten sehen **dieselbe Familie** und denselben
   Familienbaum.

## 6. Sicherheitsprüfung – Status: ✅

- **Keine Secret Keys im Frontend:** nur `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (Publishable/Anon) wird verwendet; kein `service_role`/`secret` im Code/Repo.
- **RLS bleibt aktiv:** alle 38 Tabellen RLS-geschützt (Helfer
  `is_family_member` / `is_family_admin`).
- **Nur eigene Familie sichtbar:** RLS bindet jeden Zugriff an die
  Familienzugehörigkeit → Konto B sieht keine fremden Familien.

## Offene Risiken / To-dos

| Punkt | Hinweis |
|-------|---------|
| E-Mail-Bestätigung | Im Staging ggf. „Confirm email" aus; vor Echtbetrieb wieder an. |
| Passwort-Reset-Redirect | Nutzt das native Schema `foreverly://reset-password`; im **Web** ist der Reset-Rücksprung eingeschränkt. Für Web-Reset später eine Web-Redirect-URL setzen. |
| Google-Login | Späterer Schritt (Provider-Konfiguration + Redirects). |
| RLS real prüfen | Mit Konto A und B im Staging gegenprüfen (Punkt 5). |
| Live-Cutover | Bewusst **nicht** erfolgt – Live bleibt Demo, bis du freigibst. |

## Fazit

Auth/Login ist **staging-bereit**, ohne die Demo zu gefährden: optionaler
Echt-Modus, kein Login-Zwang auf Live, kein White-Screen-Risiko. Nächster
sinnvoller Schritt nach erfolgreichem A/B-Test: gemeinsam über den Storage-/Push-
Schritt bzw. den späteren Live-Cutover entscheiden.
