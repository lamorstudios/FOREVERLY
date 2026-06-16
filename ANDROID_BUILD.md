# Foreverly · Android Beta (EAS Build / APK)

So baust du Foreverly als echte Android-App und installierst sie auf deinem
Handy. Web-/Supabase-Setup siehe `DEPLOYMENT.md` und `supabase/SUPABASE_SETUP.md`.

---

## Voraussetzungen (einmalig)

1. **Expo-Konto** anlegen: https://expo.dev (kostenlos).
2. **EAS CLI** verfügbar (kein globales Install nötig): `npx eas-cli@latest --version`.
3. Anmelden: `npx eas-cli login`.
4. **EAS-Projekt verknüpfen** (legt die Project-ID an):
   ```bash
   npx eas-cli init
   ```
   Die ausgegebene **Project-ID** danach als Umgebungsvariable setzen, damit
   Push-Tokens funktionieren (dynamische Config liest `EAS_PROJECT_ID`):
   ```bash
   export EAS_PROJECT_ID=<deine-project-id>
   ```
   (In EAS-Builds: `eas env:create` oder im Projekt-Dashboard hinterlegen.)

---

## App-Konfiguration (bereits erledigt)

- **Name:** Foreverly · **Package:** `app.foreverly.mobile`
- **Icon/Splash:** `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png`
- **Permissions:** Kamera, Mikrofon, Standort (fine/coarse), Medien
  (Bilder/Video/Audio), Benachrichtigungen (`POST_NOTIFICATIONS`)
- **Deep Links:** `foreverly://…` und `https://foreverly.app/invite/…`
- **Build-Profile:** `eas.json` → `development`, `preview` (APK), `production` (AAB)

---

## APK bauen (für erste Tests)

```bash
# Echte Daten in den Build (sonst Demo-Modus):
export EXPO_PUBLIC_DEMO_MODE=false
export EXPO_PUBLIC_SUPABASE_URL=https://<DEIN-REF>.supabase.co
export EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>

# Preview-APK in der EAS-Cloud bauen:
npx eas-cli build --platform android --profile preview
```

- Der Build läuft in der Cloud (kein Android Studio nötig).
- Am Ende erscheint ein **Link** + QR-Code in der Konsole und unter
  https://expo.dev → dein Projekt → **Builds**.
- Dort liegt die **APK** zum Download.

> **Demo-APK** ohne Backend: einfach ohne die `EXPO_PUBLIC_SUPABASE_*`-Variablen
> bauen – die App startet dann im Demo-Modus.
>
> **Play-Store-AAB** später: `npx eas-cli build --platform android --profile production`.

---

## Auf dem Handy installieren

1. Den **Build-Link** (oder QR-Code) am Handy öffnen → **Download APK**.
2. Erste Installation einer APK: Android fragt nach „Unbekannte Apps
   installieren" → für den Browser/Dateimanager **erlauben**.
3. APK öffnen → **Installieren** → **Öffnen**.
4. Beim ersten Start die Berechtigungen (Kamera/Mikro/Standort/Mitteilungen)
   nach Bedarf zulassen.

Alternativ: APK per Kabel `adb install foreverly.apk` aufspielen.

---

## Google-Login & Deep Links auf Android

**Supabase → Authentication → URL Configuration → Redirect URLs** ergänzen:

```
foreverly://
```
(zusätzlich zu den Web-URLs aus `DEPLOYMENT.md`).

**Google Cloud Console:** Für OAuth über Supabase genügt die bestehende
Web-Redirect-URI `https://<DEIN-REF>.supabase.co/auth/v1/callback` – Supabase
leitet danach an `foreverly://` zurück.

**Einladungslinks:** `foreverly://invite/CODE` öffnet die App direkt.
`https://foreverly.app/invite/CODE` öffnet sie per Auswahl (volle
App-Verifizierung via `assetlinks.json` ist optional und später möglich).

---

## Push-Benachrichtigungen (Grundlage)

- `expo-notifications` ist eingerichtet; lokale Hinweise (z. B. Zeitkapseln)
  funktionieren bereits.
- `registerPushToken()` in `src/lib/notifications.ts` liefert den
  **Expo-Push-Token** des Geräts (sobald `EAS_PROJECT_ID` gesetzt ist) – die
  Grundlage für serverseitige Pushes. Der eigentliche Versand folgt später.

---

## Schnell-Checkliste

```bash
npx eas-cli login
npx eas-cli init                      # Project-ID -> EAS_PROJECT_ID setzen
npx eas-cli build -p android --profile preview
# -> Build-Link öffnen, APK aufs Handy laden, installieren, testen
```

Testablauf in der App: Google-Login → Familie erstellen → einladen →
Einladungslink auf zweitem Gerät öffnen → beitreten → Familienbaum prüfen
(siehe `DEPLOYMENT.md`, Abschnitt 4).
