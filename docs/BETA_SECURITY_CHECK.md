# Schritt 11 – Beta-Sicherheitscheck

Geprüft vor der Einladung echter Familien. Keine neuen Features.

## 1. Account & Login
- **Registrierung / Login / Logout / Passwort-vergessen:** implementiert
  (`AuthContext` + Auth-Screens), inkl. Watchdog gegen Lade-Hänger. ✅
- **Kein fremder Zugriff auf andere Familien:** über Supabase **RLS** erzwungen
  (jede Tabelle, Helfer `is_family_member`/`is_family_admin`). ✅
- *Hinweis:* Login ist nur im **Echt-Modus** (Supabase) aktiv; im Demo-Modus
  bewusst ohne Login (Beispiel-Daten, kein Fremdzugriff möglich).

## 2. Familienrechte
- **Admin & Mitglied** sehen **nur die eigene** Familie (RLS über
  `family_members`). ✅
- **Vertrauensperson / Nachlass:** Zugriff erst nach bestätigter Freigabe
  (`EstateAudience`, Freigabe-Workflow); sieht nur freigegebene Inhalte. ✅
- **Ehrenmitglieder** korrekt sichtbar (Person + Galerie/Zitate/Erinnerungen),
  RLS familiengebunden. ✅

## 3. Datenschutz
- **Keine geheimen Keys im Frontend:** nur `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (öffentlich, RLS-geschützt). Geprüft: **kein** `service_role`/`sb_secret`/
  Secret im Code (nur ein Kommentar in `app.config.ts`, dass service_role NICHT
  hierher gehört). ✅
- **Supabase RLS aktiv** für alle 38 Tabellen. ✅
- **Nutzer sehen nur eigene Familiendaten** (RLS). ✅
- `.env` ist gitignored → Keys gelangen nicht ins Repo. ✅

## 4. Dokumente
- **Hinweis ergänzt** im Dokument-Formular: „Bitte keine Passwörter, PINs, TANs
  oder Zugangsdaten eintragen – nur Hinweise wie ‚Ordner liegt bei …'." ✅
  (Vault-Bereich hatte bereits den Hinweis „keine Passwörter, TANs, Bankzugänge
  oder Wallet-Seeds".)
- **Dokumente/Fotos nicht öffentlich:** Storage-Buckets sind **privat**; Zugriff
  nur über **signierte URLs** + Storage-RLS. ✅ (Im Demo-Modus liegen keine
  echten Dateien auf einem Server.)

## 5. SOS – klar als Beta markiert ✅
- Auf dem SOS-Bildschirm ergänzt: „**SOS befindet sich aktuell im Beta-Test:**
  Deine Familie wird in der App benachrichtigt. Verlasse dich im echten Notfall
  bitte zusätzlich auf den Notruf 112."
- Damit keine falsche Sicherheit: SOS erzeugt In-App-Benachrichtigungen (kein
  echtes Push/kein Notruf an Behörden); Standort ist „letzter bekannter".

## 6. Rechtliches ✅
- **Impressum, Datenschutz, AGB** vorhanden (`legalContent.ts`, `LegalScreen`,
  Footer-Links).
- **Betreiber: Lamor Studios, Inhaber Nick Mielke** hinterlegt.
- **Beta-Hinweis** im Footer: „FAMII befindet sich aktuell in der privaten Beta.
  Vielen Dank für euer Feedback."
- **Registrierungs-Einwilligung** (AGB + Datenschutz, DSGVO) vorhanden.
- *Offen (vor öffentlichem Launch):* echte Anschrift im Impressum (aktuell
  `[Platzhalter]`).

## 7. Ergebnis

### Beta sicher: **JA** (für private Beta mit 5 Familien)

**Kritische Risiken:** keine.
- Keine Secrets im Frontend, RLS aktiv, Familien-Isolation gegeben, Storage privat.

**Mittlere Risiken**
- RLS sollte vor dem Echt-Betrieb **mit ≥2 Konten praktisch gegengeprüft** werden
  (Skript `scripts/test_persistence.mjs` / Einladungstest) – Code/Policies sind
  korrekt, der Live-Gegentest steht noch aus.
- Impressum-**Anschrift** ist Platzhalter – vor öffentlichem (nicht-privatem)
  Launch eintragen.

**Kleine offene Punkte**
- E-Mail-Bestätigung in Supabase bewusst setzen (Test: aus / Echt: an).
- Passwort-Reset im Web (Redirect-URL) – natives Schema vorhanden.
- Gerätelokale Einstellungen (Tarif/Prefs/Einwilligung) später serverseitig.

### Empfehlung
**Bereit für 5 Testfamilien (private Beta).** Vor dem Start empfohlen: einmal den
RLS-Gegentest mit 2 Konten ausführen und die E-Mail-Bestätigung in Supabase
festlegen. Für einen **öffentlichen** Launch zusätzlich die Impressum-Anschrift
ergänzen.

## Verifiziert
- `tsc` fehlerfrei; Web-Render 0 Console-Errors.
- Kein `service_role`/Secret im Code; nur Anon-Key.
- Neue Sicherheits-Texte (SOS-Beta, Dokument-Hinweis) live im Build.
