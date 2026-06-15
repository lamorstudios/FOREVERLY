# Foreverly · Supabase Backend

Dieses Verzeichnis enthält das komplette Datenbankschema, die Sicherheits-
regeln (Row Level Security) und die Storage-Konfiguration für Foreverly.

## Struktur

```
supabase/
├── config.toml                 Lokale Supabase-Konfiguration
└── migrations/
    ├── ...01_initial_schema.sql        Tabellen, Enums, Indizes
    ├── ...02_functions_and_triggers.sql Trigger, Helfer, Einladungen, Zeitkapseln
    ├── ...03_rls_policies.sql          Row Level Security
    └── ...04_storage.sql               Storage-Buckets & -Policies
```

## Lokale Einrichtung

```bash
# Supabase CLI installieren: https://supabase.com/docs/guides/cli
supabase start          # Startet lokale Instanz (Docker)
supabase db reset       # Wendet alle Migrationen an
```

Danach in `.env` eintragen (Werte aus `supabase start`-Ausgabe):

```
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Datenmodell (Überblick)

| Tabelle                   | Zweck |
|---------------------------|-------|
| `profiles`                | Nutzerprofile (1:1 zu `auth.users`) |
| `families`                | Familien |
| `family_members`          | Mitgliedschaft + Rolle (admin/member) |
| `invitations`             | Einladungen per Code/Link |
| `persons`                 | Personen im Familiennetzwerk |
| `relationships`           | Farbcodierte Beziehungen zwischen Personen |
| `memories`                | Erinnerungen (Text/Foto/Audio) |
| `photos`                  | Foto-Uploads |
| `audios`                  | Audioaufnahmen |
| `time_capsules`           | Zeitkapseln (gesperrt bis Öffnungsdatum) |
| `time_capsule_recipients` | Empfänger einer Zeitkapsel |
| `activities`              | Aktivitäts-Feed für die Startseite |

## Sicherheit

- **RLS** ist auf allen Tabellen aktiv. Daten sind nur für Mitglieder der
  jeweiligen Familie sichtbar.
- **Zeitkapseln** bleiben bis zum `open_at`-Datum für Empfänger gesperrt
  (durchgesetzt auf Zeilenebene).
- SECURITY-DEFINER-Helfer (`is_family_member`, `is_family_admin`,
  `shares_family`, …) verhindern RLS-Rekursion.

## Zeitkapseln freigeben

`release_due_time_capsules()` gibt fällige Kapseln frei. In Produktion per
Scheduled Function / `pg_cron` regelmäßig aufrufen, z.B. stündlich:

```sql
select cron.schedule('release-capsules', '0 * * * *',
  $$ select public.release_due_time_capsules(); $$);
```

## Spätere Phasen

Das Schema ist bewusst erweiterbar für: Familienhistoriker-KI, Familienbuch,
Familienfilme, Dokumentenübersicht und Notfallfunktionen. Diese sind in
Phase 1 **nicht** implementiert.
