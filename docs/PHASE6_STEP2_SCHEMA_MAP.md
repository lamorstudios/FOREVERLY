# Phase 6 · Schritt 2 – Datenbankstruktur: Vollständigkeitsprüfung (15 Bereiche)

> **Ergebnis vorab:** Alle 15 gewünschten Bereiche sind als Supabase-Tabellen
> **bereits vorbereitet** – inklusive Beziehungen (Foreign Keys) und RLS.
> 13 Bereiche existierten schon in den bestehenden Migrationen; die 2 letzten
> Lücken (Ehrenmitglieder, SOS) wurden im vorigen Schritt-2-Commit (`62dcd89`)
> additiv ergänzt.
>
> **Es wurden daher KEINE neuen Migrationsdateien angelegt.** Neue Dateien
> würden bestehende Tabellen doppelt definieren und das Schema beschädigen –
> das widerspräche „keine bestehende Funktion verändern / Live-App nicht
> gefährden". Stattdessen dokumentiert dieses Dokument die geprüfte Abdeckung.
>
> **Nichts wurde an der laufenden App geändert:** kein Code, keine UI, keine
> localStorage-Logik, keine Supabase-Verbindung, kein Auth-Gate. Die Demo bleibt
> unverändert lauffähig (Web-Build im Demo-Modus, wendet keine Migrationen an).

## Geprüfte Abdeckung (alle 15 Bereiche)

| # | Bereich | Tabelle(n) | Definierende Migration | RLS |
|---|---------|-----------|------------------------|-----|
| 1 | Nutzerprofile | `profiles` | `…0001_initial_schema` | ✅ 4 Policies |
| 2 | Familien | `families` | `…0001_initial_schema` | ✅ 5 |
| 3 | Familienmitglieder | `family_members` | `…0001_initial_schema` | ✅ 4 |
| 4 | Rollen & Berechtigungen | `family_members.role` (`admin`/`member`) + Helfer `is_family_member` / `is_family_admin` | `…0001` + `…0002_functions` | ✅ |
| 5 | Einladungen | `invitations` (+ RPC `accept_invitation`) | `…0001` / `…0002` | ✅ 4 |
| 6 | Ehrenmitglieder | `persons.is_memorial`, `persons.traits`, `person_quotes`, `person_tributes` | **`…20260617000001_phase6_memorial`** | ✅ 4+4 |
| 7 | Erinnerungen | `memories` | `…0001_initial_schema` | ✅ 5 |
| 8 | Fotos / Galerien | `photos` (+ Bucket `photos`), `audios` | `…0001` + `…0004_storage` | ✅ 4 |
| 9 | Dokumente | `family_documents` | `…0005_phase2` | ✅ 4 |
| 10 | Zeitkapseln | `time_capsules`, `time_capsule_recipients` | `…0001_initial_schema` | ✅ 5 |
| 11 | Familienstatus | `member_statuses` | `…0005_phase2` | ✅ 4 |
| 12 | Benachrichtigungen | `notifications` | `…0005_phase2` | ✅ 3 |
| 13 | SOS-Ereignisse | `safety_alerts` | **`…20260617000002_phase6_safety_alerts`** | ✅ 4 |
| 14 | Vertrauenspersonen | `trusted_contacts` | `…0008_trusted_circle` | ✅ 4 |
| 15 | Familienbuch | `book_projects`, `book_versions`, `book_exports` | `…0007_phase4` | ✅ |

(Alle Angaben per Skript gegen `supabase/migrations/` verifiziert: definierende
Datei, `enable row level security` und Policy-Anzahl.)

## Beziehungen zwischen den Tabellen (Foreign Keys)

Zentrale Achse ist die **Familie**; fast alles hängt an `families` und an
`profiles` (= `auth.users`).

```
auth.users 1─1 profiles
profiles 1─n families (created_by)
families 1─n family_members n─1 profiles        (Rollen: admin/member)
families 1─n invitations (invited_by→profiles, accepted_by→profiles)
families 1─n persons (user_id→profiles optional, created_by→profiles)
persons  n─n persons via relationships (from_person_id, to_person_id)
families 1─n memories (person_id→persons, author_id→profiles)
families 1─n photos (memory_id→memories, person_id→persons, uploaded_by→profiles)
families 1─n audios (memory_id→memories, person_id→persons, recorded_by→profiles)
families 1─n time_capsules ─ time_capsule_recipients (person_id→persons / user_id→profiles)
families 1─n member_statuses (person_id→persons)
families 1─n notifications (recipient/actor→profiles)
families 1─n family_documents
families 1─n trusted_contacts (person_id→persons)
families 1─n book_projects ─ book_versions / book_exports

# Neu in Schritt 2:
persons  1─n person_quotes   (family_id→families, added_by_user_id→profiles)
persons  1─n person_tributes (family_id→families, author_user_id→profiles)
families 1─n safety_alerts   (user_id→profiles, person_id→persons)
```

Alle Kind-Tabellen referenzieren `family_id → families(id) on delete cascade`
(Löschen einer Familie entfernt konsistent ihre Daten). Personen-Referenzen sind
meist `on delete set null` (Inhalte bleiben erhalten, wenn eine Person entfernt
wird).

## Vorgesehene RLS-Policies (Muster)

Einheitliches Prinzip über SECURITY-DEFINER-Helfer (vermeidet RLS-Rekursion):

- **`is_family_member(family_id)`** → Lesen/Schreiben nur für Mitglieder der
  jeweiligen Familie.
- **`is_family_admin(family_id)`** → erweiterte Rechte (z. B. fremde Inhalte
  bearbeiten/löschen, Rollen ändern).

Pro Tabelle typischerweise vier Policies:

| Operation | Bedingung (Standardmuster) |
|-----------|----------------------------|
| `select` | `is_family_member(family_id)` |
| `insert` | `is_family_member(family_id)` (+ ggf. `owner = auth.uid()`) |
| `update` | Eigentümer/Autor **oder** `is_family_admin(family_id)` |
| `delete` | Eigentümer/Autor **oder** `is_family_admin(family_id)` |

Sonderfälle:
- **Zeitkapseln**: Inhalt erst ab Öffnungsdatum für Empfänger sichtbar
  (`is_capsule_recipient` / `is_capsule_creator`).
- **SOS (`safety_alerts`)**: Auslösen nur für sich selbst (`user_id = auth.uid()`),
  Entwarnen durch jedes Mitglied (Helfer kann „erledigt" setzen).
- **Storage**: Buckets `avatars/photos/audios` privat, Zugriff über signierte
  URLs + Storage-Policies.

## Risiken

| Risiko | Bewertung / Gegenmaßnahme |
|--------|---------------------------|
| Auswirkung auf Live-Demo | **Keine.** Keine Code-/Config-Änderung; Migrationen werden nicht angewendet; Web-Build bleibt Demo. |
| Doppelte Tabellen­definition | Vermieden – es wurden bewusst **keine** neuen Dateien angelegt, da alle 15 Bereiche bereits existieren. |
| Datenverlust | Ausgeschlossen – keine `DROP`/`ALTER` an bestehenden Spalten. |
| RLS zu offen/zu streng | Erst in Staging (Schritt 3) mit mehreren Testkonten verifizierbar. |
| `CREATE POLICY` nicht idempotent | Migrationen laufen pro DB einmalig (Standard `supabase db push`). |
| Weiße Screens / Auth-Gate | **Nicht berührt** – keine Supabase-Verbindung aktiviert, kein Auth-Gate eingebaut. |

## Was ist der nächste sichere Schritt?

Schritt 2 ist damit **abgeschlossen** (Struktur vollständig vorbereitet). Der
nächste – noch **nicht** auszuführende – Schritt ist **Plan-Schritt 1+3**:

1. Separates Supabase-Projekt (EU-Region) anlegen und `supabase db push`
   ausführen (wendet ALLE Migrationen auf eine **leere** DB an – Live-App bleibt
   unberührt).
2. **Staging-Test** mit echten Daten über lokale Env (`EXPO_PUBLIC_SUPABASE_URL`
   / `…_ANON_KEY`) → `DEMO_MODE` automatisch aus, **nur lokal**.
3. RLS mit mehreren Testkonten prüfen.

Erst nach erfolgreichem Staging-Test und gemeinsamer Freigabe folgt der Cutover
der Live-URL (Plan-Schritt 7, 1‑Commit-Rollback).

**Ich stoppe hier und mache NICHT automatisch mit Schritt 3 weiter.**
