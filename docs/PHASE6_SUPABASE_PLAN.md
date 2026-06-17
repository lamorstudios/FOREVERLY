# Phase 6 – Supabase: Architektur & sicherer Migrationsplan

> **Status: NUR PLAN.** Dieses Dokument ändert die laufende App **nicht**.
> Es enthält die Architektur, die Lücken-Analyse und einen schrittweisen,
> jederzeit zurückrollbaren Migrationsplan. Die eigentliche Umsetzung erfolgt
> erst nach gemeinsamer Freigabe – Schritt für Schritt.

## Leitprinzipien (vom Auftrag)

1. **Bestehende App nicht kaputt machen** – der Demo-/Testmodus bleibt der
   Standard, bis ein Schritt nachweislich grün ist.
2. **Backup vor jeder Änderung** – Git-Tag + DB-Dump vor jedem Schritt.
3. **Schrittweise** – jeder Schritt ist klein, einzeln testbar und einzeln
   zurückrollbar.
4. **Keine UI-Änderungen, keine neuen Features** – nur Datenhaltung/Backend.
5. **Demo bleibt funktionsfähig** – Umschaltung erfolgt über Konfiguration
   (Env), nicht durch Codeumbau.

## Schlüsselerkenntnis: Vieles ist bereits vorbereitet

Die App ist von Anfang an „Supabase-ready" gebaut. Es gibt **keinen großen
Umbau** – es geht ums **Aktivieren** und **Schließen kleiner Lücken**:

- **Konfig-Schalter vorhanden:** `src/lib/config.ts` → `DEMO_MODE` ist automatisch
  **aus**, sobald `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  gesetzt sind (oder explizit `EXPO_PUBLIC_DEMO_MODE=false`).
- **Auth vorhanden:** `src/context/AuthContext.tsx` hat `signUp/signIn/signOut/
  resetPassword/resend` bereits mit echtem Supabase-Pfad (nur im Demo-Modus
  überbrückt).
- **Jede API ist doppelt gebaut:** `if (DEMO_MODE) … else supabase…` (z. B.
  `api/persons.ts`, `api/media.ts`, `api/memorial.ts`).
- **Schema/RLS/Storage existieren:** `supabase/migrations/…` (initial schema,
  Funktionen/Trigger, RLS-Policies, Storage-Buckets, Phasen 2–6).
- **Client vorhanden:** `src/lib/supabase.ts` (Session in AsyncStorage,
  Auto-Refresh).

> Der Live-Web-Build erzwingt aktuell bewusst `EXPO_PUBLIC_DEMO_MODE: 'true'`
> (`.github/workflows/deploy-web.yml`). Das bleibt so, bis wir bewusst umschalten.

## Lücken-Analyse (was noch fehlt)

| Bereich | Status | To-do |
|---------|--------|-------|
| Auth (E-Mail/Passwort) | ✅ vorhanden | Supabase-Projekt + Auth-Settings |
| Profile/Familien/Mitglieder/Einladungen/Personen/Beziehungen | ✅ Schema + RLS | – |
| Erinnerungen/Fotos/Audios/Zeitkapseln/Aktivitäten | ✅ Schema + RLS | – |
| Notifications, Emergency, Trusted, Dokumente, Kalender | ✅ Schema | – |
| **SOS `safety_alerts`** | ❌ Tabelle fehlt | Migration hinzufügen |
| **Ehrenmitglieder**: `persons.is_memorial`, `persons.traits` | ❌ Spalten fehlen | Migration (ALTER) |
| **Zitate** `person_quotes`, **Erinnerungen** `person_tributes` | ❌ Tabellen fehlen | Migration + RLS |
| **Push-Tokens** `push_tokens` | ❌ fehlt | Migration + Edge Function |
| **Dokumenten-Datei-Upload** (Bucket `documents`) | ❌ fehlt (heute nur Hinweise) | Bucket + Policies (optional, später) |
| Storage-Buckets `avatars/photos/audios` | ✅ vorhanden | – |

Diese Lücken stammen aus Features, die nach dem ursprünglichen Schema kamen
(Phase „Ehrenmitglieder", SOS-Echtdaten). Sie werden als **additive**
Migrationen ergänzt (nur `CREATE/ALTER`, kein `DROP`) – risikoarm.

---

## Architektur je Themenbereich

### 1. Auth vorbereiten
- **Verfahren:** Supabase Auth, E-Mail + Passwort (bereits im Code). Optional
  später Magic-Link/Google.
- **Profile-Anlage:** Trigger `on auth.users insert → profiles` (in
  `…02_functions_and_triggers.sql` vorhanden) – ein neues Konto bekommt
  automatisch ein `profiles`-Zeile.
- **Einwilligung:** DSGVO-Checkbox bei der Registrierung ist bereits umgesetzt
  (Phase 5). Optional Speicherung des Einwilligungs-Zeitpunkts in `profiles`.
- **Nur Anon-Key in der App** (niemals `service_role`). Bereits so vorgesehen.

### 2. Datenbankstruktur
- Bestehendes relationales Schema (Postgres) bleibt maßgeblich. Ergänzungen
  additiv (siehe Lücken). **RLS bleibt für jede Tabelle Pflicht** – Zugriff nur
  auf Daten der eigenen Familie.
- Quelle der Wahrheit: `supabase/migrations/` (versioniert, reproduzierbar).

### 3. Familienmodell
- `families` (1) ─ `family_members` (n, mit `role` admin/member) ─ `profiles`.
- `persons` (Stammbaum-Knoten, auch ohne Konto) + `relationships`
  (typ/kategorie). Ehrenmitglieder = `persons.is_memorial = true`.
- Sichtbarkeit/Berechtigung über RLS anhand der Familienzugehörigkeit
  (`family_members`).

### 4. Einladungen
- `invitations` (Code/Link, Rolle, optional `person_id`, Status) ist vorhanden.
- **Echter Flow später:** Einladungscode → Registrierung → `accept_invitation`
  (RPC, vorhanden/zu prüfen) verknüpft `auth.user` mit `family_members` und ggf.
  bestehender `person`.
- Optional: E-Mail-Versand via Supabase Auth Invite oder Edge Function.

### 5. Speicher für Fotos/Dokumente
- Buckets `avatars/photos/audios` existieren inkl. RLS (privat, signierte URLs).
- `src/lib/storage.ts` lädt hoch und erzeugt signierte URLs (Demo gibt Pfade
  direkt zurück). **Damit lösen sich auch die heutigen `blob:`-URL-Grenzen**
  (Bilder bleiben dauerhaft, geräteübergreifend).
- **Neu für Dokumente:** Bucket `documents` (privat) + RLS, falls echte
  Datei-Uploads gewünscht sind (heute nur Hinweise/Orte).

### 6. Push Notifications
- Heute: In-App-Notifications (Tabelle `notifications`) + lokale Erinnerungen
  (`expo-notifications`, nur nativ).
- **Echtes Push (später):**
  1. `push_tokens` (user_id, expo_push_token, platform, updated_at) – neue
     Tabelle.
  2. Beim App-Start Token registrieren (nur nativ; Web bleibt In-App).
  3. Edge Function `send-push`: wird per DB-Trigger/Webhook bei neuen
     `notifications` aufgerufen → Expo Push API → FCM/APNs.
  - In-App-Notifications bleiben Fallback (Web).

### 7. SOS auf echte Daten
- Heute: In-Screen-Dialog + Countdown + In-App-Notifications + Demo-Store.
- **Echt:** Tabelle `safety_alerts` (neu) speichert Auslöser, Zeit, Nachricht,
  Standortstatus, Status. RLS: Familie liest, Auslöser/Trusted lösen aus/auf.
- Echte Zustellung an Empfänger über denselben Push-Weg (#6).
- GPS optional via `expo-location` (separater, nativer Schritt).

---

## Schrittweiser Migrationsplan (jeder Schritt einzeln freigeben)

> **Vor jedem Schritt:** Git-Tag `pre-step-N` + (ab Schritt 3) `pg_dump`-Backup.
> **Rollback** jeweils klar definiert. **Kein Schritt** verändert UI/Features.

### Schritt 0 — Backup & Sicherheitsnetz (kein Risiko)
- Git-Tag des aktuellen, stabilen `main` (z. B. `v-pre-supabase`).
- Branch `phase6/supabase` für alle Backend-Arbeiten.
- Festhalten: Live bleibt unverändert auf Demo.
- **Rollback:** nichts zu tun (keine Änderung an Live).

### Schritt 1 — Supabase-Projekt provisionieren (kein App-Risiko)
- Supabase-Projekt anlegen (Region EU für DSGVO).
- `supabase link` + `supabase db push` → bestehende Migrationen anwenden
  (separate, leere DB – Live-App unberührt).
- Auth-Provider „E-Mail" aktivieren, Bestätigungs-Mail-Vorlagen (FAMII-Branding).
- **Rollback:** Projekt pausieren/löschen; App weiterhin Demo.

### Schritt 2 — Fehlende Migrationen ergänzen (additiv, nur neue DB)
- Neue Migrationen (nur `CREATE/ALTER`, siehe Anhang):
  - `…_phase6_memorial.sql` → `persons.is_memorial`, `persons.traits`,
    `person_quotes`, `person_tributes` (+ RLS).
  - `…_phase6_safety_alerts.sql` → `safety_alerts` (+ RLS).
  - `…_phase6_push_tokens.sql` → `push_tokens` (+ RLS).
  - (optional) `…_phase6_documents_bucket.sql` → Bucket `documents` (+ Policies).
- Anwenden auf das (noch nicht live genutzte) Projekt.
- **Rollback:** Migration ist additiv; Down-Migration droppt nur die neuen
  Objekte. Live-App unberührt.

### Schritt 3 — Staging-Test (echte Daten, ohne Live-Umschaltung)
- Lokaler/Preview-Build mit `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` → `DEMO_MODE`
  automatisch aus.
- Vollständiger Funktionstest gegen echte DB (siehe Akzeptanzkriterien).
- **Live bleibt Demo.**
- **Rollback:** Env entfernen → wieder Demo.

### Schritt 4 — Parallelbetrieb / Beta-Kanal (optional)
- Zweite Deploy-Variante (z. B. `/FOREVERLY-beta` oder separater Branch) mit
  echten Daten für 5–10 Testfamilien; Haupt-URL bleibt Demo.
- **Rollback:** Beta-Deploy abschalten.

### Schritt 5 — Storage scharf schalten
- Foto-/Audio-Uploads laufen über echte Buckets (Code vorhanden) → Bilder
  bleiben dauerhaft & geräteübergreifend. Test mit echten Uploads + signierten
  URLs.
- **Rollback:** Env zurück auf Demo.

### Schritt 6 — Push aktivieren (nur nativ)
- `push_tokens` + Token-Registrierung + Edge Function `send-push`.
- Web bleibt In-App. Test mit Testgeräten.
- **Rollback:** Edge Function deaktivieren; In-App bleibt.

### Schritt 7 — Cutover der Haupt-URL (bewusste Entscheidung)
- Erst wenn Schritte 3–6 grün: `deploy-web.yml` von `DEMO_MODE:'true'` auf
  echte Secrets umstellen (`EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` als GitHub
  Secrets; `EXPO_PUBLIC_DEMO_MODE:'false'`).
- **Wichtig:** Resilienz-Mechanik (Auth-Timeout, `forceReady`, Fallback) bleibt,
  damit es nie zu Weiß-/Ladehang kommt (war früher die Hauptursache).
- **Rollback (1 Commit):** Workflow zurück auf `DEMO_MODE:'true'` → sofort wieder
  stabiler Demo-Betrieb.

---

## Backup-Strategie

- **Code:** Git-Tag vor jedem Schritt; alle Backend-Arbeiten auf `phase6/supabase`.
- **Daten (ab Schritt 3):** `supabase db dump` vor jeder Migration; Point-in-Time-
  Recovery (Supabase Pro) erwägen, sobald echte Familien aktiv sind.
- **Secrets:** nur als GitHub Actions Secrets / Env – niemals im Repo. Nur
  Anon-Key in der App; `service_role` ausschließlich serverseitig (Edge
  Functions).

## Akzeptanzkriterien je Schritt (Auszug)

- Registrieren → Login → Logout → Passwort-Reset funktionieren.
- Familie anlegen, einladen (Code), annehmen → Mitglied erscheint im Baum,
  Rolle korrekt, RLS verhindert Fremdzugriff.
- Person/Ehrenmitglied anlegen inkl. Galerie/Zitate/Erinnerungen → nach Reload
  **und auf zweitem Gerät** vorhanden.
- Foto-Upload → erscheint via signierter URL, bleibt nach Reload.
- SOS → `safety_alerts`-Eintrag + Notification; Empfänger sehen es.
- Kein Weiß-/Ladehang; Demo-Fallback jederzeit aktivierbar.

## Risiken & Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|--------|---------------|
| Weiß-/Ladehang bei Auth (frühere Ursache) | Auth-Timeout + `forceReady` + Demo-Fallback beibehalten; erst nach Staging-Test cutover |
| RLS-Fehler (zu offen/zu streng) | Policies in Staging mit mehreren Testkonten prüfen |
| `service_role`-Leak | Nur Anon-Key in App; service_role nur in Edge Functions/Secrets |
| Migration bricht DB | Nur additive Migrationen; Backup vor jeder; Down-Migrationen |
| DSGVO | EU-Region, Auftragsverarbeitung, Export/Löschung (DSGVO-Screen vorhanden) |

---

## Anhang: vorbereitete SQL (noch NICHT angewendet)

> Diese Skripte werden erst in **Schritt 2** als Migrationsdateien angelegt und
> auf das separate Supabase-Projekt angewendet. Sie sind additiv.

### A1 – Ehrenmitglieder
```sql
alter table public.persons
  add column if not exists is_memorial boolean not null default false,
  add column if not exists traits text;

create table if not exists public.person_quotes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  text text not null,
  context text,
  added_by_user_id uuid references auth.users(id) on delete set null,
  added_by_name text not null default 'Familienmitglied',
  created_at timestamptz not null default now()
);

create table if not exists public.person_tributes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  text text not null,
  author_user_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Familienmitglied',
  created_at timestamptz not null default now()
);

alter table public.person_quotes enable row level security;
alter table public.person_tributes enable row level security;
-- RLS: Mitglieder der jeweiligen Familie dürfen lesen/schreiben
-- (analog zu bestehenden Policies über family_members).
```

### A2 – SOS
```sql
create table if not exists public.safety_alerts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid references public.persons(id) on delete set null,
  message text,
  place_label text,
  latitude double precision,
  longitude double precision,
  battery int,
  status text not null default 'active' check (status in ('active','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.safety_alerts enable row level security;
```

### A3 – Push
```sql
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);
alter table public.push_tokens enable row level security;
```

### A4 – Dokumente (optional)
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents','documents', false, 26214400,
  array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- + Policies analog zu 'photos'.
```

---

## Empfehlung für die nächste Entscheidung

Reihenfolge mit dem besten Sicherheits-/Nutzen-Verhältnis:

1. **Schritt 0 + 1** (Backup, Projekt, bestehende Migrationen) – kein App-Risiko.
2. **Schritt 2** (Lücken-Migrationen) – additiv.
3. **Schritt 3** (Staging-Test mit echten Daten) – Live bleibt Demo.
4. Gemeinsam bewerten, dann **Schritt 5/6** und zuletzt **Schritt 7 (Cutover)**.

Bis zur Freigabe bleibt der Live-Betrieb **unverändert im stabilen
Demo-/Testmodus**.
