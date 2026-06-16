# Foreverly · Datenmodell

Vollständiges Datenmodell für den Übergang von Demo- zu echten Daten.
TypeScript-Typen: `src/types/models.ts`. Datenbank: `supabase/migrations/`
(PostgreSQL, 37 Tabellen, alle mit Row Level Security).

Quelle der Wahrheit:
- **Demo-Modus** liest/schreibt im In-Memory-Store `src/demo/store.ts`.
- **Echtbetrieb** nutzt dieselben API-Funktionen (`src/api/*`), die auf
  Supabase zeigen. Gleiche Felder, gleiche Beziehungen.

---

## 1. Kern-Entitäten

### Nutzer · `profiles` (1:1 zu `auth.users`)
| Feld | Typ | Hinweis |
|------|-----|--------|
| id | uuid | = auth.users.id |
| email | text | |
| full_name | text | aus OAuth (Google/Apple) übernommen |
| avatar_url | text | Profilbild (Storage) |
| bio | text | optional |
| created_at / updated_at | timestamptz | |

Geburtsdatum/Familienrolle liegen bewusst nicht am Konto, sondern an
`persons` bzw. `family_members` (s. u.), da eine Person zu mehreren Familien
gehören und ein Konto verschiedene Rollen haben kann.

### Familien · `families`
| Feld | Typ |
|------|-----|
| id | uuid (Familien-ID) |
| name | text (Familienname) |
| image_url | text |
| created_by | uuid → profiles (Gründer) |
| created_at / updated_at | timestamptz |

### Familienmitglieder · `family_members` (Mitglieder- & Rollenliste)
| Feld | Typ | Hinweis |
|------|-----|--------|
| id | uuid | |
| family_id | uuid → families | |
| user_id | uuid → profiles | |
| role | enum `admin` \| `member` | Familienrolle |
| joined_at | timestamptz | |
| unique(family_id, user_id) | | ein Mitglied je Familie |

### Personen im Stammbaum · `persons` (Profilstruktur)
| Feld | Typ | Hinweis |
|------|-----|--------|
| id | uuid | |
| family_id | uuid → families | Zugehörigkeit |
| user_id | uuid → profiles \| null | verknüpftes Konto (falls vorhanden) |
| first_name / last_name | text | Vor-/Nachname |
| birth_date | date | Geburtsdatum |
| birth_place / death_date / biography | | |
| avatar_url | text | Profilbild |
| is_legend | bool | Familienlegende |

### Beziehungen · `relationships`
`from_person_id → to_person_id`, `type` (vater/mutter/sohn/tochter/bruder/
schwester/oma/opa/tante/onkel/cousin/cousine/nichte/neffe/ehepartner/…),
`category` (biological/married/patchwork/adoption). Abgeleitete Vorschläge in
`relationship_suggestions`.

---

## 2. Familienrollen & Berechtigungen

App-Rollen (`src/lib/roles.ts`): `admin`, `member`, `inner` (Inner Circle),
`trusted`, `trustee`, `guest` mit Permission-Matrix. Durchsetzung über RLS
(nur eigene Familie) + Sichtbarkeit `visibility` (privat / inner / familie).

---

## 3. Inhalte

### Erinnerungen · `memories` (+ `photos`, `audios`)
`memories(title, description, content_type text|photo|audio, occurred_on,
visibility, person_id, author_id)`. Medien in `photos` / `audios` (Storage-
Buckets `photos`, `audios`, `avatars`).

### Zeitkapseln · `time_capsules` (+ `time_capsule_recipients`)
| Feld | Typ |
|------|-----|
| content_type | text \| photo \| audio (Vorbereitung: video über `storage_path`) |
| text_content | text |
| storage_path | text (Foto/Video/Audio) |
| open_at | timestamptz (gesperrt bis Datum) |
| is_opened | bool |
| visibility / open_on_death | Sichtbarkeit / erst nach Nachlassfreigabe |

Formate Foto/Video/Audio/Text: Text in `text_content`, Medien in
`storage_path` (Bucket nach Typ). Empfänger in `time_capsule_recipients`.

### Dokumente · `family_documents` / Family Vault (`vault_entries`)
Kategorien vorbereitet: `testament`, `patientenverfuegung`, `versicherung`,
`urkunde`, `passwort-hinweis`, `sonstige`. **Keine Passwörter/TANs/Seeds** —
nur Hinweise/Fundorte. Sichtbarkeit/Freigabe über `visibility` + Trustees.

---

## 4. Vertrauenspersonen & Nachlass · `trustees`, `estate_*`
| Tabelle | Inhalt |
|---------|--------|
| trustees | 1–3 Vertrauenspersonen je Konto, Kontakt, Status |
| estate_info | Nachlasshinweise (Audience) |
| estate_cases | ausgelöster Nachlassfall |
| estate_confirmations | Bestätigungsstatus je Vertrauensperson |

Ablauf: mehrere Vertrauenspersonen müssen den Nachlassfall bestätigen, bevor
freigegebene Inhalte sichtbar werden.

---

## 5. Familienstatus & Benachrichtigungen
- `member_statuses`: Stimmung/Status je Mitglied (Level, Emoji, Text).
- `notifications`: `category` (status/emergency/calendar/info), `title`,
  `body`, `data` (Typ + Navigationsziel), `is_read`. Vorbereitet für:
  Familienereignisse, Erinnerungen, Zeitkapseln, Geburtstage, Statusmeldungen
  (Typen in `src/lib/notificationCenter.ts`).

---

## 6. Beziehungen (Überblick)

```
auth.users 1─1 profiles
profiles 1─n family_members n─1 families
families 1─n persons (0..1 → profiles via user_id)
persons n─n persons via relationships
families 1─n memories 1─n photos|audios
families 1─n time_capsules 1─n time_capsule_recipients
families 1─n family_documents / vault_entries
profiles 1─n trustees → estate_cases → estate_confirmations
families 1─n member_statuses | notifications | invitations
```

---

## 7. Admin: echte statt erfundene Zahlen
`src/api/admin.ts` berechnet alle Kennzahlen aus einem **Snapshot**:
- Demo: `demoStore.adminSnapshot()` zählt den echten Demo-Datensatz.
- Echtbetrieb: zählende Supabase-Queries (`count: 'exact'`).
Keine hartkodierten Fantasiewerte mehr. Speicher (GB) ist eine klar
dokumentierte Schätzung (Ø Mediengrößen), bis echtes Byte-Tracking existiert.

---

## 8. Supabase-Vorbereitung
- Alle Tabellen + RLS + Storage in `supabase/migrations/` (per `supabase db
  push` anwenden, siehe `supabase/SUPABASE_SETUP.md`).
- API-Schicht (`src/api/*`) ist bereits dual: `if (DEMO_MODE) demoStore … else
  supabase …` – der Wechsel erfordert nur gesetzte ENV-Variablen, keinen
  Code-Umbau.
- Trigger: `handle_new_user` (Profil aus OAuth), `handle_new_family` (Gründer
  → Admin + erste Person), `accept_invitation` (Beitritt + Beziehung).
