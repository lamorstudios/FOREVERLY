# Foreverly 🤍

**Eine generationsübergreifende Familienplattform**, die Erinnerungen,
Familiengeschichte, Fotos, Audios, Zeitkapseln und Familienverbindungen für
kommende Generationen bewahrt.

Foreverly ist emotional, einfach und seniorenfreundlich gestaltet: große
Buttons, große Schrift, sehr einfache Navigation und eine warme, vertrauens-
würdige Optik (Cremeweiß, Beigetöne, sanfte Erdtöne, dezente Gold-Akzente).

> **Status: Phase 1 – MVP.** Bewusst ohne KI-Funktionen, Familienfilme,
> Gesundheits- oder Dokumentenverwaltung. Die Datenstruktur ist jedoch so
> angelegt, dass diese später ergänzt werden können.

---

## 🌐 Web-Vorschau & Demo-Modus

Phase 1 lässt sich **sofort im Browser testen – ohne Supabase-Setup**. Ein
eingebauter **Demo-Modus** lädt die Beispiel-Familie **„Familie Mielke"** mit
Personen, farbcodierten Beziehungen, Erinnerungen, Fotos, Audios und
Zeitkapseln.

Der Demo-Modus ist automatisch aktiv, wenn **keine** Supabase-Zugangsdaten
hinterlegt sind, oder explizit per `EXPO_PUBLIC_DEMO_MODE=true`. Er benötigt
keine Registrierung und führt direkt zur Demo-Familie. (Änderungen sind nur
temporär und werden beim Neuladen zurückgesetzt.)

### Lokal im Browser

```bash
npm install
npm run web          # Dev-Server, öffnet http://localhost:8081
```

Oder als statisches Build (wie beim Deployment):

```bash
npm run build:web    # erzeugt ./dist
npm run preview:web  # statischer Server auf http://localhost:3000
```

### Online (Netlify / Vercel)

Das Repository enthält fertige Konfigurationen (`netlify.toml`, `vercel.json`),
die im Demo-Modus bauen:

- **Netlify:** Neues Projekt aus dem Repo → Build-Command und Publish-Verzeichnis
  werden aus `netlify.toml` übernommen (`npx expo export --platform web` → `dist`).
- **Vercel:** Neues Projekt aus dem Repo importieren → Einstellungen kommen aus
  `vercel.json`. Kein „Framework Preset" nötig.

Beide setzen `EXPO_PUBLIC_DEMO_MODE=true`, sodass die Vorschau ohne Backend läuft.
Sobald du echte `EXPO_PUBLIC_SUPABASE_*`-Variablen setzt, nutzt die App das echte
Backend statt des Demo-Modus.

---

## Funktionen (Phase 1)

- **Authentifizierung** – Registrierung, Login, Passwort vergessen,
  E-Mail-Verifizierung, Profil bearbeiten, Profilbild
- **Familien** – Familie erstellen (Name + Bild), Ersteller wird automatisch
  Administrator
- **Einladungen** – per Einladungscode und teilbarem Link, Rollen
  *Administrator* / *Familienmitglied*
- **Familiennetzwerk** – modernes, interaktives Netzwerk (kein klassischer
  Ahnenbaum) mit farblich codierten Verbindungen:
  - 🟢 Grün – biologische Verwandtschaft
  - 🔵 Blau – angeheiratete Familie
  - 🟡 Gelb – Patchwork / Stieffamilie
  - 🟣 Lila – Adoption / Pflegefamilie
- **Personenprofile** – Profilbild, Basisdaten, Erinnerungen, Fotos, Audios
- **Erinnerungen** – als Text, Foto oder Audio, optional einer Person zugeordnet
- **Fotos** – Upload, Galerie, Zuordnung zu Personen/Erinnerungen
- **Audios** – direkt in der App aufnehmen, speichern und zuordnen
- **Zeitkapseln** – Titel, Beschreibung, Öffnungsdatum, Empfänger; bis zum
  Öffnungsdatum gesperrt, danach automatische Freigabe + Benachrichtigung
- **Startseite** – emotionale Übersicht mit Familienbild, anstehenden
  Zeitkapseln und letzten Aktivitäten

---

## Technologie

| Bereich    | Wahl |
|------------|------|
| Mobile     | **Expo / React Native** + TypeScript (iOS & Android, eine Codebasis) |
| Navigation | React Navigation (Bottom-Tabs + Native Stacks) |
| Daten      | **Supabase** – PostgreSQL, Auth, Storage, Row Level Security |
| State      | TanStack React Query |
| Medien     | expo-image-picker, expo-av (Aufnahme/Wiedergabe), expo-notifications |

---

## Projektstruktur

```
.
├── App.tsx                 App-Einstieg (Provider + Navigation)
├── app.config.ts           Expo-Konfiguration (liest EXPO_PUBLIC_* aus .env)
├── assets/                 Icons & Splash (Platzhalter)
├── supabase/               Datenbankschema, RLS, Storage (siehe supabase/README.md)
└── src/
    ├── api/                Datenzugriff je Domäne + React-Query-Schlüssel
    ├── components/         Wiederverwendbare UI (Button, Screen, Card, …)
    ├── constants/          Beziehungstypen & Kategorien (DE-Labels)
    ├── context/            AuthContext, FamilyContext
    ├── hooks/              useImagePicker, useAudioRecorder, useAudioPlayer
    ├── lib/                supabase, storage, format, notifications, errors, config
    ├── navigation/         Root-, Auth-, Onboarding-, Main-Navigatoren
    ├── providers/          QueryProvider
    ├── screens/            Bildschirme nach Bereich gruppiert
    └── theme/              Farben, Typografie, Abstände
```

---

## Einrichtung

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Supabase-Backend bereitstellen

Siehe [`supabase/README.md`](./supabase/README.md). Kurz:

```bash
supabase start
supabase db reset   # wendet alle Migrationen an
```

### 3. Umgebungsvariablen setzen

`.env.example` nach `.env` kopieren und ausfüllen:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4. App starten

```bash
npm run start      # Expo Dev Server
npm run ios        # iOS-Simulator
npm run android    # Android-Emulator
```

### Nützliche Skripte

```bash
npm run typecheck  # TypeScript prüfen
npm run lint       # ESLint
```

---

## Sicherheit

- **Row Level Security** auf allen Tabellen: Daten sind nur für Mitglieder der
  jeweiligen Familie sicht-/änderbar.
- **Zeitkapseln** bleiben bis zum Öffnungsdatum auf Datenbankebene gesperrt.
- Storage-Buckets sind privat; Zugriff ausschließlich über signierte URLs.

---

## Architektur-Hinweise

- Die App ist **mobile-first** und auf **einfache Bedienung** ausgelegt
  (große Touch-Ziele ≥ 60 px, große Schrift, fünf klare Tabs).
- Das Datenmodell trennt **Personen** (im Netzwerk darstellbar, auch ohne
  Konto) von **Nutzern/Mitgliedern** (mit Login), sodass auch Verstorbene oder
  Verwandte ohne App im Netzwerk erscheinen können.
- Spätere Phasen (Familienhistoriker-KI, Familienbuch, Familienfilme,
  Dokumente, Notfallfunktionen) sind im Schema vorgesehen, aber **nicht**
  implementiert.
