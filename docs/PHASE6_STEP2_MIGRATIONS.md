# Phase 6 · Schritt 2 – Additive Migrationsdateien (vorbereitet)

> **Status: vorbereitet, NICHT angewendet.** Diese SQL-Dateien sind inert,
> bis sie bewusst auf ein Supabase-Projekt angewendet werden. Die laufende
> Demo-App ist unverändert lauffähig (Web-Build bleibt im Demo-Modus, wendet
> keine Migrationen an). Es wurde **kein** Code, **keine** UI und **keine**
> bestehende Datenhaltung verändert.

## Angelegte Dateien

| Datei | Zweck |
|-------|-------|
| `supabase/migrations/20260617000001_phase6_memorial.sql` | Ehrenmitglieder/Familienerbe |
| `supabase/migrations/20260617000002_phase6_safety_alerts.sql` | SOS-Ereignisse |

Beide sind **rein additiv**: nur `ADD COLUMN … IF NOT EXISTS`,
`CREATE TABLE … IF NOT EXISTS`, Indizes und `CREATE POLICY`. **Kein** `DROP`,
**kein** `ALTER` bestehender Spalten/Constraints.

## Geplante/ergänzte Tabellen & Spalten

### Neu in `20260617000001_phase6_memorial.sql`
- **`persons`** (bestehend) → additive Spalten:
  - `is_memorial boolean not null default false` – Kennzeichnung Familienerbe
  - `traits text` – Besonderheiten
- **`person_quotes`** (neu) – „Was sie oft gesagt hat":
  `id, family_id, person_id, text, context, added_by_user_id, added_by_name, created_at`
- **`person_tributes`** (neu) – „Erinnerungen an diese Person":
  `id, family_id, person_id, text, author_user_id, author_name, created_at`
- RLS für beide neuen Tabellen (lesen: Familienmitglied; schreiben: Mitglied;
  ändern/löschen: Autor oder Familien-Admin) + Indizes.

### Neu in `20260617000002_phase6_safety_alerts.sql`
- **`safety_alerts`** (neu) – SOS-Notrufe:
  `id, family_id, user_id, person_id, message, place_label, latitude, longitude,
   battery, status('active'|'resolved'), created_at, resolved_at`
- RLS (lesen: Mitglied; auslösen: nur eigenes innerhalb der Familie; entwarnen:
  Mitglied; löschen: Auslöser oder Admin) + Indizes.

## Bereits vorhanden (kein neuer Bedarf in Schritt 2)

Die übrigen vom Auftrag genannten Bereiche sind bereits in den bestehenden
Migrationen abgebildet:

| Bereich | Tabelle(n) (bestehend) |
|---------|------------------------|
| Nutzer | `profiles` (1:1 zu `auth.users`) |
| Familien | `families` |
| Rollen | `family_members` (`role` admin/member) |
| Erinnerungen | `memories` |
| Fotos | `photos` (+ Storage-Bucket `photos`) |
| Dokumente | `family_documents` (Hinweise/Orte) |
| Zeitkapseln | `time_capsules`, `time_capsule_recipients` |

> Hinweis: Ein optionaler Storage-Bucket `documents` für echte Datei-Uploads
> (statt nur Hinweisen) bleibt bewusst einem späteren, optionalen Schritt
> vorbehalten (siehe `PHASE6_SUPABASE_PLAN.md`, Anhang A4).

## Konsistenz mit dem bestehenden Schema

- Nutzt die vorhandenen SECURITY-DEFINER-Helfer `public.is_family_member()` und
  `public.is_family_admin()` (verifiziert vorhanden).
- Folgt der bestehenden Namens-/Policy-Konvention (vgl. `photos`-Policies).
- Dateinamen sortieren nach den bestehenden `20260615…`-Migrationen ein.

## Risiken & Bewertung

| Risiko | Bewertung / Gegenmaßnahme |
|--------|---------------------------|
| Auswirkung auf die laufende Demo | **Keine.** Web-Build erzwingt Demo-Modus und wendet keine Migrationen an. Dateien sind inert. |
| Datenverlust | **Ausgeschlossen.** Nur additive `CREATE/ADD`; kein `DROP`/keine Änderung bestehender Spalten. |
| Mehrfaches Anwenden | Tabellen/Spalten via `IF NOT EXISTS` idempotent. `CREATE POLICY` ist (wie alle bestehenden Policies) nicht idempotent → Migrationen laufen pro DB **einmalig** (Standard bei `supabase db push`). |
| RLS zu offen/zu streng | Vor Echtbetrieb in Staging mit mehreren Testkonten prüfen (Teil von Schritt 3). |
| Reihenfolge/Abhängigkeiten | Setzt bestehende Tabellen (`families`, `persons`, `profiles`) und Helfer voraus – alle in früheren Migrationen vorhanden. |

## Verifikation in diesem Schritt

- `git status`: nur die zwei neuen SQL-Dateien hinzugefügt (kein `src/`, keine
  Workflow-Änderung).
- RLS-Helfer `is_family_member` / `is_family_admin` existieren.
- `tsc --noEmit`: fehlerfrei (App unverändert lauffähig).

## Nächster Schritt (wartet auf Freigabe)

Noch **nicht** ausgeführt:
- Supabase-Projekt anlegen/linken und Migrationen anwenden (Plan-Schritt 1 + 2-Apply).
- Staging-Test mit echten Daten (Plan-Schritt 3) – Live bleibt bis dahin Demo.

**Ich stoppe hier und warte auf deine Freigabe.**
