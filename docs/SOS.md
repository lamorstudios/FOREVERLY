# SOS-Funktion – Prüfbericht & minimale funktionierende Version

Es gibt zwei SOS-Oberflächen:
- **SOS** (`Sos`, `src/screens/safety/SosScreen.tsx`) – der primäre Notruf.
- **Notfall** (`Emergency`, `src/screens/phase2/EmergencyScreen.tsx`) – großer
  SOS-Knopf + Notfallkontaktverwaltung.

## Prüfergebnis (vorher)

| # | Punkt | Status |
|---|-------|--------|
| 1 | SOS-Button reagiert auf Klick | ✅ Ja |
| 2 | Bestätigungsdialog | ✅ Ja (`Alert.alert`) |
| 3 | Countdown vor dem Versenden | ❌ Nein |
| 4 | Standort wird ermittelt | ⚠️ Nur Platzhalter (kein echtes GPS) |
| 5 | Vertrauenspersonen werden benachrichtigt | ⚠️ Teilweise (1 In-App-Eintrag, nicht pro Person) |
| 6 | Push-Benachrichtigung | ❌ Nein (nur In-App-Feed) |
| 7 | SOS-Ereignis wird gespeichert | ✅ Ja (`safety_alerts` bzw. Demo-Store) |
| 8 | Optionale Nachricht wird mitgesendet | ✅ Ja (gespeichert & im Verlauf sichtbar) |

### Was bereits funktioniert
- Klick, Bestätigungsdialog, **Speichern** des SOS-Ereignisses (Demo-Store und
  Supabase-Tabelle `safety_alerts`), **optionale Nachricht** wird mitgespeichert
  und im Verlauf angezeigt, **Entwarnung** (resolve), Verlaufsliste.
- Es wird ein **In-App-Eintrag** im Familien-Benachrichtigungsfeed erzeugt
  (`demoStore.triggerSos` → `notifications`).

### Was nur Demo/UI war
- **Standort**: kein echtes GPS. `SosScreen` nutzt das letzte bekannte
  `place_label`; `EmergencyScreen` nutzt feste Demo-Koordinaten (Lübeck).
  `expo-location` ist nicht installiert.
- **Empfänger**: Die Liste „Wer wird benachrichtigt?" war statischer Text
  (Kategorien), keine konkreten Personen; es erfolgte nur ein einzelner
  Feed-Eintrag statt einer Zustellung pro Kontakt.
- **Akkustand**: Zufallswert.

### Was noch fehlt (für echten Produktivbetrieb)
- Echtes GPS (`expo-location`, Berechtigungen).
- Echte Push-Zustellung pro Empfänger (Server-Push via `expo-notifications` /
  Supabase Edge Function) – `expo-notifications` ist installiert, wird aber nur
  für Zeitkapsel-Erinnerungen genutzt, nicht für SOS.

## Umgesetzte minimale funktionierende Version (`SosScreen`)

Ablauf jetzt:

1. **SOS drücken** → großer Button.
2. **Bestätigungsdialog** („Countdown starten").
3. **10-Sekunden-Countdown** mit sichtbarem Zähler, Button **„Abbrechen"** und
   **„Jetzt sofort senden"** (Abbruch jederzeit möglich – wichtige Sicherheits-UX).
4. Nach Ablauf (oder „sofort senden") wird das **SOS-Ereignis erzeugt**
   (`triggerSos` → gespeichert, mit optionaler Nachricht + Standort-Label + Akku).
5. **Vertrauenspersonen werden angezeigt**: konkrete Namen aus Notfallkontakten
   und Vertrauenspersonen (Trusted Circle) – sowohl vorab („Wer wird
   benachrichtigt?") als auch in der Erfolgsmeldung.
6. **Erfolgsmeldung**: „SOS wurde gesendet" inkl. Liste der benachrichtigten
   Personen; danach **Entwarnung** möglich.

Hinweis: Standort (letztes bekanntes Label) und Zustellung sind weiterhin im
Demo-Rahmen (kein echtes GPS/Push) – die Funktion, der Countdown, die
Ereignis-Erzeugung, die Empfängerermittlung und die Erfolgsmeldung sind jedoch
echt umgesetzt und arbeiten mit den real hinterlegten Kontakten.
