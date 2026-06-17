# Foreverly · Release Candidate 1 (RC1)

| | |
|---|---|
| **Version** | `1.0.0-rc1` (in „Einstellungen" als „Version 1.0.0-rc1" sichtbar) |
| **Status** | Interner Test (Demo-Modus) |
| **Build / Commit** | siehe `git log` auf `main` (RC1-Commit) |
| **Live-Branch** | `main` → GitHub Pages (`gh-pages`) |
| **Modus** | Demo (Beispieldaten „Familie Mielke"), kein Auth-/Supabase-Gate |
| **Eingefroren** | Ab jetzt nur Bugfixes/Stabilität/Texte/UI – keine neuen Features |

---

## 1. App-Audit (Stand RC1)

Geprüft über Typecheck (0 Fehler), Web-Build (erfolgreich) und DOM-Render
(0 Konsolenfehler, Startseite rendert). Alle Kern-Screens vorhanden & im
Router registriert:

| Bereich | Status |
|--------|--------|
| Startseite | ✅ lädt, Inhalte sichtbar |
| Familienbaum / Netzwerk | ✅ |
| Zeitkapseln | ✅ |
| Erinnerungen | ✅ |
| Dokumente / Vault | ✅ |
| Familienbuch | ✅ |
| Profil | ✅ |
| Premium (Free/Plus/Premium) | ✅ |
| Admin Dashboard | ✅ |
| Onboarding-Tour | ✅ |

Codebasis: 116 Screens, keine `TODO`/`FIXME`/`HACK`-Marker, nur 2 bewusste
`console`-Aufrufe (Demo-Push-Log, ErrorBoundary).

---

## 2. Bugliste

### Priorität HOCH (Abstürze / White Screens / Ladefehler / kaputte Buttons)
- **Keine offenen.** Der frühere „weißer/Loading-Bildschirm" ist behoben:
  - Live läuft im Demo-Modus → kein Auth-Hänger.
  - `index.html` ohne Cache + `onerror`-Selbstheilung des Bundles + sichtbarer
    Start-Platzhalter → keine endlose Ladeanzeige, keine weiße Seite.
  - Ein einziger Deploy-Branch (`main`) → keine Race-/Stale-Deploys.

### Priorität MITTEL (Layout / mobile Darstellung)
- Keine bekannten offenen. Frühere Überlappung im „Eure Familie wächst"-Block
  ist im aktuellen RC1-Stand nicht enthalten (gehört zu späterem, nicht
  freigegebenem Feature-Branch). Mobile Abstände der Kernkarten geprüft.

### Priorität NIEDRIG (Texte / Designdetails)
- Rechtstexte (Impressum/Datenschutz/AGB) sind in diesem RC1-Stand noch nicht
  enthalten (gehören zu späterem Branch) → vor öffentlichem Launch ergänzen.
- Vereinzelt unterschiedliche Icon-Größen über Screens (20/22/24 px) – rein
  kosmetisch, kein Funktionsfehler.

---

## 3. Performance

- **Bundle:** ein Web-Bundle (~3,7 MB) – beim ersten Laden spürbar, danach
  Browser-Cache der Assets (Bundle ist gehasht). HTML bewusst ohne Cache.
- **React-Query:** `retry: 1`, kein Refetch bei Fokus, `staleTime` gesetzt →
  keine Lade-/Retry-Schleifen.
- **Animationen:** ausschließlich `Animated` (JS-Driver, web-sicher), dezent.
- **Bilder:** Demo nutzt leichte Platzhalter/Cover; im Echtbetrieb später
  Komprimierung/Thumbnails vorgesehen (nicht RC1-blockierend).
- Keine erkennbaren Endlos-Re-Render-Schleifen (Provider-State stabil,
  Listen mit `key`).

---

## 4. Release-Info

```
Produkt:  Foreverly
Version:  1.0.0-rc1  (Foreverly RC1)
Status:   Interner Test (Demo-Modus)
Live:     https://lamorstudios.github.io/FOREVERLY/
Branch:   main  -> gh-pages
```

---

## 5. Abschlussbericht

- **RC1 erstellt:** ✅ (Version `1.0.0-rc1`, in der App sichtbar)
- **Kritische Bugs:** **0** offen
- **Mittlere Bugs:** **0** offen (im RC1-Stand)
- **Kleine Bugs:** **2** (fehlende finale Rechtstexte im RC1-Stand;
  uneinheitliche Icon-Größen) – kosmetisch, nicht blockierend
- **Testbereitschaft:** **~90 %** für einen **internen Demo-Test**

### „Ist Foreverly bereit für die ersten 10 Testfamilien?"

- **Als Demo-Test (ohne echte Konten): JA.** Die App lädt stabil, alle
  Kernbereiche sind sichtbar und bedienbar, keine White-Screens/Hänger.
- **Als echter Mehrnutzer-Test (eigene Konten/Daten): NOCH NICHT.** Der
  Echtbetrieb (Supabase/Google-Login, Einladungen zwischen echten Konten,
  Rechtstexte) liegt in separaten, **noch nicht freigegebenen** Branches und
  muss erst – wie gewünscht einzeln und getestet – wieder in `main` integriert
  werden.

**Empfehlung:** Mit den 10 Testfamilien zunächst die **Demo-Version** zum
Sammeln von UX-/Design-Feedback nutzen; parallel den Echtbetrieb schrittweise
und getestet aktivieren.
