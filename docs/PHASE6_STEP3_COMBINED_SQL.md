# Phase 6 · Schritt 3 – Kombinierte Staging-SQL (Weg A: Dashboard)

> Datei: **`supabase/staging_combined.sql`** – eine einzige SQL-Datei zum
> **einmaligen** Einfügen im Supabase **SQL Editor** auf eine **leere**
> Staging-Datenbank.
>
> **Keine Änderung an der Live-App, keine Änderung an der Demo.** Die Datei wird
> nicht von der App geladen; sie ist reines DB-Setup. Es werden **keine
> Schlüssel und kein PROJECT_REF** benötigt – du fügst sie im Browser ein.

## 1. Was die SQL-Datei erstellt

Sie bündelt **alle 13 Migrationen** in korrekter Reihenfolge und legt damit das
komplette Backend an:

- **38 Tabellen** (komplettes Datenmodell)
- **Funktionen & Trigger** (u. a. automatische Profil-Anlage bei Registrierung,
  Helfer `is_family_member` / `is_family_admin`, Einladungs-/Zeitkapsel-Logik)
- **Row Level Security**: für **alle 38 Tabellen aktiviert**, insgesamt
  **129 Policies**
- **Storage-Buckets** `avatars`, `photos`, `audios` (privat) inkl. Zugriffsregeln

(Selbst gezählt aus der erzeugten Datei: 38× `create table`, 38× `enable row
level security`, 129× `create policy`.)

## 2. Welche Tabellen angelegt werden (38)

**Konto & Familie**
`profiles`, `families`, `family_members`, `invitations`

**Stammbaum & Ehrenmitglieder**
`persons`, `relationships`, `relationship_suggestions`,
`person_quotes` *(neu)*, `person_tributes` *(neu)*
(+ Spalten `persons.is_memorial`, `persons.traits`)

**Erinnerungen & Medien**
`memories`, `photos`, `audios`, `chronicle_entries`, `memory_challenges`

**Momente & Events**
`moments`, `moment_comments`, `family_events`, `event_participants`

**Zeitkapseln**
`time_capsules`, `time_capsule_recipients`

**Status, Benachrichtigungen, Kalender, Dokumente**
`member_statuses`, `notifications`, `calendar_events`,
`calendar_event_participants`, `family_documents`, `activities`

**Sicherheit / Notfall**
`emergency_contacts`, `emergency_events`, `trusted_contacts`,
`safety_alerts` *(neu, SOS)*

**Nähe & Zweige**
`closeness_ratings`, `family_branches`, `branch_members`

**Familienbuch & Historiker**
`book_projects`, `book_versions`, `book_exports`,
`knowledge_chunks`, `life_wisdoms`

## 3. Welche Beziehungen bestehen

Zentrale Achse ist die **Familie**; fast alles hängt an `families` und an
`profiles` (= `auth.users`).

```
auth.users 1─1 profiles
profiles 1─n families (created_by)
families 1─n family_members n─1 profiles      (Rolle: admin/member)
families 1─n invitations
families 1─n persons ──┐
                       ├─ relationships (from_person_id / to_person_id)
                       ├─ person_quotes / person_tributes
                       ├─ memories ─ photos / audios
                       ├─ member_statuses
                       └─ time_capsules ─ time_capsule_recipients
families 1─n notifications / activities / family_documents
families 1─n emergency_contacts / emergency_events / trusted_contacts / safety_alerts
families 1─n moments ─ moment_comments ; family_events ─ event_participants
families 1─n closeness_ratings / family_branches ─ branch_members
families 1─n book_projects ─ book_versions / book_exports
```

- Kind-Tabellen: `family_id → families(id) ON DELETE CASCADE`
  (Löschen einer Familie räumt konsistent auf).
- Personen-Bezüge meist `ON DELETE SET NULL` (Inhalte bleiben erhalten).

## 4. Welche RLS-Regeln eingerichtet werden

Einheitliches Prinzip über zwei SECURITY-DEFINER-Helfer (verhindern
RLS-Rekursion):

- **`is_family_member(family_id)`** – Lesen/Schreiben nur für Mitglieder der
  jeweiligen Familie.
- **`is_family_admin(family_id)`** – erweiterte Rechte (fremde Inhalte
  bearbeiten/löschen, Rollen ändern).

Pro Tabelle typischerweise:

| Operation | Bedingung |
|-----------|-----------|
| `select` | Mitglied der Familie |
| `insert` | Mitglied der Familie (+ ggf. `owner = auth.uid()`) |
| `update` | Eigentümer/Autor **oder** Familien-Admin |
| `delete` | Eigentümer/Autor **oder** Familien-Admin |

Sonderfälle:
- **Zeitkapseln**: Inhalt erst ab Öffnungsdatum für Empfänger sichtbar.
- **SOS (`safety_alerts`)**: Auslösen nur fürs eigene Konto; Entwarnen durch
  Familienmitglieder.
- **Storage**: Buckets privat; Zugriff über signierte URLs + Storage-Policies.

→ Ergebnis: Ein Konto sieht **ausschließlich** Daten seiner eigenen Familie.

## 5. So fügst du die Datei im Supabase Dashboard ein

1. Öffne im Browser **supabase.com → dein Projekt**.
2. Linkes Menü: **SQL Editor → New query**.
3. Öffne in diesem Repo **`supabase/staging_combined.sql`**, markiere **alles**
   (Strg/Cmd + A) und **kopiere** es.
4. Im SQL Editor einfügen → **Run** (unten rechts) bzw. Strg/Cmd + Enter.
5. Warte auf **„Success"**. Bei einer Fehlermeldung: Text kopieren und mir
   schicken – wir beheben es gezielt (Live bleibt unberührt).
6. **RLS prüfen** – neue Query, ausführen:
   ```sql
   select relname, relrowsecurity
   from pg_class
   where relnamespace = 'public'::regnamespace and relkind = 'r'
   order by relname;
   ```
   Erwartung: `relrowsecurity = true` für alle App-Tabellen.
7. Optional Kontrolle: **Table Editor** öffnen → die 38 Tabellen sollten
   sichtbar sein; **Storage** → Buckets `avatars`, `photos`, `audios`.

> Hinweis: Die Datei ist für eine **leere** DB gedacht und sollte **einmal**
> laufen. Mehrfaches Ausführen kann „already exists"-Fehler erzeugen (kein
> Schaden, nur abgebrochen). Bei Bedarf vorher im Dashboard
> **Settings → Database → Reset** (nur für eine reine Staging-DB!).

## Risiken

| Risiko | Bewertung |
|--------|-----------|
| Live-App / Demo betroffen | **Nein** – reines DB-Setup, App lädt die Datei nicht. |
| Schlüssel im Repo | **Nein** – keine Keys/Ref in der Datei. |
| Mehrfachausführung | „already exists"-Fehler möglich → nur einmal auf leere DB. |
| RLS-Lücken | In Schritt 4 mit ≥2 Testkonten verifizieren. |

## Nächster Schritt (erst nach deiner Freigabe)

Nach erfolgreichem `Run` + RLS-Check: optionaler lokaler Staging-Test mit `.env`
(`EXPO_PUBLIC_SUPABASE_URL` / `…_ANON_KEY`) – Live bleibt Demo. **Ich stoppe hier
und warte auf deine Rückmeldung.**
