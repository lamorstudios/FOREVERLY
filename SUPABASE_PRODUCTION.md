# Foreverly · Supabase & echte Nutzer (Produktion)

Bündelt die Schritte und die Architektur für den Echtbetrieb. Ergänzt:
`supabase/SUPABASE_SETUP.md` (Setup), `DATA_MODEL.md` (Datenmodell),
`REAL_USER_SYSTEM.md` (Login/Invite), `DEPLOYMENT.md` (Deploy).

---

## 1. Supabase verbinden

ENV (lokal `.env`, in GitHub als Repo-Secrets):
```
EXPO_PUBLIC_SUPABASE_URL=https://<REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>   # niemals service_role
EXPO_PUBLIC_DEMO_MODE=false                        # lokal; im CI automatisch
```
Der Web-Deploy schaltet **automatisch** auf Echtbetrieb, sobald beide
Supabase-Secrets im Repo gesetzt sind – sonst Demo (siehe `deploy-web.yml`).
Migrationen anwenden: `supabase db push`.

---

## 2. Auth-Flow

Anbieter (Supabase Auth): **Google** (aktiv), **Apple** (vorbereitet – Button
auf iOS/Web, aktiv nach Provider-Setup), **E-Mail/Passwort**.

```
Login (Google/Apple/E-Mail)
  → Trigger handle_new_user: profiles-Zeile (Name + Avatar aus OAuth)
  → keine Familie?  → Onboarding: Familie erstellen ODER Einladung annehmen
  → Familie vorhanden → Haupt-App
```
Robustheit: `AuthContext` beendet die Initialisierung garantiert (Erfolg /
`.catch` / **3-s-Timeout**); `RootNavigator` hat zusätzlich einen **3-s-
forceReady**. Es gibt nie weiße Seiten oder Endlos-Loading.

---

## 3. Registrierung & Profil

`profiles`: Name + Profilbild (aus OAuth übernommen, in „Profil bearbeiten"
änderbar). **Geburtsdatum** liegt am Personensatz (`persons.birth_date`), da
eine Person zum Stammbaum gehört (über „Person bearbeiten" pflegbar).

---

## 4. Familie erstellen

„Familie erstellen" → `families`-Insert. Trigger `handle_new_family` macht den
Ersteller automatisch zu **Admin** (`family_members`) **und** zur ersten
**Person** im Stammbaum (`persons`).

---

## 5. Familieneinladungen

```
Mitglied einladen (Beziehung + Nähe wählen)
  → createSmartInvite → generate_invite_code → invitations-Zeile
  → Link …/invite/CODE teilen
Empfänger: Login → accept_invitation(code):
  - family_members (Mitgliedschaft)
  - persons (Profil verknüpfen/anlegen)
  - relationships (Einladender → neue Person) + relationship_suggestions
  → erscheint korrekt im Familienbaum (Kettenreaktion via generateSuggestions)
```
Der Einladungscode übersteht den OAuth-Redirect (`pendingInvite`).

---

## 6. Tabellen (37, alle mit RLS)

Kern: `profiles, families, family_members, persons, relationships,
relationship_suggestions, invitations, memories, photos, audios,
time_capsules (+recipients), family_documents/vault_entries, member_statuses,
notifications, trustees, estate_info/estate_cases/estate_confirmations,
reports, member_blocks`. Vollständig: `DATA_MODEL.md` + `supabase/migrations/`.

---

## 7. Policies (RLS)

- Alle Tabellen: RLS aktiv; Zugriff nur für Mitglieder der jeweiligen Familie
  (`is_family_member`, `is_family_admin` als SECURITY DEFINER gegen Rekursion).
- Inhalte zusätzlich über `visibility` (privat / inner / familie) gefiltert.
- Rollen: **admin**, **member**, **inner** (Inner Circle), **trusted**,
  **trustee** (Vertrauensperson), **guest** – Matrix in `src/lib/roles.ts`.
- Zeitkapseln bleiben bis `open_at` für Empfänger gesperrt.
- Moderation: Meldungen/Blockierungen RLS-geschützt.

---

## 8. Datei-Speicher (Supabase Storage)

Buckets (privat, in `…04_storage.sql`):
| Bucket | Inhalt | Limit |
|--------|--------|-------|
| `avatars` | Profil-/Personenbilder | 10 MB |
| `photos` | Fotos & Familienbilder (+ Video später) | 25 MB |
| `audios` | Sprach-/Audioaufnahmen | 50 MB |

Pfadkonvention: erste Pfadkomponente = `family_id`/`user_id`; Storage-Policies
erlauben Zugriff nur innerhalb der eigenen Familie. Dokumente werden als
Hinweise/Anhänge verwaltet – **keine Passwörter/TANs/Seeds**.

---

## 9. Fehlerfall (Resilienz)

- Supabase nicht erreichbar / Auth-Hänger → nach 3 s Login-Screen (nutzbar).
- React-Query: `retry: 1`, kein Focus-Refetch → keine Retry-/Loading-Schleifen.
- Render-Fehler → ErrorBoundary zeigt sichtbare Meldung (kein Weiß).
- Vor dem JS-Start steht ein sichtbarer Root-Fallback im HTML.
- Ohne Supabase-Keys läuft die App automatisch im Demo-Modus weiter.

---

## 10. Test (Echtbetrieb)

1. Registrierung/Login (Google/E-Mail) → Profil wird angelegt.
2. Familie erstellen → Admin + erste Person im Baum.
3. Einladen → Link in 2. Konto öffnen → Beitreten → beide sehen die Familie.
4. Daten speichern: Erinnerung/Foto/Zeitkapsel/Status/Dokument anlegen →
   erscheint nach Reload (in Supabase-Tabellen sichtbar).
5. Admin-Dashboard zeigt echte Counts (keine Fake-Zahlen).

---

## 11. Produktions-Checkliste
- [ ] `supabase db push` (Tabellen + RLS + Storage)
- [ ] Auth-Provider Google (und Apple) aktiviert, Redirect-URLs gesetzt
- [ ] Repo-Secrets `EXPO_PUBLIC_SUPABASE_URL` + `…ANON_KEY`
- [ ] GitHub Pages Source = `gh-pages` /(root)
- [ ] Echte Rechtstexte statt Platzhalter (siehe `legalContent.ts`)
- [ ] Optional: Last-Seen-Tracking, echtes Speicher-Byte-Tracking, Push-Versand
