# FAMII (Foreverly) – Technischer Audit-Report

**Erstellt:** 2026-06-19
**Rolle:** Lead Software Architect / Senior Fullstack Engineer / Product Owner
**Scope:** Vollständige Analyse der bestehenden Codebasis (kein Code geändert)
**Ziel:** Produktionsreife & Veröffentlichung im Apple App Store und Google Play

> **Gesamturteil:** Die App ist **architektonisch stark und außergewöhnlich funktionsreich** (≈38.400 LOC, 117 Screens, 39 API-Module, ~30 DB-Tabellen über 14 Migrationen), aber **noch nicht veröffentlichungsreif**. Es gibt **einen echten Datenschutz-Blocker** (Sichtbarkeitsstufen serverseitig nicht erzwungen), kein Crash-Reporting, keine Tests, nur Platzhalter-Rechtstexte und keine native Build-/Submit-Pipeline. **Realistische Einschätzung: ~65–70 % produktionsreif; 6–10 Wochen fokussierte Arbeit bis zum Store-Launch.**

---

## 1. Projektanalyse

### 1.1 Technologie-Stack
| Bereich | Technologie | Version | Bewertung |
|---|---|---|---|
| Framework | Expo (managed) | ~52.0 | aktuell |
| Runtime | React Native | 0.76.3 (New Architecture aktiv) | aktuell, aber Testaufwand durch Fabric/TurboModules |
| Sprache | TypeScript (strict, `noUncheckedIndexedAccess`) | 5.6 | sehr gut |
| Navigation | React Navigation v6 (Tabs + Native Stacks) | 6.x | solide |
| Server-State | TanStack React Query | 5.59 | sehr gut |
| Backend | Supabase (Postgres, Auth, Storage, RLS, Edge Functions) | js 2.45 | gut |
| Audio | **expo-av** | 15.0 | ⚠️ in SDK 52 **deprecated** → Migration zu `expo-audio`/`expo-video` nötig |
| UI | StyleSheet + Animated + expo-linear-gradient + react-native-svg | – | gut |

### 1.2 Architektur (Überblick)
- **Schichtenmodell:** `screens` (UI) → `api/*` (Service-Layer) → `lib/supabase` **oder** `demo/store` (In-Memory). Jede API-Funktion verzweigt über `DEMO_MODE`.
- **Dual-Mode:** `DEMO_MODE` (kein Backend, In-Memory-Store mit ~1.260 Zeilen Seed-Daten „Familie Mielke") vs. echter Supabase-Betrieb. **Default ist Demo**, sobald Supabase-Env fehlt.
- **Provider-Hierarchie** (`App.tsx`): SafeArea → ErrorBoundary → QueryProvider → Auth → Family → Premium → Onboarding → Tour → Success → RootNavigator.

### 1.3 Routing-Struktur
- **RootNavigator** schaltet zwischen **AuthNavigator** (keine Session), **OnboardingNavigator** (Session, keine Familie) und **MainNavigator** (5 Bottom-Tabs).
- **5 Tabs / Stacks:** Home (67 Screens!), Familie (9), Erinnerungen (7), Zeitkapseln (3), Profil (21). Insgesamt **107 registrierte Screens** – alle typisiert in `navigation/types.ts`, **keine toten Screens**.
- **Deep Linking:** `foreverly://` + `https://foreverly.app`, eine Route `invite/:code` (Einladungen, mit Pending-Invite-Persistenz).
- ⚠️ **Der Home-Stack ist mit 67 Screens überladen** – Wartbarkeits-/Bundle-Risiko (siehe §8).

### 1.4 Komponenten- & Wiederverwendbarkeit
- **23 Design-System-Komponenten** (`components/index.ts`): `AppText`, `Button`, `Card`, `Screen`, `TextField`, `SelectField`, `DateField`, `Chip`, `IconChip`, `Avatar`, `EmptyState`, `Loading`, `SectionHeader`, `Appear`, `BetaBanner`, `Disclaimer`, `SuccessOverlay`, `TourOverlay`, `ErrorBoundary`, `Google/AppleSignInButton`, `InviteFamilyButton`, `AudioRecorder`, `SignedImage`.
- **Keine Duplikate** festgestellt; klare Rollen. Die zentrale `AudioRecorder`-Komponente wird bereits von allen Audio-Flows genutzt (gut).

### 1.5 State Management
- **Kein Redux/Zustand** – reine **Context API (5 Provider)** + React Query (staleTime 30 s, retry 1).
- **AsyncStorage** für: aktive Familie, Onboarding-Flags, Premium-Plan, Consents, Notification-Prefs, Pending-Invite, Supabase-Session.

### 1.6 Datenmodell
- Umfangreich und durchdacht: `profiles`, `families`, `family_members` (Rollen admin/member), `persons`, `relationships` (typisiert + Kategorie/Farbe: biologisch/verheiratet/patchwork/adoption), `memories`, `photos`, `audios` (inkl. `transcript`), `time_capsules` (+ recipients), sowie Phasen 2–8: Status, Notifications, Emergency, Calendar, Documents, Estate/Trustees, Vault, Branches, Closeness, Suggestions, Events, Moments, Safety, LifeStories, Artifacts, Film/Book-Projekte.
- **14 Migrationen**; alle TS-Modelle sind durch Tabellen gedeckt. RLS auf allen Tabellen aktiviert.

### 1.7 API-Struktur
- **39 Module** mit einheitlichem Muster `if (DEMO_MODE) return demoStore.x(); … supabase …`. Aktivitäts-Logging als Seiteneffekt. Storage über signierte URLs.

### 1.8 Lokale Speicherung / Backend / Offline
- Lokale Persistenz nur via AsyncStorage (Prefs/Session). **Keine Offline-Datenhaltung/Sync-Queue** – App ist online-first (Demo umgeht das nur im Speicher).

### 1.9 Technische Schulden (Kurzliste)
1. 🔴 **Sichtbarkeitsstufen nicht in RLS** (Datenschutz – Detail in §3).
2. 🟠 **„KI"-Engines sind deterministisch/lokal**, kein echtes LLM (Erwartungsmanagement/Marketing).
3. 🟠 **Dokumente/Nachlass speichern nur Metadaten**, keine echten Dateien/Verschlüsselung.
4. 🟠 **expo-av deprecated**.
5. 🟠 **Home-Stack mit 67 Screens**.
6. 🟡 **Keine Tests, kein Crash-Reporting, keine native CI**.
7. 🟡 **Push nur lokal** (keine Server-Push/Token-Tabelle).
8. 🟡 **Kein Dark Mode** (Tokens vorhanden, aber Single-Theme).

---

## 2. Produktionsreife-Check

### Authentifizierung
| Feature | Status | Anmerkung |
|---|---|---|
| Registrierung | ✅ | E-Mail/Passwort + Consent-Erfassung; Google/Apple OAuth |
| Login | ✅ | Supabase + OAuth, 3 s Safety-Timeout |
| Passwort vergessen | ✅ | `resetPasswordForEmail` (Demo: No-op) |
| Session Handling | ✅ | `onAuthStateChange`, AsyncStorage-Persistenz |
| E-Mail-Verifizierung | ✅ | Verify-Screen + Resend (von Supabase-Setting abhängig) |
| 2FA/MFA | ❌ | nicht vorhanden (für MVP vertretbar) |
| Passwort-Policy | 🟡 | nur 6 Zeichen Minimum → auf 8+ erhöhen |

### Familiennetzwerk
| Feature | Status | Anmerkung |
|---|---|---|
| Familienbaum | ✅ | aufwändige radiale Visualisierung, Zoom/Pan |
| Beziehungen | ✅ | reichhaltige Typen, richtungsabhängig |
| Patchwork | ✅ | Stief-/Adoptiv-/Pflege-Typen + Branches |
| Rollen & Rechte | 🟡 | nur admin/member; **keine serverseitige Sichtbarkeits-Durchsetzung** (§3) |
| Einladungen | ✅ | 8-stellige Codes, 30 Tage gültig, Deep-Link |

### Erinnerungen
| Feature | Status | Anmerkung |
|---|---|---|
| Erstellen/Bearbeiten/Löschen | ✅ | vollständig |
| Fotos | ✅ | Upload + signierte URLs + Maße |
| Videos | 🟡 | nur über „Momente", keine eigene Tabelle/Optimierung |
| Audio | ✅ | Aufnahme/Wiedergabe/Transkriptfeld |
| Transkription | 🟡 | Live (Browser Web Speech, nur Chrome/Edge) + optionaler Backend-Endpoint, **der noch nicht deployed ist** |

### Familienstimmen
| Feature | Status |
|---|---|
| Audioaufnahme | ✅ |
| Wiedergabe | ✅ |
| Transkription | 🟡 (siehe oben) |
| KI-Aufbereitung | ❌ (keine Cleanup/Noise-Reduction) |

### Zeitkapseln
| Feature | Status | Anmerkung |
|---|---|---|
| Erstellung | ✅ | Text/Foto/Audio, Empfänger |
| Öffnungslogik | ✅ | `open_at`, RLS verbirgt ungeöffnete Kapseln korrekt |
| Berechtigungen | ✅ | Empfänger-Tabelle + RLS (`is_opened` + recipient) |

### Dokumente & Nachlass
| Feature | Status | Anmerkung |
|---|---|---|
| Dokumentenverwaltung | 🟡 | **nur Metadaten** (Ort, Ansprechpartner) – **keine Datei-Ablage/Verschlüsselung** |
| Vertrauenspersonen | ✅ | Trustees/Trusted Contacts, Rollen |
| Nachlassfreigaben | ✅ | Multi-Sig-Todesfall-Freigabe (Logik vorhanden; benötigt serverseitige Absicherung) |

### Weitere Bereiche
| Bereich | Status | Anmerkung |
|---|---|---|
| Familienfilm | 🟡 | Storyboard/Metadaten **deterministisch generiert; kein echtes Video-Rendering** |
| Familienchronik | 🟡 | Buch-/Chronik-Generator deterministisch (kein PDF-Export) |
| Chat & Kommunikation | ❌ | nur Kommentare an Momenten; **kein Messaging** |
| Push-Benachrichtigungen | 🟡 | **nur lokale** Notifications; keine Server-Push/Token-Speicherung |
| Suche | ✅ | globale Suche über viele Entitäten (sichtbarkeitsbewusst clientseitig) |
| Offlinefähigkeit | ❌ | keine Sync-Engine |
| Analytics | 🟡 | nur Admin-Aggregat-Dashboard; **kein Client-Event-Tracking/SDK** |
| DSGVO & Datenschutz | 🟡 | Consent-Toggles, Export-UI, Lösch-Anfrage **scaffolded**; Rechtstexte = Platzhalter |
| Sicherheit | 🟡 | RLS gut, aber **Sichtbarkeits-Lücke** + Nachlass nur Metadaten |
| Fehlerbehandlung | 🟡 | ErrorBoundary + `friendlyError`, aber **kein Crash-Reporting** |
| Tests | ❌ | **keine** Unit/Integration/E2E |
| „KI" (Historian/Assistant/Museum) | 🟡 | funktioniert, aber **rein regelbasiert/lokal**, kein LLM |

---

## 3. Kritische Probleme

### P0 – Blocker für Release (zwingend)
1. 🔴 **Sichtbarkeitsstufen werden serverseitig NICHT erzwungen.**
   `memories` und `moments` haben nur `using (is_family_member(family_id))` (s. `supabase/migrations/20260615000003_rls_policies.sql:202` und `20260615000011_phase6.sql:138`). Die Felder `visibility` (inner/sehr_nah/selected/private/branch) werden **nur clientseitig** gefiltert → **jedes Familienmitglied kann „private" Inhalte über die API lesen.** Datenschutz-/Vertrauensbruch für eine Familien-App.
   **Fix:** RLS-Policies um Sichtbarkeits-/Branch-/Empfänger-Logik erweitern (+ Tests).
2. 🔴 **Finale, anwaltlich geprüfte Rechtstexte fehlen** (Impressum, Datenschutz, AGB) – aktuell Platzhalter („Stand: Beta"). **Öffentliche Privacy-Policy-URL fehlt** (Store-Pflicht).
3. 🔴 **Kein Crash-/Fehler-Monitoring** (kein Sentry/Crashlytics). Produktion ohne Crash-Sichtbarkeit ist nicht vertretbar.
4. 🔴 **DSGVO-Löschung (Art. 17) nicht serverseitig umgesetzt** (nur UI-Hinweis „in Produktion bestätigt"). Recht auf Löschung muss real funktionieren.
5. 🔴 **`DEMO_MODE`-Fallback-Risiko:** Fehlt in der Produktion die Supabase-Env, startet die App still im In-Memory-Demo-Modus (Datenverlust-Illusion). **Build-Guard nötig**, der in Prod bei fehlender Config hart fehlschlägt.

### P1 – Kritisch vor Launch (soll)
1. 🟠 **Dokumente/Nachlass ohne echte Datei-Ablage/Verschlüsselung** – für eine Vorsorge-App ein Kernversprechen. Entweder Feature klar als „nur Hinweise/Fundorte" kommunizieren **oder** verschlüsselten Upload implementieren.
2. 🟠 **Push-Backend fehlt** (keine `push_tokens`-Tabelle, kein Server-Send). Zeitkapsel-/Notfall-/Status-Pushes funktionieren nur lokal/zeitgesteuert auf dem Gerät.
3. 🟠 **Keine native CI/CD**; `eas.json` → `submit` ist leer (keine Apple-/Play-Credentials). Kein automatisierter iOS/Android-Build.
4. 🟠 **Keine Tests** für kritische Pfade (Auth, Invite-Redeem, RLS, Nachlass-Freigabe, Tree-Layout).
5. 🟠 **expo-av deprecated** – mittelfristig Bruchrisiko; Migration planen.
6. 🟠 **„KI"-Erwartung:** Falls im Store/Marketing „KI" beworben wird, aber lokal-deterministisch läuft → Klarstellung oder echtes LLM (Edge Function `family-historian` existiert als Referenz, ist aber **ungenutzt**).
7. 🟠 **Produktions-Icons/Splash/Store-Assets** (Screenshots, Feature-Graphic) fehlen.

### P2 – Nach Launch verbesserbar
1. 🟡 Offline-Fähigkeit / Sync-Queue.
2. 🟡 Echte Video-Pipeline + Film-Rendering / PDF-Buchexport.
3. 🟡 Chat/Messaging.
4. 🟡 Dark Mode.
5. 🟡 Client-Analytics (datensparsam) & Performance-Monitoring.
6. 🟡 Home-Stack aufteilen; Lazy-Loading großer Bereiche.
7. 🟡 Consent-Logging serverseitig (Audit-Trail).

---

## 4. UX/UI-Audit
- **Designkonsistenz:** ✅ Sehr gut – zentrales Token-System (Blau→Periwinkle→Apricot), einheitliche `IconChip`, Cards, Gradient-Buttons, keine schwarzen Fokus-Borders.
- **Responsivität:** ✅ `useResponsive` (Breakpoints 390/768), `contentMaxWidth` 720 px für Tablets.
- **Mobile UX:** ✅ Große Touch-Targets (min. 60 px), senioren­freundliche Typo, eigener **SeniorMode**.
- **Animationen:** ✅ Press/Hover-Scale, Appear-Fade, Success-Toast/Konfetti, Wellenform beim Recording.
- **Accessibility:** 🟡 ~36 `accessibilityLabel/Role`-Stellen, gut bei interaktiven Elementen; **fehlend:** systematische Screenreader-Tests (VoiceOver/TalkBack), `accessibilityHint`, Live-Regions, Kontrast-Audit, Dynamic-Type-Test.
- **Performance:** 🟡 React-Query-Caching ok; **Risiken:** 3,7 MB JS-Bundle (Web), 67-Screen-Stack, kaum `memo`/Virtualisierung sichtbar bei langen Listen.
- **Dark Mode:** ❌ nicht vorbereitet (nur Light).
- **Wiederverwendbarkeit:** ✅ stark; Designsystem konsequent genutzt.

---

## 5. App-Store-Readiness

**Kann FAMII aktuell veröffentlicht werden? → Nein.**

**Zwingend technisch:**
- RLS-Sichtbarkeit fixen (P0-1); DSGVO-Löschung serverseitig (P0-4); Crash-Reporting (P0-3); Prod-Config-Guard (P0-5).
- `eas.json` → `submit` mit Apple ID/Team & Google Play Service Account; native Build-Workflow.
- Produktions-Assets (Icon 1024², Splash, **Screenshots** iPhone/iPad bzw. Phone/Tablet, **Feature-Graphic 1024×500** für Play).
- Apple **Privacy Nutritional Labels** & Play **Data-Safety-Formular** ausfüllen (Mikrofon/Kamera/Fotos/Standort deklarieren).
- Push-Backend, falls Push beworben wird.

**Zwingend rechtlich:**
- Finale Datenschutzerklärung, AGB, **vollständiges Impressum** (echte Firmierung/Adresse – Pflicht in DE/EU).
- **Öffentlich erreichbare Privacy-Policy-URL** (in-App-Text genügt Stores nicht).
- Auftragsverarbeitung/SCCs dokumentieren, falls Drittdienste (z. B. Whisper-Transkription) genutzt werden.
- Altersgrenze/Content-Rating (IARC) + Einwilligungs-Gate beim Onboarding.

**Was fehlt (Kurz):** Tests, Monitoring, native CI, echte Datei-Verschlüsselung (Nachlass), Server-Push, finale Assets & Recht.

---

## 6. Roadmap bis zum Launch

**Phase 1 – Geschlossene Alpha (≈2–3 Wochen)**
- P0-1 RLS-Sichtbarkeit + Tests; P0-5 Prod-Guard; P0-3 Sentry/Crashlytics.
- Echten Supabase-Prod-Betrieb verifizieren (kein Demo-Fallback); Auth-/Invite-/Tree-Smoke-Tests.
- Interner Test über EAS „preview" (APK/TestFlight intern).

**Phase 2 – Beta-Test (≈3–4 Wochen)**
- P0-2/P0-4 Recht & DSGVO-Löschung; native CI + `eas submit`-Config.
- P1: Push-Backend (Token-Tabelle + Versand-Edge-Function), Dokumenten-Verschlüsselung (oder klare Reduktion auf „Fundorte"), Store-Assets.
- TestFlight / Google Play Closed Testing mit echten Familien; Crash-/Feedback-Loop.

**Phase 3 – Öffentliche Veröffentlichung (≈2–3 Wochen)**
- Privacy-Labels/Data-Safety, finale Rechtstexte live, Performance-Pass (Bundle/Lists), expo-av→expo-audio.
- Soft-Launch (eine Region), Monitoring beobachten, dann GA.

**Phase 4 – Premium & Skalierung (laufend)**
- Echtes LLM (RAG via `family-historian`), Offline-Sync, Video-/PDF-Pipeline, Chat, Dark Mode, Premium-Gating/Abrechnung (RevenueCat), Analytics datensparsam.

---

## 7. Prioritätenliste

| Aufgabe | Priorität | Aufwand | Kritikalität |
|---|---|---|---|
| RLS: Sichtbarkeits-/Empfänger-Durchsetzung (memories, moments, capsules) | P0 | M | 🔴 sehr hoch |
| Prod-Config-Guard (kein stiller Demo-Fallback) | P0 | S | 🔴 hoch |
| Crash-/Fehler-Monitoring (Sentry) | P0 | S | 🔴 hoch |
| DSGVO-Löschung serverseitig (Art. 17) + Export verifizieren | P0 | M | 🔴 hoch |
| Finale Rechtstexte + öffentliche Privacy-URL + Impressum | P0 | M (extern) | 🔴 hoch |
| `eas.json submit` + native Build-CI (iOS/Android) | P1 | M | 🟠 hoch |
| Push-Backend (Token-Tabelle + Versand) | P1 | M | 🟠 mittel-hoch |
| Tests (Auth, Invite, RLS, Nachlass, Tree) + CI-Step | P1 | M–L | 🟠 mittel-hoch |
| Store-Assets (Icon/Splash/Screenshots/Feature-Graphic) | P1 | M | 🟠 mittel |
| Dokumente: echte verschlüsselte Ablage **oder** Scope-Klärung | P1 | M–L | 🟠 mittel |
| Passwort-Policy 8+, „KI"-Kommunikation klären | P1 | S | 🟠 mittel |
| expo-av → expo-audio/expo-video | P2 | M | 🟡 mittel |
| Home-Stack aufteilen / Lazy-Loading / Bundle-Diät | P2 | M | 🟡 mittel |
| Offline-Sync | P2 | L | 🟡 niedrig-mittel |
| Dark Mode / Chat / Video- & PDF-Pipeline | P2 | L | 🟡 niedrig |

*(Aufwand: S<1 Tag, M 2–5 Tage, L >1 Woche)*

---

## 8. Architektur-Empfehlungen
- **Skalierbarkeit:** Home-Stack (67 Screens) in Feature-Stacks/Lazy-Routen aufteilen; React-Query-Persistence (z. B. `@tanstack/query-async-storage-persister`) für schnelleres Kaltstart-UX.
- **Sicherheit:** **Defense-in-depth** – Sichtbarkeit/Empfänger/Branch in RLS abbilden (Single Source of Truth = DB, nicht Client). Sensible Tokens via `expo-secure-store` statt AsyncStorage. Service-Role-Operationen ausschließlich in Edge Functions.
- **Wartbarkeit:** Tests + CI-Gate (typecheck + lint + test + build); ADRs für „lokale KI"-Entscheidung; `submit`/Build als Code.
- **Performance:** `FlatList`/Virtualisierung für lange Listen, `React.memo`/`useMemo` an Hotspots, Bundle-Analyse, Tree-Shaking der KI-Engines.
- **Datenmodell:** `push_tokens`-Tabelle; optionale `documents`-Storage-Bucket-Variante mit clientseitiger Verschlüsselung; Consent-Audit-Tabelle; Index-Review für Suchpfade.
- **Komponentenstruktur:** Feature-Ordner-Konvention beibehalten; ggf. `screens/<feature>` ↔ `api/<feature>` ↔ `engines/<feature>` spiegeln.

## 9. Refactoring-Empfehlungen
- **Doppelte Komponenten:** keine gefunden (gut). Audio-Logik bereits zentralisiert.
- **Veralteter Code:** `expo-av`; deprecated Farbtokens (`gold`/`bronze`) konsolidieren; ungenutzte Edge Function `family-historian` entweder aktivieren oder als „reference"-Ordner kennzeichnen.
- **Unnötige/Doppel-Deploys:** `vercel.json` + `netlify.toml` + GitHub Pages parallel – auf eine primäre Web-Strategie reduzieren.
- **Nicht genutzte Funktionen:** Transkriptions-Backend-Pfad ohne deployten Endpoint (klar als Beta kennzeichnen, bereits umgesetzt).
- **Performance-Bottlenecks:** großes JS-Bundle, 67-Screen-Stack, lange Listen ohne Virtualisierung, viele synchrone Context-Consumer.

---

### Quellenhinweise (Stichprobe)
- RLS-Sichtbarkeit: `supabase/migrations/20260615000003_rls_policies.sql:202-208`, `20260615000011_phase6.sql:138`
- Demo-Fallback: `src/lib/config.ts:32-33`
- Lokale „KI": `src/historian/engine.ts`, `src/assistant/engine.ts`, `src/museum/engine.ts`, `src/film/generator.ts`, `src/book/generator.ts`
- Ungenutzte LLM-Edge-Function: `supabase/functions/family-historian/index.ts`
- Dokumente nur Metadaten: `src/api/documents.ts`, `src/screens/phase2/DocumentFormScreen.tsx`
- EAS/Recht/Monitoring: `eas.json`, `src/lib/legalContent.ts`, `src/components/ErrorBoundary.tsx`
