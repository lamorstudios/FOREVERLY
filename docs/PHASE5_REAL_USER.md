# Phase 5 – Real User System (Status & Audit)

Ziel: FAMII von der MVP-Demo zur Testversion für die ersten 5–10 echten
Familien. Fokus: Stabilität, Nutzbarkeit, echte (persistente) Daten – keine
großen neuen Features.

## Wichtigster Fortschritt: Daten bleiben nach Reload erhalten

Der Datenspeicher (Demo-/Testmodus) wird im **Web automatisch in
`localStorage`** gesichert und beim Start wiederhergestellt (`famii.demo.v2`).
Profil, Familienbaum, Erinnerungen, Galerie, Dokumente, Zitate, Ehrenmitglieder
usw. **verschwinden nach einem Reload nicht mehr** (verifiziert: nach dem Laden
liegen ~109 KB Daten im Storage).

- Zurücksetzen: `resetDemoData()` löscht auch den persistenten Stand.
- Grenze: Sehr große Foto-Uploads (Base64) können das `localStorage`-Limit
  (~5 MB) erreichen; das Speichern ist fehlertolerant. Für dauerhaft große
  Mediendaten ist später Supabase Storage nötig.
- Auf nativen Geräten ohne `localStorage` bleibt es In-Memory.

## Wichtigster Bugfix: „Buttons ohne Funktion" im Web

Ursache: `Alert.alert(...)` mit mehreren Buttons löst im Web die Callbacks
**nicht** aus – Bestätigungsdialoge wirkten „tot". Neu: `src/lib/confirm.ts`
(`confirmAsync` / `notify`) nutzt im Web `window.confirm`/`window.alert`, nativ
weiterhin `Alert`. Migriert wurden die testkritischen Bestätigungen:

- Mitglied entfernen / Rolle ändern (`MembersScreen`)
- Person/Ehrenmitglied löschen (`PersonFormScreen`)
- Dokument-Eintrag löschen (`DocumentsScreen`)
- Foto löschen (`PhotoGalleryScreen`)
- Erinnerung löschen (`MemoryDetailScreen`)
- Notfallkontakt löschen (`EmergencyScreen`)
- SOS- & Notfall-Auslöser (bereits zuvor auf In-Screen-Dialog/Modal umgestellt)

---

## 1. Familien-Einladungen

| Punkt | Status |
|-------|--------|
| Mitglied einladen (Smart Invite, Code) | ✅ funktioniert (Code wird erzeugt, Rolle gespeichert) |
| Einladung annehmen | ✅ Smart-Invite-Annahme (Demo) verknüpft Person + legt Beziehung an |
| Mitglied erscheint im Familienbaum | ✅ bei Smart Invite (Beziehung wird angelegt) |
| Rollen gespeichert | ✅ (`role` admin/member, in `MembersScreen` änderbar) |
| Berechtigungen | ✅ `isAdmin` steuert Aktionen (z. B. Rollen/Code) |
| Bugfix | Rollen-/Entfernen-Dialog war im Web tot → behoben |

Hinweis: Echte E-Mail-Einladung an Fremde erfordert Supabase/Auth (siehe „Demo").

## 2. Ehrenmitglieder (Familienerbe) – fertiggestellt

| Funktion | Status |
|----------|--------|
| Button „Ehrenmitglied hinzufügen" (Familienbereich, Baum & Liste) | ✅ sichtbar |
| Profil anlegen (Name, Beziehung, Geburts-/Sterbedatum, Beschreibung) | ✅ |
| Beziehung wird angelegt → **im Familienbaum sichtbar** (mit Stern-Symbol) | ✅ |
| Fotos hochladen / Galerie | ✅ (Galerie mit „Hochgeladen von …") |
| Erinnerungen speichern | ✅ |
| Zitate speichern | ✅ |
| Persistenz nach Reload | ✅ (neu) |

## 3. Benachrichtigungen (In-App Notification Center)

| Flow | Status |
|------|--------|
| Einladung erhalten | ✅ In-App (bei Smart-Invite/Statusereignissen) |
| Erinnerung/Status erhalten | ✅ In-App |
| Zeitkapsel geöffnet | ⚠️ lokale Push-Erinnerung (nativ) + Status im Detail; In-App-Eintrag folgt |
| Dokument geteilt / Familienbuch erstellt | ⚠️ als Aktivität sichtbar, nicht als eigener Notification-Eintrag |
| SOS gesendet | ✅ In-App (Sender + Vertrauenspersonen) |
| Tap auf Notification → Zielscreen | ✅ (`data.route` / Tab-Navigation) |

Mindestziel „als In-App-Notification sichtbar" ist für die zentralen Flows
erfüllt; einzelne (Zeitkapsel/Buch/Dokument) sind derzeit als Aktivität statt
als Notification hinterlegt.

## 4. Datei- & Foto-Uploads

| Punkt | Status |
|-------|--------|
| Fotos hochladen / anzeigen / Galerie | ✅ (Auswahl via Bildpicker, Anzeige, Löschen web-tauglich) |
| Dokumente speichern / wieder öffnen | ✅ (Hinweise/Orte; Detail erneut aufrufbar) |
| Persistenz nach Reload | ✅ Metadaten/Texte; ⚠️ per `blob:`-URL gewählte Bilder können nach Reload nicht mehr laden (Browser-Objekt-URL). Für dauerhafte Bilddateien → Supabase Storage. |

## 5. Datenspeicherung nach Reload

| Bereich | Bleibt nach Reload? |
|---------|---------------------|
| Profil | ✅ |
| Erinnerungen | ✅ |
| Dokumente | ✅ |
| Galerie (Metadaten/Seed-Bilder) | ✅ (Detailbild aus `blob:`-Upload ggf. nicht) |
| Familienbaum (Personen + Beziehungen) | ✅ |

## 6. Rechtliches

| Punkt | Status |
|-------|--------|
| Impressum (Firmenname **Lamor Studios**) | ✅ vorhanden (`legalContent.ts`, `LegalScreen`) – Adresse als `[Platzhalter]` noch einzutragen |
| Datenschutz-Seite | ✅ vorhanden |
| AGB-Seite | ✅ vorhanden |
| Einwilligung beim Registrieren | ✅ **neu**: Pflicht-Checkbox (AGB + Datenschutz), Button erst dann aktiv |
| Cookie-Hinweis | ℹ️ nicht nötig: keine Tracking-Cookies; nur technisch notwendige lokale Speicherung |

To-do vor Echtbetrieb: echte Anschrift im Impressum eintragen.

## 7. Mobile-/Darstellungs-Fehler

| Punkt | Status |
|-------|--------|
| Abgeschnittene Texte | ✅ Listen-Lesbarkeit zuvor behoben (`minWidth:0`, `numberOfLines=2`) |
| Buttons ohne Funktion | ✅ web-tote Bestätigungsdialoge behoben (siehe oben) |
| Überlappende Elemente / Scroll | ✅ keine bekannten Fälle offen |
| Android-Darstellung | ⚠️ nur im Web-Render verifiziert; nativer Android-Test steht aus |

## 8. Testfamilien-Modus

- App ist im Demo-/Testmodus **persistent** und ohne Login nutzbar – ideal für
  5–10 Testfamilien, um echtes Feedback zu sammeln.
- Kein öffentlicher Launch, keine Werbung.
- Jede Testfamilie arbeitet aktuell mit derselben lokalen Beispiel-Familie
  („Mielke") als Startpunkt; Eingaben bleiben pro Gerät erhalten.

---

## Zusammenfassung

**Vollständig funktionsfähig (Test-tauglich):** Familienbaum, Ehrenmitglieder
(Profil/Galerie/Zitate/Erinnerungen), Erinnerungen, Dokumente (Hinweise),
Benachrichtigungscenter (zentrale Flows), SOS/Notfall, Rollen/Berechtigungen,
**Datenpersistenz nach Reload**, Registrierungs-Einwilligung, Rechtstexte.

**Noch Demo/simuliert:** echte Server-Persistenz & Auth (Supabase),
E-Mail-Einladungen an Fremde, echtes Push (FCM/APNs), echtes GPS, dauerhafte
Speicherung großer Bilddateien (Supabase Storage), einzelne Notification-Typen
(Zeitkapsel/Buch/Dokument als eigene Notification).

**Produktionsreif:** UI/Navigation, Markenauftritt, Rechtstexte-Struktur,
Lesbarkeit, web-taugliche Dialoge, lokale Persistenz für Testbetrieb.

**Behobene Bugs in dieser Phase:** web-tote Bestätigungsdialoge (Mitglieder,
Person/Ehrenmitglied, Dokument, Foto, Erinnerung, Notfallkontakt); fehlende
Datenpersistenz nach Reload; fehlende Einwilligung bei der Registrierung.

**Nächster großer Schritt (separat):** Umschalten auf Supabase (Auth + DB +
Storage + RLS) für geräteübergreifende echte Daten und echte Einladungen/Push.
