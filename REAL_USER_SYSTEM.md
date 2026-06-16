# Foreverly · Real User System

Wie echte Nutzer, Familien und Einladungen funktionieren. Einrichtung der
Datenbank/Provider: `supabase/SUPABASE_SETUP.md` und `DEPLOYMENT.md`.

Demo vs. Real wird allein über `EXPO_PUBLIC_DEMO_MODE` + Supabase-Keys
gesteuert: Mit gültigen Keys und `DEMO_MODE=false` ist Supabase das
**Hauptsystem**; ohne Keys läuft die getrennte Demo.

---

## 1. Login-Prozess

Anbieter (Supabase Auth):
- **Google** – `signInWithGoogle()` (Web: voller Redirect, `detectSessionInUrl`).
- **Apple** – `signInWithApple()` (vorbereitet; Button auf iOS/Web sichtbar,
  aktiv sobald der Apple-Provider im Supabase-Dashboard eingerichtet ist).
- **E-Mail/Passwort** – optional weiterhin verfügbar.

Ablauf:
1. Nutzer tippt „Mit Google/Apple fortfahren" (Welcome/Login/Register).
2. OAuth-Redirect → Rückkehr in die App, Sitzung wird erkannt.
3. DB-Trigger `handle_new_user` legt automatisch ein **Profil** an und
   übernimmt **Anzeigename** (`full_name`/`name`) und **Profilbild**
   (`avatar_url`/`picture`).
4. Ohne Familie → Onboarding (erstellen oder Einladung annehmen).

Einwilligungen: Bei E-Mail-Registrierung müssen **AGB** und **Datenschutz**
aktiv akzeptiert werden (keine Vorauswahl); Benachrichtigungen/Standort sind
optional.

---

## 2. Datenbankstruktur (Supabase / PostgreSQL)

Kerntabellen (37 gesamt, alle mit RLS):

| Tabelle | Inhalt |
|---|---|
| `profiles` | Konto: Name, E-Mail, Profilbild (1:1 zu `auth.users`) |
| `families` | Familien |
| `family_members` | Mitgliedschaft + Rolle (admin/member) |
| `persons` | Personen im Stammbaum (inkl. `birth_date` = Geburtsdatum) |
| `relationships` | Beziehungen zwischen Personen |
| `relationship_suggestions` | abgeleitete Beziehungsvorschläge |
| `invitations` | Einladungen (Code, Beziehung, Nähe, Status) |
| `memories`, `photos`, `audios` | Erinnerungen & Medien |
| `time_capsules` (+ recipients) | Zeitkapseln |
| `family_documents` / Vault | Dokumente & Nachlass |
| `member_statuses` | Familienstatus |
| `notifications` | Benachrichtigungen |
| `reports`, `member_blocks` | Moderation (Melden/Blockieren) |

Profilfelder laut Anforderung: **Name/Profilbild** in `profiles`;
**Geburtsdatum** und **Familienrolle/-zugehörigkeit** über `persons` +
`family_members`; **Status** über `member_statuses`.

Sicherheit: SECURITY-DEFINER-Helfer (`is_family_member`, `is_family_admin`)
verhindern RLS-Rekursion; Inhalte sind nur für Mitglieder der Familie sichtbar.

---

## 3. Einladungslogik

1. **Erstellen:** Jedes Mitglied wählt Beziehung (Bruder, Schwester, Mutter …)
   + Familiennähe → Code/Link (`createSmartInvite` → `generate_invite_code`).
2. **Teilen:** Link `…/invite/CODE` per Share/Kopieren.
3. **Annehmen:** `accept_invitation(code)` (SECURITY DEFINER) macht atomar:
   - Mitgliedschaft anlegen,
   - Personenprofil verknüpfen bzw. neu anlegen,
   - Beziehung **Einladender → neue Person** + Beziehungsvorschlag.
4. **Kettenreaktion:** Nach Beitritt erzeugt `generateSuggestions` abgeleitete
   Beziehungen (z. B. Bruder → Nichte), die im Netzwerk vorgeschlagen werden.

Ergebnis: Nick lädt Max ein → Max registriert sich → Max erscheint
automatisch als Bruder im Familienbaum (für beide sichtbar).

---

## 4. Berechtigungssystem

Rollen (`src/lib/roles.ts`): **admin** (Familienadministrator), **member**,
**inner** (Inner Circle), **trusted** (Vertrauensperson), **trustee**, **guest**
– mit Permission-Matrix (`family.manage`, `members.invite`, `content.view*`,
`estate.confirm`, `safety.receiveSos`, `settings.billing` …).

Durchsetzung:
- Sichtbarkeit/Schreibrechte über **RLS** (nur eigene Familie).
- Inhalts-Sichtbarkeit zusätzlich über `visibility` (privat/Inner Circle/Familie).
- Adminaktionen (Rolle ändern, entfernen) nur für `admin`.

---

## 5. Admin Dashboard (echt vs. Demo)

Im **Real-Modus** werden die Eckzahlen live aus Supabase gezählt:
**registrierte Nutzer, Familien, Mitglieder, Neuregistrierungen (Woche/Monat),
aktive Nutzer (Näherung)**. Die übrigen Kennzahlen nutzen vorerst die
Demo-Struktur, bis serverseitige Aggregation folgt. Im Demo-Modus bleiben es
Beispielwerte.

---

## 6. Testablauf (zwei echte Nutzer)

Voraussetzung: Supabase eingerichtet, Google-Provider aktiv,
`DEMO_MODE=false` (siehe SUPABASE_SETUP.md).

1. **Nutzer A** öffnet die App → „Mit Google fortfahren" → Familie erstellen
   („Familie Mustermann"). A ist Admin + erste Person im Baum.
2. **Nutzer A** → „+ Familienmitglied einladen" → Beziehung „Bruder" → Link
   teilen/kopieren.
3. **Nutzer B** (anderes Konto/Inkognito) öffnet den Link → „Mit Google
   fortfahren" → Beitritt mit vorausgefülltem Code → „Beitreten".
4. **Beide** sehen dieselbe Familie; B erscheint als Bruder im Familienbaum,
   abgeleitete Beziehungen werden vorgeschlagen.
5. **Speicherung prüfen:** Im Supabase-Dashboard erscheinen Zeilen in
   `profiles`, `families`, `family_members`, `persons`, `relationships`,
   `invitations` (Status `accepted`).
6. **Admin Dashboard** (Startseite → Admin) zeigt die echten Zahlen.

---

## Offen / nächste Schritte
- Apple-Provider im Supabase-Dashboard konfigurieren (Login dann aktiv).
- Last-Seen-Tracking für präzise „aktive Nutzer".
- Serverseitige Aggregation der übrigen Admin-Kennzahlen (Inhalte/Speicher).
