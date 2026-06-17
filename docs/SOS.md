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

## Bugfix: „Button reagiert nicht" (Web)

**Ursache:** Der Bestätigungsdialog war ein natives `Alert.alert(...)` mit zwei
Buttons. Im Web (GitHub-Pages-Demo) löst React Native Web bei mehrstufigen
Alerts den `onPress` der Buttons **nicht** aus – beim Tippen passierte daher
„nichts". 

**Lösung:** Bestätigung, Countdown und Erfolgsmeldung sind jetzt **In-Screen-UI**
(echte Buttons im Bildschirm) statt nativer Alerts – funktioniert zuverlässig
auf Web, iOS und Android. Betrifft `SosScreen` **und** den großen SOS-Knopf in
`EmergencyScreen` (dort ebenfalls auf In-Screen-Bestätigung umgestellt).

## Was jetzt funktioniert

- **SOS-Button** reagiert mit sichtbarem Druck-Feedback (kein toter Button).
- **Sicherheitsabfrage** „SOS senden?" als In-Screen-Dialog (Abbrechen / SOS senden).
- **10-Sekunden-Countdown** mit Zähler + „Abbrechen" + „Jetzt sofort senden".
- **Abbrechen** funktioniert in jeder Phase.
- **SOS-Ereignis** wird gespeichert (`safety_alerts` / Demo): auslösender Nutzer,
  Zeitpunkt, optionale Nachricht, Standortstatus (place_label), Status (aktiv/gesendet).
- **Erfolgsmeldung** „SOS wurde gesendet." + „Deine Vertrauenspersonen wurden
  benachrichtigt." inkl. **Uhrzeit**, **Standortstatus** (letzter bekannter
  Standort / nicht verfügbar) und **benachrichtigte Kontakte** (namentlich).
- **Notification Center**: Es werden zwei In-App-Benachrichtigungen erzeugt:
  - Für den Sender: **„🚨 Dein SOS wurde gesendet."** → Antippen öffnet die
    SOS-Ansicht (`data.route = 'Sos'`).
  - Für die Familie/Vertrauenspersonen: **„🚨 SOS von [Name]. Standort und
    Uhrzeit sind verfügbar."**

## Was nur simuliert ist (Demo)

- **Standort**: kein echtes GPS – es wird der letzte bekannte Ortsname bzw.
  „Standort nicht verfügbar" angezeigt.
- **Zustellung**: In-App-Benachrichtigungen im Notification Center (kein echtes
  Push aufs Gerät). Empfänger werden namentlich aus Notfallkontakten +
  Vertrauenspersonen aufgelistet.
- **Akkustand**: simulierter Wert.

## Was für echte Push-Notifications noch fehlt

- Echtes GPS via `expo-location` (Berechtigungen, native Build).
- Server-Push pro Empfänger (Expo Push → FCM/APNs, z. B. via Supabase Edge
  Function), inkl. Speicherung der Geräte-Push-Tokens.

---

## Frühere minimale Version (Verlauf)

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
