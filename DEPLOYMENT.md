# Foreverly · Deployment & Beta-Test

Wie du Foreverly mit echter Supabase-Anbindung online stellst und an erste
Tester verteilst. Backend-Details (DB, Google-OAuth) stehen in
`supabase/SUPABASE_SETUP.md`.

---

## 1. Deployment-Optionen

Alle Varianten bauen denselben Web-Export.

| | Build-Befehl | Output | Live-URL |
|---|---|---|---|
| **GitHub Pages** (eingerichtet) | `npx expo export --platform web` | `dist` | `https://lamorstudios.github.io/FOREVERLY/` |
| **Vercel** | `npx expo export --platform web` | `dist` | `https://<projekt>.vercel.app` |
| **Netlify** | `npx expo export --platform web` | `dist` | `https://<projekt>.netlify.app` |

> Wichtig (SPA): `404.html = index.html` und `.nojekyll` setzen. Der
> GitHub-Workflow macht das automatisch; bei Netlify einen Redirect
> `/*  /index.html  200` setzen, bei Vercel `cleanUrls`/Rewrite auf `index.html`.

### GitHub Pages (Standard, schon aktiv)
`.github/workflows/deploy-web.yml` baut bei jedem Push und veröffentlicht nach
`gh-pages`. Der Modus wird **automatisch** gewählt:
- Secrets `EXPO_PUBLIC_SUPABASE_URL` **und** `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  gesetzt → **Real-Modus** (echte Nutzer).
- sonst → **Demo-Modus**.

---

## 2. ENV-Variablen – wo eintragen?

Nur den **anon/public**-Key verwenden (niemals `service_role`).

### GitHub (für den Pages-Deploy)
Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Name | Wert |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://<DEIN-REF>.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `<anon public key>` |

Danach einen Commit pushen oder den Workflow manuell starten
(**Actions → Deploy Web Preview → Run workflow**).

### Vercel / Netlify
Project Settings → **Environment Variables**:

```
EXPO_PUBLIC_DEMO_MODE=false
EXPO_PUBLIC_SUPABASE_URL=https://<DEIN-REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_INVITE_BASE_URL=https://<deine-domain>/invite
```

### Lokal (`.env`)
```
EXPO_PUBLIC_DEMO_MODE=false
EXPO_PUBLIC_SUPABASE_URL=https://<DEIN-REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

---

## 3. Supabase Redirect URLs (Google-Login)

**Authentication → URL Configuration**

- **Site URL:** `https://lamorstudios.github.io/FOREVERLY/`
- **Redirect URLs** (alle relevanten hinzufügen):

| Umgebung | URL |
|----------|-----|
| Lokale Entwicklung | `http://localhost:8081/` |
| Web Preview (GitHub Pages) | `https://lamorstudios.github.io/FOREVERLY/` |
| Live Domain (Vercel/Netlify/eigene) | `https://<deine-domain>/` |
| App (nativ, später) | `foreverly://` |

**Google Cloud Console** (OAuth-Client, Web): autorisierte Redirect-URI
`https://<DEIN-REF>.supabase.co/auth/v1/callback`.

---

## 4. Live-Test-Flow (für dich / Beta-Tester)

1. **App öffnen:** Live-URL aufrufen (oder Inkognito-Fenster für sauberen Start).
2. **Mit Google anmelden:** „Mit Google fortfahren" → Google-Dialog → zurück;
   Profil mit Name & Bild wird automatisch erstellt.
3. **Familie erstellen:** Onboarding → „Familie erstellen" → Name eingeben.
   Du wirst Admin **und** erste Person im Stammbaum.
4. **Familienmitglied einladen:** Start/Familie/Profil → „+ Familienmitglied
   einladen" → Beziehung & Nähe wählen → Link erstellen → teilen/kopieren.
5. **Einladungslink öffnen:** Link in zweitem Browser/Inkognito öffnen →
   „Mit Google fortfahren" (anderes Konto).
6. **Zweiter Nutzer tritt bei:** Beitritt mit vorausgefülltem Code →
   „Beitreten".
7. **Familienbaum prüfen:** Tab „Familie" → die neue Person erscheint mit der
   gewählten Beziehung (+ Beziehungsvorschlag) – bei **beiden** Konten sichtbar.

Troubleshooting (redirect_uri_mismatch, Logout nach Redirect, leere Daten):
siehe `supabase/SUPABASE_SETUP.md` → Abschnitt 6.

---

## 5. Demo-Modus bleibt getrennt

- Ohne gesetzte Supabase-Secrets bleibt die öffentliche Seite im **Demo-Modus**
  (Beispieldaten, keine DB-Schreibzugriffe).
- Mit Secrets → **echte Nutzer**; Demo- und Echtdaten werden nie vermischt.
- Sichtbar: Im Demo-Modus erscheint der „Demo-Modus"-Hinweis; in der Beta
  zusätzlich der schließbare **Beta-Hinweis**.

---

## 6. Link für erste Tester

- **Demo (jetzt sofort, ohne Konto):**
  `https://lamorstudios.github.io/FOREVERLY/`
- **Echte Beta** (nach Setzen der zwei GitHub-Secrets + erneutem Deploy):
  dieselbe URL `https://lamorstudios.github.io/FOREVERLY/` – dann mit echtem
  Google-Login und gespeicherten Daten.

Beispiel-Nachricht an Tester:
> Teste Foreverly (Beta): https://lamorstudios.github.io/FOREVERLY/
> Melde dich mit Google an, erstelle deine Familie und lade jemanden ein.
> Es ist eine frühe Beta – Feedback willkommen! 💛
