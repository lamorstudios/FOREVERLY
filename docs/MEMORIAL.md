# FAMII – Ehrenmitglieder & Familienerbe

Verstorbene und besonders bedeutsame Familienmitglieder bleiben in FAMII
sichtbar und werden **respektvoll** bewahrt – kein Trauerbereich, sondern
Bewahrung der Familiengeschichte über Generationen hinweg.

---

## Neue Profilart: „Familienerbe" (Ehrenmitglied)

Jede Person kann als **Familienerbe** gekennzeichnet werden (`is_memorial`).
Verstorbene Angehörige (mit Sterbedatum) sind im Demo-Datensatz automatisch
Familienerbe-Profile. Es ist eine zusätzliche Kennzeichnung einer bestehenden
Person – kein separater Datensatztyp – und lässt sich jederzeit über das
Personen-Formular umschalten.

So können auch Uroma, Uropa, Urgroßeltern und Ururgroßeltern Teil der
Familiengeschichte bleiben.

### Profilkopf

```
Anna Müller
1928 – 2014
❤️ Familienerbe
```

Darunter: Galerie · Erinnerungen · Zitate · Lebensgeschichte · Besonderheiten ·
Zeitstrahl.

---

## Neue Datenstruktur

`src/types/models.ts`

- **`Person.is_memorial?: boolean`** – Kennzeichnung als Familienerbe.
- **`Person.traits?: string | null`** – Besonderheiten der Person.
- **`PersonQuote`** – ein oft gesagter Satz:
  `{ id, family_id, person_id, text, context, added_by_user_id, added_by_name, created_at }`
- **`PersonTribute`** – eine hinterlassene Erinnerung:
  `{ id, family_id, person_id, text, author_user_id, author_name, created_at }`

Die **Galerie** nutzt das bestehende Foto-System (`Photo` mit `person_id` und
`uploaded_by`) – keine neue Tabelle nötig.

Datenzugriff: `src/api/memorial.ts` (`setMemorial`, `listQuotes`, `addQuote`,
`deleteQuote`, `listTributes`, `addTribute`, `deleteTribute`, `uploaderName`).
Demo-Implementierung in `src/demo/store.ts`, Seed-Daten in
`src/demo/demoData.ts` (`quotes`, `tributes`, Galerie-Fotos, Besonderheiten).

---

## Galerie-System

- Fotos werden je Person gespeichert (`person_id`) und beim Hochladen mit dem
  Uploader verknüpft (`uploaded_by`).
- Jeder Eintrag zeigt **„Hochgeladen von …"** (z. B. „Hochgeladen von
  Nick Mielke"), damit nachvollziehbar bleibt, wer Inhalte beigetragen hat.
- Neue Fotos werden über die bestehende Bildauswahl hinzugefügt
  (`useImagePicker` → `uploadPhoto`).

---

## Zitat-System

- Eigener Bereich **„Was sie oft gesagt hat"**.
- Jedes Zitat: Text, optionaler Anlass/Kontext und **„Hinzugefügt von …"**.

  > „Wer rastet, der rostet."
  > sagte er jeden Morgen vor der Arbeit
  > *Hinzugefügt von Oma Erika*

- Familienmitglieder können direkt im Profil neue Zitate hinzufügen.

---

## Erinnerungen an die Person

- Eigener Bereich **„Erinnerungen an diese Person"**.
- Familienmitglieder hinterlassen Geschichten („Ich erinnere mich noch daran,
  wie …"); jede Erinnerung zeigt den **Autor**.

---

## Familienbaum-Darstellung

`src/screens/family/FamilyTreeView.tsx`

- Verstorbene bzw. als Familienerbe markierte Personen bleiben im Familienbaum
  sichtbar.
- Kennzeichnung durch ein **dezentes, respektvolles Stern-Symbol** (kleine
  goldene Plakette oben rechts am Kreis) – ausdrücklich **kein Trauersymbol**.

---

## Navigation & Einstieg

- Neue Route **`MemorialProfile`** (FamilyStack), Titel „Familienerbe".
- Im normalen Personenprofil erscheint bei Familienerbe-Profilen ein Badge
  **„❤️ Familienerbe"** sowie der Button **„Familienerbe-Profil öffnen"**.
- Im Personen-Formular schaltet ein Schalter **„❤️ Familienerbe"** die
  Kennzeichnung um und blendet das Feld **„Besonderheiten"** ein.

---

## Wichtig

Nicht als Trauerbereich gestaltet, sondern als **Bewahrung von
Familiengeschichte** – warm, respektvoll und generationenübergreifend.

Keine bestehenden Funktionen wurden entfernt oder verändert; die Farbwelt
bleibt unverändert.
