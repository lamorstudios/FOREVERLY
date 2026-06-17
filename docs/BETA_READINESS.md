# FAMII – Beta-Readiness (Übersicht)

Stand der Beta-Vorbereitung. Keine Supabase-/DB-Arbeit in dieser Phase.

## 1. PWA – vollständig vorbereitet ✅

Beim Deploy (`scripts/pwa_postbuild.mjs`) entstehen automatisch:

- **`manifest.json`**: `name`/`short_name` **FAMII**, `display: standalone`,
  `start_url`/`scope` `/FOREVERLY/`, `theme_color`/`background_color` `#FBF6EE`,
  Icons **192 & 512** (`purpose: any` + `any maskable`).
- **App-Icons** aus dem 1024×1024-Quell-Icon (scharf): `icon-192.png`,
  `icon-512.png`, `apple-touch-icon.png`.
- **iOS-Meta**: `apple-mobile-web-app-capable`, `-status-bar-style`,
  `apple-mobile-web-app-title = FAMII`, `apple-touch-icon`.
- **Android**: `theme-color`, `mobile-web-app-capable`, Manifest → „App
  installieren".

**Installierbar:** Android (Chrome „Installieren") ✅, iPhone (Safari → Teilen →
„Zum Home-Bildschirm") ✅ – jeweils mit Icon und Name **FAMII**, Standalone-Start.

**Splash:** Android nutzt Manifest-Icon + Theme/Background; iOS zeigt das
App-Icon. Der native Expo-Splash (`splash.png`) gilt für echte App-Builds.

**Offen (optional):** dediziertes Maskable-Icon mit Sicherheitsrand; Service
Worker für Offline – bewusst nicht Teil der Beta.

## 2. Open Graph / WhatsApp-Vorschau ✅

In `index.html` (+ `404.html`) eingefügt:

- `og:title` = **„Einladung zu FAMII"** · `og:site_name` = **FAMII**
- `og:description` = **„Bewahrt Erinnerungen, Fotos und eure Familiengeschichte gemeinsam."**
- `og:image` / `twitter:image` = **quadratisches FAMII-Logo** (1024×1024, sauberer
  WhatsApp-Thumbnail) · `twitter:card` = `summary_large_image`
- favicon + apple-touch-icon + Manifest-Icon vorhanden.

**Offen (optional):** ein breites 1200×630-Vorschaubild für noch größere
Link-Cards (aktuell quadratisches Logo – funktioniert in WhatsApp/iMessage).

## 3. Push Notifications – Architektur (dokumentiert)

**Was bereits funktioniert**
- **In-App-Benachrichtigungen** (Notification Center): Tabelle/Store
  `notifications`, fachliche Typen + Navigationsziel beim Antippen
  (`src/lib/notificationCenter.ts`). Wird u. a. bei SOS, Status, Einladungen
  erzeugt.
- **Lokale Geräte-Benachrichtigungen** (nur nativ, `src/lib/notifications.ts`,
  `expo-notifications`): Berechtigungsabfrage + geplante Zeitkapsel-Erinnerung.

**Was noch fehlt (für echtes Push aufs Gerät)**
- **Geräte-Push-Token** speichern (Tabelle `push_tokens` – im Plan/Migrationen
  vorgesehen, nicht aktiv).
- **Server-Versand**: Edge Function `send-push` (Expo Push → FCM/APNs), getriggert
  bei neuen `notifications`.
- **Web-Push** (Service Worker) – optional, später.

**Beta-Bewertung:** In-App-Benachrichtigungen reichen für die private Beta;
echtes Push ist ein späterer Schritt (kein Blocker).

## 4. SOS-Funktion – End-to-End (geprüft, Code-/Flow-Audit)

Bildschirm: `src/screens/safety/SosScreen.tsx` (web-tauglich, Modal-Dialog).

| Phase | Verhalten | Status |
|-------|-----------|--------|
| **Auslösen** | großer SOS-Button → In-Screen-Dialog „SOS senden?" → 10-Sek-Countdown (abbrechbar) → Senden | ✅ |
| **Ereignis** | `triggerSos` speichert `safety_alerts` (Auslöser, Zeit, Nachricht, Standortstatus, Status=aktiv) | ✅ (Demo/Store; real via Tabelle) |
| **Empfang** | Eintrag erscheint in „Familien-Sicherheit"/Verlauf; Empfänger (Notfallkontakte + Vertrauenspersonen) werden namentlich gelistet | ✅ |
| **Benachrichtigung** | 2 In-App-Einträge: Sender „🚨 Dein SOS wurde gesendet." + Familie „🚨 SOS von [Name]…" | ✅ |
| **Erfolgsmeldung** | „SOS wurde gesendet" + Uhrzeit + Standortstatus + benachrichtigte Kontakte | ✅ |
| **Entwarnung** | „Entwarnung geben" setzt Alert auf resolved | ✅ |

**Fehlerfälle**
- Keine Kontakte hinterlegt → Hinweis „Familie wurde im Benachrichtigungscenter
  informiert" + Link „Notfallkontakte hinterlegen". ✅
- Abbruch im Countdown → kein Senden. ✅
- Sende-Fehler → zurück in Ausgangszustand (kein Hänger). ✅

**Simuliert (kein Blocker für Beta):** echtes GPS (es wird der letzte bekannte
Standort/„nicht verfügbar" angezeigt), echtes Push (nur In-App).

## 5. Beta-Checkliste (vor Einladung echter Familien)

**Bereit ✅**
- [x] Marke FAMII überall sichtbar; kein FOREVERLY im UI-Text
- [x] Onboarding/Tour, leere Zustände mit CTA
- [x] Einladung: kurzer, persönlicher Share-Text + WhatsApp/E-Mail/Kopieren
- [x] PWA installierbar (Android/iPhone), App-Icon, Name FAMII
- [x] Open-Graph-Vorschau (Logo/Titel/Beschreibung)
- [x] Fehlerschutz: ErrorBoundary, Auth-Watchdog, onerror-Selbstheilung → keine
      White-Screens / Lade-Hänger
- [x] SOS web-tauglich (Dialog/Countdown/Erfolg)
- [x] Web-tote Bestätigungen in Kernflows behoben
- [x] Rechtstexte (Impressum/Datenschutz/AGB), Registrierungs-Einwilligung
- [x] Daten-Persistenz: Demo (localStorage) bzw. Supabase (Echt-Modus)

**Entscheidung nötig vor Launch ⚠️ (kein Code-Bug)**
- [ ] **Modus wählen:** (A) Beta im **Demo-Modus** (sofort, ohne Konten, Daten
      gerätelokal) – ideal für ersten Eindruck; **oder** (B) **Echt-Modus**
      (Supabase) für echte, geräteübergreifende Konten.
- [ ] Falls (B): die 3 Supabase-Punkte setzen (Confirm-email-Setting,
      Fix-Migration `0003`, Schema+Buckets) – das ist Konfiguration, kein Code.

**Optional / nach erstem Feedback**
- [ ] Eigene Domain (`famii.app`) → FOREVERLY aus dem Link entfernen
- [ ] Echtes Push (Tokens + Edge Function)
- [ ] Restliche Web-Confirms in Nebenbereichen migrieren
- [ ] Breites 1200×630-OG-Bild; dediziertes Maskable-Icon

---

## ÜBERSICHT

### BETA READY: **~85 %**
- **Frontend/UX/PWA/OG/SOS/Recht:** **100 %** fertig für eine private Beta.
- Die fehlenden ~15 % sind **keine Code-Arbeit**, sondern eine
  **Betriebsentscheidung** (Demo- vs. Echt-Modus) + ggf. 3 Supabase-Settings.

### Was ist fertig?
PWA-Installierbarkeit, App-Icon/Name, Open-Graph-Vorschau, FAMII-Branding,
Onboarding, leere Zustände, Einladungs-Sharing (WhatsApp/E-Mail/Kopieren),
SOS-Flow (web-tauglich), Fehlerschutz/keine White-Screens, Rechtstexte +
Einwilligung, In-App-Benachrichtigungen, Persistenz (Demo & Supabase).

### Was fehlt noch?
Echtes Push (nur In-App vorhanden), eigene Domain (Link enthält noch
`/FOREVERLY`), breites OG-Bild/Maskable-Icon, restliche Nebenbereichs-Confirms –
alles **nicht launch-blockierend** für 5 Familien.

### Was blockiert den Launch?
**Kein technischer Blocker.** Einzige Voraussetzung: **Entscheidung Demo- vs.
Echt-Modus**.
- **Demo-Modus:** **sofort startklar** – Familien können die App über den Link
  öffnen, installieren und ausprobieren (Daten gerätelokal).
- **Echt-Modus:** zusätzlich die 3 Supabase-Settings setzen (Konfiguration).

**Empfehlung:** Start mit 5 Familien. Für „echte gemeinsame Familienkonten über
mehrere Geräte" Echt-Modus; für einen schnellen, risikoarmen ersten Eindruck
Demo-Modus.
