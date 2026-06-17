# FAMII – Preis- & Speichermodell

**Stand:** 2026-06-16 · **Status:** FAMII ist aktuell **vollständig kostenlos**.

FAMII soll sich für Nutzer als kostenlose Familienplattform anfühlen: keine
gesperrten Features, keine Kaufaufforderungen, keine Preiswerbung im
Vordergrund. Der einzige spätere Upgrade-Grund ist **zusätzlicher Speicher**.

---

## Kostenlos enthalten (Free)

Alle Funktionen sind im kostenlosen Tarif enthalten – ohne Einschränkung:

- Familienbaum
- Erinnerungen
- Zeitkapseln
- Familienbuch
- Dokumente
- Familienhistoriker
- Familienkarte
- Einladungen
- Benachrichtigungen
- Vertrauenspersonen
- Nachlassfunktionen
- Onboarding
- **Alle zukünftigen Standardfunktionen**

Es gibt **keine künstlichen Limits außer Speicher**. Familienmitglieder sind
unbegrenzt.

---

## Kostenloser Speicher

| Wert | Größe |
|------|-------|
| Kostenloser Speicher (Free) | **5 GB pro Familie** |

Konstante: `FREE_STORAGE_GB` in `src/lib/billing.ts`.

---

## Speicherlimit & Upgrade-Auslöser

- Solange eine Familie unter dem Limit liegt, passiert **nichts** – keine
  Hinweise, keine Werbung.
- **Upgrade-Auslöser:** erst wenn eine Familie das kostenlose Speicherlimit
  **erreicht**, erscheint ein freundlicher Hinweis (keine harte Paywall):

  > **Eure Familiengeschichte wächst ❤️**
  >
  > Ihr habt euren kostenlosen Speicherplatz genutzt.
  >
  > Für zusätzlichen Speicher könnt ihr FAMII Plus freischalten.

  Text-Konstante: `STORAGE_LIMIT_NOTICE` in `src/lib/billing.ts`.
  Logik: `limitStatus(used, limit).reached` steuert die Anzeige.

Technisch vorbereitet (`limitStatus`, `LIMIT_WARN_RATIO`), aber bewusst
zurückhaltend: Im Demo-Betrieb liegt der simulierte Speicherstand deutlich
unter dem Limit, damit sich die App kostenlos und unbeschränkt anfühlt.

---

## FAMII Plus (zusätzlicher Speicher)

| | |
|---|---|
| Preis | **0,99 € / Monat** oder **9,99 € / Jahr** |
| Geltung | **pro Familie** – nicht pro Person |
| Inhalt | deutlich mehr Speicher für Fotos, Videos & Dokumente |
| Funktionen | identisch zu Free (keine zusätzlichen gesperrten Features) |

Eine Person zahlt, die ganze Familie profitiert. FAMII Plus wird **nicht aktiv
beworben** und nicht in den Vordergrund gestellt – es erscheint nur als Option
für mehr Speicher (Speicher-Seite und Limit-Hinweis).

---

## Zukünftige Preisstruktur

Die Tarifdaten in `src/lib/billing.ts` (`BILLING_TIERS`) und
`src/lib/premium.ts` (`PLANS`) sind bereits dreistufig angelegt, damit eine
spätere Monetarisierung ohne Strukturumbau möglich ist:

| Tarif | Preis / Monat | Preis / Jahr | Speicher | Mitglieder | Aktueller Status |
|-------|---------------|--------------|----------|------------|------------------|
| Free | 0 € | – | 5 GB | unbegrenzt | aktiv |
| **Plus** | **0,99 €** | **9,99 €** | 50 GB | unbegrenzt | Option für mehr Speicher |
| Premium | 9,99 € | 99 € | 500 GB | unbegrenzt | **nicht beworben** (nur Datenmodell) |

- Abwicklung später über **App Store / Google Play** bzw. Stripe; aktuell
  schaltet die Demo den Tarif nur lokal um (`PremiumContext`).
- `hasFeature()` gibt aktuell **immer `true`** zurück – es ist nie eine Funktion
  gesperrt. Wird erst relevant, falls künftig Premium-Extras eingeführt werden.
- Premium bleibt in den Daten erhalten (u. a. für Admin-/Umsatz-KPIs), wird in
  der Nutzer-Oberfläche aber nicht angezeigt.

---

## Wo im Code

| Thema | Ort |
|-------|-----|
| Tarife, Preise, Speicher-Limit, Limit-Hinweis | `src/lib/billing.ts` |
| Tarif-Anzeigedaten (Free/Plus/Premium) | `src/lib/premium.ts` |
| Tarif-Zustand & Feature-Freischaltung | `src/context/PremiumContext.tsx` |
| Speicher-Seite (Free-first, Plus nur als Speicheroption) | `src/screens/settings/PremiumScreen.tsx` |
| Einstellungen-Eintrag „Speicher" (keine Preiswerbung) | `src/screens/settings/SettingsScreen.tsx` |
