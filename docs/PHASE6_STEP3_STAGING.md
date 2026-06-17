# Phase 6 · Schritt 3 – Supabase Staging-Test (Anleitung)

> **Live-App bleibt unverändert im Demo-Modus.** Dieser Schritt aktiviert
> Supabase **nur lokal/Staging**. Es wurde **kein** Auth-Gate für Live aktiviert,
> **keine** localStorage-Logik entfernt, **keine** UI geändert.
>
> Hinweis: Migrationen gegen dein Supabase-Projekt kann ich aus dieser Umgebung
> **nicht ausführen** (keine Projekt-Zugangsdaten/Netz). Unten stehen die exakten
> Befehle, die **du** ausführst. Code-seitig wurde nur ein Sicherheitsnetz gegen
> hängende Ladebildschirme im Echt-Modus ergänzt (betrifft Demo/Live nicht).

---

## 1. Benötigte ENV-Variablen (exakte Namen)

Dieses Projekt ist **Expo**, nicht Vite. Es gelten daher die `EXPO_PUBLIC_*`-Namen
(nicht `VITE_*`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<dein-projekt>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<dein anon / publishable key>
```

Optional (nur falls du den Modus explizit steuern willst):
```
EXPO_PUBLIC_DEMO_MODE=false   # erzwingt Echt-Modus lokal (sonst automatisch, sobald Keys gesetzt sind)
```

**Wichtig:** Nur den **anon/publishable** Key verwenden – **niemals** den
`service_role` Key in der App/Frontend.

### Wo eintragen?

- **Lokal (Staging-Test):** Datei `.env` im Projekt-Root anlegen (Vorlage:
  `.env.example`). `.env` ist in `.gitignore` → wird **nicht** committet.
- **Live (GitHub Pages):** **JETZT NOCH NICHT.** Der Workflow
  `.github/workflows/deploy-web.yml` setzt weiterhin `EXPO_PUBLIC_DEMO_MODE:'true'`.
  Erst beim späteren Cutover (Plan-Schritt 7) kämen die Werte als
  **GitHub Actions Secrets** hinzu.

So sieht deine lokale `.env` aus:
```
EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # anon key
```

---

## 2. Supabase-Client / Modus-Logik (bereits sicher)

Kein Code-Umbau nötig – die Logik ist bereits „fail-safe":

- `src/lib/config.ts`: `DEMO_MODE = (EXPO_PUBLIC_DEMO_MODE === 'true') || !isSupabaseConfigured`.
  → **Ohne** Keys läuft die App **immer** im Demo-Modus (kein Crash, keine weiße
  Seite).
- `src/lib/supabase.ts`: Client wird mit Platzhalterwerten konstruiert, aber im
  Demo-Modus **nie aufgerufen**.
- **Neu (Sicherheitsnetz):** `AuthContext` bricht die Sitzungsabfrage im
  Echt-Modus nach **4 Sekunden** ab und fährt ohne Sitzung fort (kein
  Lade-Freeze, keine weiße Seite). Betrifft ausschließlich den Echt-Pfad; Demo
  bleibt unverändert.

---

## 3. Migrationen auf die leere Staging-DB anwenden

Voraussetzung: Supabase CLI installiert (`npm i -g supabase` oder via brew),
Projekt ist „Healthy".

```bash
# Im Projekt-Root:
supabase login                       # einmalig, Browser-Token
supabase link --project-ref <PROJECT_REF>   # Ref aus der Supabase-URL
supabase db push                     # wendet ALLE Dateien aus supabase/migrations/ an
```

`supabase db push` führt diese Migrationen der Reihe nach aus (leere DB):

| Datei | Inhalt |
|-------|--------|
| `…0001_initial_schema.sql` | Kerntabellen: profiles, families, family_members, invitations, persons, relationships, memories, photos, audios, time_capsules, time_capsule_recipients, activities |
| `…0002_functions_and_triggers.sql` | Trigger (Profil-Anlage), Helfer `is_family_member`/`is_family_admin`, Einladungs-/Zeitkapsel-Funktionen |
| `…0003_rls_policies.sql` | Row Level Security-Policies für die Kerntabellen |
| `…0004_storage.sql` | Storage-Buckets `avatars`, `photos`, `audios` + Policies |
| `…0005_phase2.sql` | member_statuses, notifications, emergency_contacts, emergency_events, calendar_events, family_documents (+RLS) |
| `…0006_phase3.sql` | Historiker-Wissensbasis (knowledge_chunks etc.) |
| `…0007_phase4.sql` | book_projects, book_versions, book_exports (+RLS) |
| `…0008_trusted_circle.sql` | trusted_contacts (+RLS) |
| `…0009_phase4_5.sql` | closeness_ratings, family_branches, branch_members |
| `…0010_phase5.sql` | relationship_suggestions, smart-invite-Felder |
| `…0011_phase6.sql` | family_events, event_participants, moments, moment_comments |
| **`…20260617000001_phase6_memorial.sql`** | **persons.is_memorial/traits, person_quotes, person_tributes (+RLS)** |
| **`…20260617000002_phase6_safety_alerts.sql`** | **safety_alerts (SOS) (+RLS)** |

**RLS:** In jeder dieser Migrationen ist `enable row level security` plus Policies
enthalten (geprüft in `docs/PHASE6_STEP2_SCHEMA_MAP.md`). Nach `db push`
verifizieren:

```bash
# Im Supabase-Dashboard → Table Editor: bei jeder Tabelle "RLS enabled" prüfen,
# oder per SQL:
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind='r'
order by relname;
# relrowsecurity = true für alle Anwendungstabellen erwartet.
```

> Falls `supabase db push` einen Reihenfolge-/Abhängigkeitsfehler meldet, bitte
> Ausgabe schicken – wir beheben es gezielt, bevor irgendetwas live geht.

---

## 4. Lokalen Staging-Test durchführen

Demo bleibt Live-Standard; lokal testest du Echt-Modus:

```bash
# .env mit den beiden EXPO_PUBLIC_SUPABASE_* Werten anlegen, dann:
npx expo start            # nativ/iOS/Android über Expo Go
# oder Web:
npx expo start --web
```

Erwartung im Echt-Modus:
- Beim Start erscheint der **Login/Registrieren**-Screen (kein Demo-Konto).
- Registrieren (mit Einwilligung) → Familie anlegen → Person/Ehrenmitglied
  hinzufügen → Foto hochladen → SOS auslösen.
- Reload + zweites Gerät/Browser: Daten sind über Supabase vorhanden
  (nicht nur localStorage).

Testchecklist:
- [ ] Registrieren / Login / Logout / Passwort-Reset
- [ ] Familie + Einladungscode + Annahme (Mitglied erscheint, Rolle korrekt)
- [ ] RLS: zweites Konto sieht **keine** fremden Familiendaten
- [ ] Ehrenmitglied + Galerie/Zitate/Erinnerungen
- [ ] Foto-Upload via signierter URL (bleibt nach Reload)
- [ ] SOS → `safety_alerts`-Eintrag + Notification
- [ ] Kein weißer Screen / kein Lade-Freeze

---

## 5. Sicherheitsprüfung (Status)

- [x] **Kein Secret/Service-Role-Key im Code** – geprüft (nur ein Kommentar in
  `app.config.ts`, dass service_role NICHT hierher gehört).
- [x] **Nur Anon/Publishable Key** wird in der App verwendet
  (`EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- [x] **`.env` ist gitignored** (`.env`, `.env.local`, `.env.*.local`) → Keys
  landen nie im Repo.
- [x] **RLS vorbereitet** in allen Migrationen.
- ⚠️ **Service-Role-Key** (für spätere Edge Functions/Push) gehört
  ausschließlich in Supabase-Secrets/Edge-Function-Env – **nie** ins Frontend.

---

## 6. Demo-Modus wieder aktivieren (jederzeit)

- **Lokal:** `.env` löschen/umbenennen **oder** `EXPO_PUBLIC_DEMO_MODE=true`
  setzen → App läuft wieder mit Beispiel-Daten + localStorage.
- **Live:** ist ohnehin durchgehend Demo (`deploy-web.yml`:
  `EXPO_PUBLIC_DEMO_MODE: 'true'`). Nichts zu tun.

---

## Risiken

| Risiko | Bewertung / Gegenmaßnahme |
|--------|---------------------------|
| Live-App betroffen | **Nein** – Live bleibt Demo; keine ENV/Secrets im Workflow geändert. |
| Weißer Screen im Echt-Modus | Abgesichert: 4‑s‑Watchdog in `AuthContext` + Demo-Fallback ohne Keys. |
| Secret-Leak | `.env` gitignored; nur Anon-Key in der App. |
| RLS zu offen/zu streng | In Schritt 4 mit ≥2 Testkonten verifizieren, bevor Cutover. |
| Migrationsfehler | Betrifft nur die **leere** Staging-DB; Live unberührt; Ausgabe teilen → gezielt fixen. |
| Große Bild-Uploads | Im Echt-Modus über Storage gelöst; localStorage-Limit entfällt. |

---

## Was du jetzt tun musst (Kurzfassung)

1. `.env` im Projekt-Root anlegen mit `EXPO_PUBLIC_SUPABASE_URL` +
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon key).
2. `supabase link --project-ref <ref>` → `supabase db push`.
3. RLS im Dashboard prüfen (alle Tabellen „RLS enabled").
4. `npx expo start` (oder `--web`) und die Testchecklist durchgehen.
5. Ergebnis/Fehler zurückmelden.

**Code-seitig wurde NICHTS Riskantes geändert** (nur das Auth-Watchdog-Sicherheitsnetz).
**Kein automatischer Cutover, kein erzwungener Login auf Live.**

## Nächster sicherer Schritt (erst nach deiner Freigabe)

Plan-Schritt 4–5: optionaler Beta-Kanal für 5–10 Familien bzw. Storage scharf
schalten – **erst** nach grünem Staging-Test. Ich stoppe hier.
