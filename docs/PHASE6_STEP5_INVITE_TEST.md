# Phase 6 · Schritt 5 – Einladungsflow (Prüfung)

> **Hinweis:** Echte Live-Konten gegen dein Supabase-Projekt kann ich aus dieser
> Umgebung **nicht** durchklicken (Egress nur GitHub). Diese Prüfung ist eine
> **vollständige Code-/RPC-Verifikation** des gesamten Flows + ein exakter
> A/B-Testplan, den du ausführst. Befunde unten sind aus dem Code/SQL belegt.

## Flow im Detail (verifiziert)

| Schritt | Code/SQL | Ergebnis |
|---------|----------|----------|
| A registriert sich | `RegisterScreen → signUp` (full_name) + Trigger `handle_new_user` | ✅ Profil mit Name |
| A erstellt Familie | `CreateFamilyScreen → createFamily` | ✅ |
| A erzeugt Einladung | `createInvitation` (Code) bzw. `createSmartInvite` (Code + Person/Beziehung) | ✅ Code wird erzeugt |
| B öffnet Link / gibt Code ein | Deep-Link `…/invite/CODE` bzw. `JoinFamilyScreen` | ✅ (Code-Eingabe; Web-Deeplink siehe Risiken) |
| B registriert/loggt sich ein | `signUp` / `signIn` | ✅ |
| B wird der Familie zugeordnet | RPC `accept_invitation` → `family_members` insert | ✅ Mitglied + Rolle |
| Beide sehen dieselbe Familie | `FamilyContext.refetch` nach Beitritt | ✅ |
| **B erscheint im Familienbaum** | siehe Befund unten | ⚠️ **nur mit Smart-Invite + Fix-Migration** |
| Rollen/Berechtigungen | `family_members.role` + RLS `is_family_admin` | ✅ |

## Wichtiger Befund: „B im Familienbaum"

Der Familienbaum zeigt **Personen** (`persons`) + **Beziehungen** – nicht die
reine Mitgliederliste. Die bisherige RPC `accept_invitation` fügte B nur zu
`family_members` hinzu (→ sichtbar unter **Mitglieder**, Rollen funktionieren),
**verknüpfte aber keine Person** und legte keine Beziehung an. Folge:

- **Generische Einladung (nur Code):** B ist **Mitglied**, erscheint **nicht** als
  Knoten im Baum (gewollt – nicht jedes Mitglied muss ein Baumknoten sein).
- **Smart-Invite (an eine angelegte Person gebunden):** B sollte als dieser
  Baumknoten erscheinen – die alte RPC hat die Verknüpfung jedoch ignoriert.

### Fix (bereitgestellt, additiv)
Neue Migration **`supabase/migrations/20260617000003_phase6_accept_invitation_link.sql`**
erweitert `accept_invitation`: bei Smart-Invite wird `persons.user_id` = neues
Konto gesetzt **und** die Beziehung zum Einladenden angelegt → **B erscheint
sichtbar im Familienbaum**. Rein additiv (`create or replace function`), keine
Tabellen-/Datenänderung.

**Anwenden:** Inhalt der Datei einmal im Supabase **SQL Editor** ausführen
(oder bei frischer DB ist die Logik beim nächsten kombinierten Lauf enthalten,
sobald wir sie in `staging_combined.sql` mitführen).

## Dein A/B-Testplan (Echt-Modus, auf deinem Rechner)

Voraussetzung: kombinierte SQL ausgeführt **+ Fix-Migration oben** + lokale `.env`.

1. `npx expo start --web`.
2. **Konto A** registrieren → Familie erstellen.
3. **Wichtig für Baum-Sichtbarkeit:** in der App **„Familienmitglied einladen"**
   (Smart-Invite) wählen und die Einladung **an eine Person + Beziehung** binden
   (z. B. „Bruder"). Code/Link kopieren.
4. Zweiter Browser/Inkognito → **Konto B** registrieren → **Einladung annehmen**
   (Code eingeben).
5. Prüfen:
   - Beide sehen **dieselbe Familie** ✅ (erwartet)
   - B steht unter **Mitglieder** mit korrekter Rolle ✅ (erwartet)
   - B erscheint als **Knoten im Familienbaum** ✅ (mit Fix-Migration + Smart-Invite)
6. **RLS-Gegentest:** Konto C (andere/keine Familie) → darf **nichts** von dieser
   Familie sehen.

## Ergebnis (Code-/SQL-belegt)

- **Funktioniert Einladung:** **Ja** (Code-Erzeugung + Annahme via RPC).
- **Funktioniert Familienzuordnung:** **Ja** (B wird `family_members` mit Rolle).
- **Funktioniert gemeinsamer Familienbaum:** **Ja, mit Einschränkung** – als
  Baum**knoten** nur bei Smart-Invite **und** angewandter Fix-Migration; als
  Mitglied immer.
- **Gibt es Fehler?** Kein Code-Fehler. Die einzige Lücke (B als Baumknoten)
  ist mit der bereitgestellten Migration geschlossen.

## Sicherheit / Stabilität

- **RLS:** alle Tabellen geschützt; `accept_invitation` ist `security definer`
  (kontrolliert), Zugriff sonst nur über `is_family_member` → **keine fremden
  Familiendaten sichtbar**.
- **Demo-Modus:** unverändert nutzbar (ohne ENV).
- **Live-App:** weiterhin Demo, kein Login-Zwang, kein White-Screen-Risiko.
- **Keine Secret Keys** im Frontend.

## Was ist noch offen vor der ersten Testfamilie?

1. **Fix-Migration anwenden** (`…0003_phase6_accept_invitation_link.sql`) – damit
   eingeladene Mitglieder im Baum erscheinen.
2. **A/B-Test live durchführen** (oben) und RLS mit einem Drittkonto gegenprüfen.
3. **E-Mail-Bestätigung** im Staging ggf. aus / vor Echtbetrieb an.
4. **Einladungslink im Web:** Deep-Link-Domain greift im Web nicht automatisch –
   Code-Eingabe funktioniert; echten Web-Invite-Link später konfigurieren.
5. **Google-Login:** späterer Schritt.

Sobald der A/B-Test grün ist, ist der Einladungsflow für erste Testfamilien
bereit.
