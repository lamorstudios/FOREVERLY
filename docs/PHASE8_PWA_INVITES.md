# Beta Polish – Einladungen & PWA

Beta-Polishing, keine neuen Features, keine Push-Benachrichtigungen.

## 1. FOREVERLY aus der Nutzeransicht

- Sichtbare Texte sind durchgehend **FAMII** (Rebrand abgeschlossen).
- **Einladungs-Nachricht** (WhatsApp/E-Mail) ist FAMII-formuliert: „Du bist
  eingeladen, Teil unserer Familie auf FAMII zu werden." – keine
  Entwickler-Bezeichnungen.
- **Verbleibend (technisch, nicht änderbar ohne eigene Domain):** der
  Einladungs-/App-Link enthält den Hosting-Pfad `…github.io/FOREVERLY/…`. Das
  ist die GitHub-Pages-Adresse, kein im UI sichtbares „Label". Vollständig
  verstecken ginge nur mit einer **eigenen Domain** (z. B. `famii.app`) – als
  späterer Schritt vorgemerkt.

## 2. WhatsApp-/Social-Vorschau (Open Graph) ✅

Beim Deploy werden jetzt Open-Graph-/Twitter-Meta-Tags in `index.html` (und
`404.html`) eingefügt:

- **Bild:** FAMII-Vorschaubild (`og-image.png`, aus dem App-Splash).
- **Titel:** „Einladung zu deiner Familiengeschichte".
- **Beschreibung:** „Du wurdest zu FAMII eingeladen, gemeinsam Erinnerungen und
  Familiengeschichte zu bewahren."

→ Beim Teilen des Links in WhatsApp/iMessage/E-Mail erscheint eine
Vorschaukarte mit Logo, Titel und Beschreibung.

## 3. PWA – installierbar ✅ (vorbereitet)

Neu beim Deploy (`scripts/pwa_postbuild.mjs`):

- **`manifest.json`** mit App-Name **FAMII**, `display: standalone`,
  `start_url` `/FOREVERLY/`, Hintergrund/Theme `#FBF6EE`, Icons (192/512).
- **App-Icons** (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).
- **iOS-Meta** (`apple-mobile-web-app-capable`, `-title FAMII`,
  Statusleisten-Stil) → „Zum Home-Bildschirm" startet ohne Browser-Leiste.
- **theme-color** für Android-Statusleiste.

### Installierbarkeit
- **Android (Chrome):** „App installieren"/„Zum Startbildschirm hinzufügen" →
  echtes App-Icon, eigener Splash, Standalone-Fenster. ✅
- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm" → FAMII-Icon, Vollbild
  (ohne Safari-Leiste). ✅
- **Splash:** Android nutzt Manifest-Icon + theme/background; iOS zeigt das
  App-Icon. Der native Expo-Splash (`splash.png`) gilt für die echten
  App-Builds, nicht für die PWA.

## Was bereits funktioniert
- FAMII-Branding überall sichtbar; FAMII-formulierte Einladungen.
- Teilen per **WhatsApp / E-Mail / Link kopieren** (Phase 8).
- Rich-Vorschau (Open Graph) beim Linkteilen.
- Installierbar als PWA (Android/iOS) mit App-Icon & eigenem Namen.

## Was noch fehlt
- **Eigene Domain** (z. B. `famii.app`), um den `/FOREVERLY`-Pfad aus dem Link
  zu nehmen und einen klickbaren Web-Invite-Deeplink zu ermöglichen.
- **Hochauflösendes 512-px-Icon/Maskable-Icon**: aktuell wird das vorhandene
  App-Icon verwendet; für gestochen scharfe Installation ein dediziertes
  512×512-PNG (und ein breites OG-Bild 1200×630) hinterlegen.
- Optionaler PWA-**Offline-Modus** (Service Worker) – bewusst nicht Teil dieser
  Phase.

## Ist die App bereits installierbar?
**Ja** – nach dem nächsten Deploy ist FAMII als PWA auf Android und iPhone
installierbar (Home-Bildschirm), mit App-Icon und Namen „FAMII". Die
Link-Vorschau zeigt Titel/Beschreibung/Bild.

## Schritte bis zur ersten Testfamilie
1. Deploy läuft (Manifest + Meta automatisch über `pwa_postbuild.mjs`).
2. Supabase-Vorbedingungen (aus Phase 7/8): „Confirm email"-Setting,
   Fix-Migration `0003`, Schema + Storage-Buckets.
3. Einladung erstellen → per WhatsApp/Link teilen → Familie testet.
4. (Optional, empfohlen) eigene Domain + dediziertes 512-px-Icon/OG-Bild.

## Verifiziert
- `manifest.json` valides JSON, per HTTP erreichbar (200).
- Meta-Tags in `index.html` eingefügt (idempotent); Render 0 Console-Errors.
- `tsc` fehlerfrei; Demo/Live unberührt; keine Push-Benachrichtigungen.
