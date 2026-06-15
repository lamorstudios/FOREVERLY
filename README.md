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
