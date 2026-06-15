# Foreverly – Design System 2.0

Ein ruhiges, hochwertiges und emotionales Designsystem. Leitbild: *modern,
minimalistisch, warm, vertrauenswürdig* – im Geist von Apple, Notion,
Airbnb, Headspace, Arc und Linear. Die Familie steht im Mittelpunkt, nicht
die Verwaltung.

Alle Tokens liegen unter `src/theme` und werden über `@/theme` importiert.
Screens und Komponenten sollen **ausschließlich** diese Tokens verwenden –
keine hartkodierten Farben, Größen oder Schatten.

---

## 1. Farbwelt (`src/theme/colors.ts`)

Helle, warme Cremetöne als Basis, dezentes Gold/Bronze als Akzent. Bewusst
weniger Braun, mehr Luft.

| Token | Wert | Einsatz |
|---|---|---|
| `background` | `#FAF7F2` | App-Hintergrund (warmes Cremeweiß) |
| `surface` | `#FFFFFF` | Karten, Flächen |
| `surfaceAlt` | `#F4EFE7` | sekundäre Flächen, Strips |
| `surfaceMuted` | `#EFE8DC` | Felder, Chips |
| `warmWhite` | `#FFFDF9` | hervorgehobene Flächen |
| `textPrimary` | `#2B2620` | warmes Anthrazit (kein Braun) |
| `textSecondary` | `#6E6557` | Fließtext sekundär |
| `textMuted` | `#A69C8C` | Metadaten |
| `primary` | `#BE8A4E` | warmes Bronze-Gold (Hauptakzent) |
| `primaryDark` | `#9A6B38` | Druck/aktiv |
| `gold` / `goldSoft` | `#D4A95C` / `#F4E8CC` | Highlights, Emotion |
| `bronze` | `#A9763F` | sekundärer Akzent |
| `success` / `error` / `warning` | `#5E9C7B` / `#C25B52` / `#D6A24A` | Status |
| `relationBiological/Married/Patchwork/Adoption` | grün/blau/gelb/lila | Stammbaum-Verbindungen |
| `border` / `borderStrong` / `divider` | sehr helle Sandtöne | Ränder |

Helfer: `withAlpha(hex, alpha)` für sanfte Tönungen (z. B. Icon-Hintergründe).

## 2. Typografie (`src/theme/typography.ts`)

Klare Hierarchie mit großen, etwas enger laufenden Überschriften
(negatives `letterSpacing`) und ruhig lesbaren Texten.

| Variante | Größe / Zeilenhöhe | Gewicht | letterSpacing |
|---|---|---|---|
| `display` | 40 / 46 | 800 | −0.6 |
| `title` | 32 / 38 | 700 | −0.5 |
| `heading` | 26 / 32 | 700 | −0.4 |
| `subheading` | 21 / 28 | 600 | −0.2 |
| `body` / `bodyStrong` | 17 / 26 | 400 / 600 | 0 |
| `label` | 15 / 20 | 600 | 0.1 |
| `caption` | 13.5 / 18 | 500 | 0.1 |
| `button` | 17 / 22 | 700 | 0.2 |

`AppText` skaliert Größen responsiv (`fontScale`) und übernimmt
`letterSpacing` automatisch.

## 3. Spacing & Radius (`src/theme/spacing.ts`)

- Spacing: `xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 48`
- Radius: `sm 8 · md 14 · lg 22 · xl 30 · pill 999`
- Karten nutzen `radius.xl`, Buttons `radius.pill`.

## 4. Schatten (`src/theme/index.ts → shadow`)

Weich und großzügig (kein harter „Material"-Look):

- `soft` – y2, opacity 0.05, radius 10
- `card` – y8, opacity 0.08, radius 24
- `floating` – y16, opacity 0.12, radius 36

## 5. Komponenten

- **Card** – `radius.xl`, weicher `shadow.card`, dezente Press-/Hover-
  Skalierung (Animated).
- **Button** – Pillform (`radius.pill`), Varianten primary/secondary/ghost/
  danger, weiche Press-Animation.
- **Avatar** – runder Platzhalter mit Initialen, weiche Tönung
  (`withAlpha(primary)`) und goldener Rand.
- **Appear** – Einblend-Animation (Fade + leichtes Aufsteigen) zum sanften,
  gestaffelten Erscheinen von Inhalten.
- **Chip / SectionHeader / EmptyState / Loading / Screen** – nutzen dieselben
  Tokens.

## 6. Microanimationen

- Karten/Buttons: Press-Skalierung (`scale 0.97`) + Web-Hover (`scale 1.01`).
- Inhalte: gestaffeltes `Appear` (Verzögerung 80–320 ms).
- Stammbaum: Spring-basiertes Zoomen/Fokussieren, weiche Bézier-Linien.

## 7. Stammbaum / „Familienwelt"

Konzept: **interaktive Familienwelt aus Sicht des Nutzers** (Apple Maps /
Notion / Arc) – ausdrücklich **kein Stammbaum**. Die aktive Person steht
**immer exakt im Zentrum**; Angehörige werden semantisch um sie herum auf
einem **Raster** angeordnet (eigene Zellen ⇒ **keine Überschneidungen** von
Kreisen oder Texten):

- **Oben:** Mutter (links) / Vater (rechts); **darüber** die jeweiligen
  Großeltern; **daneben** Tante/Onkel der jeweiligen Seite.
- **Links:** Schwestern/Stief-/Halbschwestern · **Rechts:** Brüder.
- **Unten:** eigene Kinder (darunter Enkel).
- **Weiter außen, ausgegraut** (kleiner, transparenter, farbärmer): Cousins,
  Schwager, angeheiratete & entfernte Verwandte – „es gibt noch mehr Familie".

Interaktion: ein Tipp holt eine Person ins Zentrum (Graph baut sich animiert
neu auf), zweiter Tipp öffnet das Profil, **langes Halten** nimmt einen Kreis
auf und verschiebt ihn frei (Linien folgen live). Neue Kreise **poppen
versetzt herein**, Linien wachsen mit, die Kamera gleitet weich. Optik:
**Glassmorphism** (durchscheinende Kreise, weiche Schatten, farbiger Glow je
Beziehungsart). Eine **Legende als Chips** (🟢🔵🟡🟣) ist dauerhaft sichtbar.

- **Erster Tipp** auf einen Kreis macht ihn zum neuen Zentrum: die Kamera
  zentriert sanft, neue Kreise **wachsen aus dem Hub heraus**, die
  Verbindungslinien **wachsen mit** (an die animierten Positionen gebunden),
  bestehende Kreise gleiten an ihren neuen Platz.
- **Zweiter Tipp** auf die bereits zentrierte Person öffnet ihr **Profil**
  (Fotos, Erinnerungen, Audios, Zeitkapseln).
- Kreis = Foto + Vorname + Beziehung (relativ zum Hub). Eingeloggte Person:
  goldener Glow-Puls + „Du"-Badge. Doppeltipp/„Locate"-Button zentriert auf
  mich. Ziehen = verschieben, Pinch/Buttons = Zoom.
- Linien & Ringe sind nach Beziehungskategorie eingefärbt (grün/blau/gelb/
  lila). Ziel: lebendige Familienwelt zum Erkunden.

## 9. Bereichs-Tönungen

Sehr dezente Hintergrund-Tönungen je App-Bereich zur Orientierung
(seniorenfreundlich) – über `tint`-Prop von `Screen`:

- Startseite: warmes Beige (`tintHome`)
- Familienwelt: leichtes Blau (`tintFamily`)
- Erinnerungen: warmes Gold (`tintMemories`)
- Zeitkapseln: sanftes Violett (`tintCapsules`)
- Historiker: dezentes Grün (`tintHistorian`)

## 8. Leitfrage

Für jeden Screen gilt: *„Würde diese Ansicht neben Apple, Notion oder
Airbnb bestehen?"* – wenn nein, weiter verfeinern.
