/**
 * End-to-End-Test: echter Familien-Einladungsflow gegen Supabase.
 *
 * Führt mit dem ANON-Key (wie die App) zwei echte Testkonten durch den
 * kompletten Flow und prüft Einladung, Familienzuordnung, gemeinsamen
 * Familienbaum, Rollen und RLS-Isolation. Gibt ja/nein pro Schritt aus.
 *
 * AUSFÜHREN (lokal, NICHT in der Live-App):
 *   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key> \
 *   node scripts/test_invite_flow.mjs
 *
 * VORAUSSETZUNGEN:
 *   - Schema + RLS angewandt (staging_combined.sql)
 *   - Fix-Migration 20260617000003 angewandt (B im Baum)
 *   - Supabase → Authentication → Email: „Confirm email" AUS (für Test-Sessions)
 *   - Nur auf einem STAGING-Projekt verwenden (legt echte Testdaten an).
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) {
  console.error('❌ Bitte EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY setzen.');
  process.exit(2);
}

const rand = Math.random().toString(36).slice(2, 8);
const pw = 'Test1234!aA';
const emailA = `famii.a.${rand}@example.com`;
const emailB = `famii.b.${rand}@example.com`;
const emailC = `famii.c.${rand}@example.com`;
const code = `T${rand.toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;

const results = [];
const mark = (label, ok, detail = '') => {
  results.push({ label, ok });
  console.log(`${ok ? '✅ JA ' : '❌ NEIN'} – ${label}${detail ? ' · ' + detail : ''}`);
};

function client() {
  return createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signUpIn(c, email) {
  let { data, error } = await c.auth.signUp({ email, password: pw, options: { data: { full_name: email.split('@')[0] } } });
  if (error) throw new Error('signUp: ' + error.message);
  if (!data.session) {
    const r = await c.auth.signInWithPassword({ email, password: pw });
    if (r.error) throw new Error('signIn (Confirm email AUS?): ' + r.error.message);
    data = r.data;
  }
  return data.user.id;
}

async function main() {
  const A = client(), B = client(), C = client();

  // 1) A registriert/loggt sich ein
  const aId = await signUpIn(A, emailA);
  mark('Testkonto A registriert', !!aId);

  // 2) A erstellt Familie (Trigger macht A zum Admin-Mitglied)
  const { data: fam, error: famErr } = await A.from('families').insert({ name: `Testfamilie ${rand}`, created_by: aId }).select('*').single();
  mark('A erstellt Familie', !famErr && !!fam, famErr?.message);
  if (!fam) return finish();

  // A legt eigene Person + Platzhalter-Person für B an
  const { data: pA } = await A.from('persons').insert({ family_id: fam.id, created_by: aId, user_id: aId, first_name: 'Anna' }).select('*').single();
  const { data: pB } = await A.from('persons').insert({ family_id: fam.id, created_by: aId, first_name: 'Bert' }).select('*').single();

  // 3) A erzeugt Smart-Einladung (an Person pB, Beziehung zu pA)
  const { error: invErr } = await A.from('invitations').insert({
    family_id: fam.id, code, role: 'member', invited_by: aId, status: 'pending',
    expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
    person_id: pB?.id, inviter_person_id: pA?.id, relationship_type: 'bruder',
  });
  mark('A erzeugt Einladung (Code/Link)', !invErr, invErr?.message || `Code ${code}`);

  // 4/5) B registriert/loggt sich ein
  const bId = await signUpIn(B, emailB);
  mark('Testkonto B registriert/eingeloggt', !!bId);

  // 6) B nimmt Einladung an
  const { data: joinedFam, error: joinErr } = await B.rpc('accept_invitation', { p_code: code });
  mark('Familienzuordnung (B nimmt Einladung an)', !joinErr && joinedFam === fam.id, joinErr?.message);

  // 7) Beide sehen dieselbe Familie
  const aFams = await A.from('family_members').select('family_id, role');
  const bFams = await B.from('family_members').select('family_id, role');
  const aSees = (aFams.data || []).some((r) => r.family_id === fam.id);
  const bSees = (bFams.data || []).some((r) => r.family_id === fam.id);
  mark('Beide Konten sehen dieselbe Familie', aSees && bSees);

  // 8) B erscheint im Familienbaum (Person verknüpft + Beziehung vorhanden)
  const { data: linkedPerson } = await B.from('persons').select('id, user_id').eq('id', pB?.id).maybeSingle();
  const { data: rels } = await B.from('relationships').select('from_person_id,to_person_id,type').eq('to_person_id', pB?.id);
  const personLinked = linkedPerson?.user_id === bId;
  const relExists = (rels || []).some((r) => r.from_person_id === pA?.id && r.type === 'bruder');
  mark('B erscheint im Familienbaum (Person verknüpft + Beziehung)', personLinked && relExists,
    personLinked ? (relExists ? '' : 'Beziehung fehlt → Fix-Migration 0003 anwenden') : 'Person nicht verknüpft → Fix-Migration 0003 anwenden');

  // 9) Rollen
  const aRole = (aFams.data || []).find((r) => r.family_id === fam.id)?.role;
  const bRole = (bFams.data || []).find((r) => r.family_id === fam.id)?.role;
  mark('Rollen funktionieren (A=admin, B=member)', aRole === 'admin' && bRole === 'member', `A=${aRole}, B=${bRole}`);

  // RLS: Konto C (keine Familie) darf nichts sehen
  await signUpIn(C, emailC);
  const { data: cPersons } = await C.from('persons').select('id').eq('family_id', fam.id);
  mark('RLS: Fremdes Konto sieht KEINE Familiendaten', (cPersons || []).length === 0, `C sah ${cPersons?.length ?? 0} Personen`);

  finish();
}

function finish() {
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n── Ergebnis: ${ok}/${results.length} Schritte bestanden ──`);
  console.log('Hinweis: Testkonten/-daten verbleiben im Staging-Projekt (Wegwerf-Daten).');
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((e) => { console.error('❌ Abbruch:', e.message); process.exit(1); });
