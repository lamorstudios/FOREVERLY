# Foreverly · Supabase Live-Setup

Schritt-für-Schritt, um Foreverly von der Demo auf **echte Nutzer** umzustellen.
Alle Tabellen, RLS-Policies, Trigger und Storage-Buckets liegen bereits als
Migrationen unter `supabase/migrations/` vor.

---

## 1. Projekt & Datenbank

1. Projekt auf https://supabase.com erstellen (Region nahe den Nutzern).
2. Migrationen anwenden – per CLI:
   ```bash
   supabase link --project-ref <DEIN-REF>
   supabase db push          # wendet alle Dateien aus supabase/migrations an
   ```
   (Lokal/Test: `supabase start` + `supabase db reset`.)
3. Prüfen, dass diese Tabellen existieren (Table Editor):
   `profiles, families, family_members, persons, relationships,
   invitations, relationship_suggestions, memories, photos, audios,
   time_capsules` u. a. – insgesamt 35 Tabellen, **alle mit RLS aktiv**.

> RLS ist auf allen Tabellen eingeschaltet (`...03_rls_policies.sql` u. a.).
> Daten sind nur für Mitglieder der jeweiligen Familie sichtbar.

---

## 2. Storage

Migration `...04_storage.sql` legt drei private Buckets an:
`avatars`, `photos`, `audios` (mit Größen-/MIME-Limits und Zugriff nur für
die eigene Familie). Nichts weiter zu tun – wird per `db push` erstellt.

---

## 3. Google-Login (OAuth)

### Google Cloud Console
1. **APIs & Services → OAuth consent screen** einrichten (extern, App-Name,
   Support-Mail).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. **Authorized redirect URI** eintragen:
   ```
   https://<DEIN-REF>.supabase.co/auth/v1/callback
   ```
4. Client-ID und Client-Secret kopieren.

### Supabase Dashboard
1. **Authentication → Providers → Google** → aktivieren, Client-ID/Secret
   eintragen, speichern.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://lamorstudios.github.io/FOREVERLY/`
   - **Redirect URLs** (jeweils hinzufügen):
     ```
     https://lamorstudios.github.io/FOREVERLY/
     http://localhost:8081/
     foreverly://
     ```
   (Die App schickt als `redirectTo` die aktuelle Web-Origin bzw. das
   App-Schema – beides muss hier erlaubt sein.)

> Profil, Name und Profilbild werden nach dem ersten Google-Login automatisch
> angelegt (`handle_new_user` liest `name`/`picture`).

---

## 4. ENV-Werte

Lokal in `.env` (siehe `.env.example`):

```
EXPO_PUBLIC_DEMO_MODE=false
EXPO_PUBLIC_SUPABASE_URL=https://<DEIN-REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_INVITE_BASE_URL=https://lamorstudios.github.io/FOREVERLY/invite
```

### GitHub (Pages-Deploy)
Repository → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Wert |
|--------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://<DEIN-REF>.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `<anon public key>` |

Der Workflow `deploy-web.yml` schaltet automatisch auf **Real-Mode**
(`DEMO_MODE=false`), sobald beide Secrets vorhanden sind – andernfalls bleibt
es beim Demo-Modus. (Nur den **anon**-Key verwenden, niemals `service_role`.)

### Vercel / Netlify (optional)
Project Settings → **Environment Variables**:

```
EXPO_PUBLIC_DEMO_MODE=false
EXPO_PUBLIC_SUPABASE_URL=https://<DEIN-REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_INVITE_BASE_URL=https://<deine-domain>/invite
```
Build: `npx expo export --platform web`, Output-Verzeichnis: `dist`.
Die Site-URL/Domain zusätzlich in Supabase **Redirect URLs** eintragen.

---

## 5. Demo vs. Real (Trennung)

- `EXPO_PUBLIC_DEMO_MODE=true` **oder** fehlende Supabase-Keys → **Demo-Modus**
  (In-Memory-Beispieldaten, keine DB-Schreibzugriffe).
- `EXPO_PUBLIC_DEMO_MODE=false` + gültige Keys → **echte Nutzer** in Supabase.

Demo- und Echtdaten sind dadurch vollständig getrennt; die Demo schreibt nie
in die Datenbank.

---

## 6. Login & Flow testen

1. Web starten: `EXPO_PUBLIC_DEMO_MODE=false … npx expo start --web`
   (oder die deployte Seite mit gesetzten Secrets öffnen).
2. **Login**: „Mit Google fortfahren" → Google-Dialog → zurück in der App;
   Profil mit Name/Bild ist automatisch angelegt.
3. **Familie erstellen**: ohne Familie landest du im Onboarding →
   „Familie erstellen" → du wirst Admin **und** erste Person im Stammbaum.
4. **Einladen**: Button „+ Familienmitglied einladen" → Beziehung & Nähe
   wählen → Link erstellen → teilen/kopieren.
5. **Beitreten**: Link in zweitem Browser/Inkognito öffnen → Google-Login →
   Beitritt mit vorausgefülltem Code → **Beitreten**.
6. **Familienbaum**: Die neue Person erscheint mit der gewählten Beziehung
   (plus Beziehungsvorschlag) im Netzwerk – bei beiden Konten sichtbar.

### Häufige Stolpersteine
- *„redirect_uri_mismatch"* → Redirect-URL fehlt in Supabase **oder** in der
  Google Console.
- Nach Google-Redirect wieder ausgeloggt → Site-URL/Redirect-URL stimmt nicht
  mit der echten Web-Origin überein (inkl. `/FOREVERLY/`-Unterpfad).
- Leere Daten/403 → Migrationen nicht angewendet oder falscher Key.
