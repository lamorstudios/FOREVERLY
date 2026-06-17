/**
 * End-to-End-Test: Datenpersistenz + gemeinsame Familiensicht (Echt-Modus).
 *
 * Szenario: Konto A erstellt Familie, lädt B ein (Smart-Invite), B tritt bei.
 * A erstellt Erinnerung, Foto (echter Storage-Upload), Zeitkapsel,
 * Ehrenmitglied (+Zitat/Erinnerung) und Dokument-Hinweis. Danach wird für A
 * UND B ein Reload/Relogin simuliert (frischer Client) und geprüft, ob alles
 * erhalten bleibt und B dieselben Inhalte sieht. RLS wird mit einem Drittkonto
 * geprüft. Ausgabe: ja/nein pro Punkt.
 *
 * AUSFÜHREN (lokal, Staging):
 *   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
 *   node scripts/test_persistence.mjs
 *
 * Voraussetzungen: staging_combined.sql + Fix-Migration 0003 angewandt;
 * Supabase → Auth → Email „Confirm email" AUS; nur Staging-Projekt.
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
const code = `P${rand.toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const results = [];
const mark = (label, ok, detail = '') => {
  results.push({ label, ok });
  console.log(`${ok ? '✅ JA ' : '❌ NEIN'} – ${label}${detail ? ' · ' + detail : ''}`);
};
const newClient = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function signUpIn(c, em) {
  let { data, error } = await c.auth.signUp({ email: em, password: pw, options: { data: { full_name: em.split('@')[0] } } });
  if (error) throw new Error('signUp: ' + error.message);
  if (!data.session) {
    const r = await c.auth.signInWithPassword({ email: em, password: pw });
    if (r.error) throw new Error('signIn (Confirm email AUS?): ' + r.error.message);
    data = r.data;
  }
  return data.user.id;
}

async function main() {
  const A = newClient();
  const aId = await signUpIn(A, emailA);
  mark('1. Konto A registriert', !!aId);

  const { data: fam, error: famErr } = await A.from('families').insert({ name: `Familie ${rand}`, created_by: aId }).select('*').single();
  if (famErr || !fam) { mark('2. Familie erstellt', false, famErr?.message); return finish(); }
  mark('2. Familie erstellt', true);

  const ins = async (table, row) => {
    const { data, error } = await A.from(table).insert(row).select('id').single();
    if (error) console.log('   ↳ insert', table, 'Fehler:', error.message);
    return { id: data?.id, error };
  };

  const pA = await ins('persons', { family_id: fam.id, created_by: aId, user_id: aId, first_name: 'Anna' });
  const pB = await ins('persons', { family_id: fam.id, created_by: aId, first_name: 'Bert' });
  const inv = await ins('invitations', {
    family_id: fam.id, code, role: 'member', invited_by: aId, status: 'pending',
    expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
    person_id: pB.id, inviter_person_id: pA.id, relationship_type: 'bruder',
  });
  mark('3. A lädt B ein (Einladung erstellt)', !inv.error, inv.error?.message || `Code ${code}`);

  const B = newClient();
  const bId = await signUpIn(B, emailB);
  const { data: joinedFam, error: joinErr } = await B.rpc('accept_invitation', { p_code: code });
  mark('4. B tritt bei', !joinErr && joinedFam === fam.id, joinErr?.message);

  // 5. Inhalte anlegen
  const mem = await ins('memories', { family_id: fam.id, author_id: aId, title: `Erinnerung ${rand}`, content_type: 'text' });
  mark('5a. Erinnerung', !mem.error, mem.error?.message);
  const path = `${fam.id}/test/${rand}.png`;
  const up = await A.storage.from('photos').upload(path, PNG, { contentType: 'image/png', upsert: false });
  let photoOk = !up.error;
  if (photoOk) { const ph = await ins('photos', { family_id: fam.id, uploaded_by: aId, storage_path: path, caption: 'Testfoto' }); photoOk = !ph.error; }
  mark('5b. Foto/Galerieeintrag', photoOk, up.error ? 'Storage: ' + up.error.message : '');
  const cap = await ins('time_capsules', { family_id: fam.id, creator_id: aId, title: `Kapsel ${rand}`, content_type: 'text', text_content: 'Hallo Zukunft', open_at: new Date(Date.now() + 365 * 864e5).toISOString() });
  mark('5c. Zeitkapsel', !cap.error, cap.error?.message);
  const opa = await ins('persons', { family_id: fam.id, created_by: aId, first_name: `Opa ${rand}`, is_memorial: true, death_date: '1990-05-01' });
  let memorialOk = !opa.error;
  if (opa.id) {
    const q = await ins('person_quotes', { family_id: fam.id, person_id: opa.id, text: 'Wer rastet, der rostet.', added_by_user_id: aId, added_by_name: 'A' });
    const tr = await ins('person_tributes', { family_id: fam.id, person_id: opa.id, text: 'Ich erinnere mich …', author_user_id: aId, author_name: 'A' });
    memorialOk = !q.error && !tr.error;
  }
  mark('5d. Ehrenmitglied (+Zitat/Erinnerung)', memorialOk);
  const doc = await ins('family_documents', { family_id: fam.id, kind: 'sonstige', title: `Dokument ${rand}`, is_available: true, created_by: aId });
  mark('5e. Dokument-Hinweis', !doc.error, doc.error?.message);

  // 6-9. Reload + Relogin A
  const A2 = newClient();
  await signUpIn(A2, emailA);
  console.log('— Reload/Relogin A simuliert —');
  const cntA = async (table) => {
    const { count, error } = await A2.from(table).select('*', { count: 'exact', head: true }).eq('family_id', fam.id);
    return error ? -1 : (count ?? 0);
  };
  const aAll = (await cntA('memories')) > 0 && (await cntA('photos')) > 0 && (await cntA('time_capsules')) > 0 && (await cntA('persons')) >= 2 && (await cntA('family_documents')) > 0;
  mark('6-9. A: alle Daten nach Reload/Relogin vorhanden', aAll);
  const sg = await A2.storage.from('photos').createSignedUrl(path, 60);
  mark('   Foto-Datei abrufbar (signierte URL)', !sg.error, sg.error?.message);

  // 10. B sieht dieselben Inhalte (frischer Client + Relogin)
  const B2 = newClient();
  await signUpIn(B2, emailB);
  console.log('— Reload/Relogin B simuliert —');
  const cntB = async (table) => {
    const { count, error } = await B2.from(table).select('*', { count: 'exact', head: true }).eq('family_id', fam.id);
    return error ? -1 : (count ?? 0);
  };
  const bSees = (await cntB('memories')) > 0 && (await cntB('photos')) > 0 && (await cntB('time_capsules')) > 0 && (await cntB('persons')) >= 2 && (await cntB('family_documents')) > 0;
  mark('10. B sieht dieselben Familieninhalte', bSees);

  // B im Baum (Smart-Invite-Verknüpfung) + Rollen
  const linked = await B2.from('persons').select('user_id').eq('id', pB.id).maybeSingle();
  const rel = await B2.from('relationships').select('type').eq('to_person_id', pB.id).eq('from_person_id', pA.id);
  mark('   B im Familienbaum (Person verknüpft + Beziehung)', linked.data?.user_id === bId && (rel.data || []).length > 0, 'sonst Fix-Migration 0003 anwenden');
  const am = await A2.from('family_members').select('role').eq('user_id', aId).eq('family_id', fam.id).maybeSingle();
  const bm = await B2.from('family_members').select('role').eq('user_id', bId).eq('family_id', fam.id).maybeSingle();
  mark('   Rollen (A=admin, B=member)', am.data?.role === 'admin' && bm.data?.role === 'member', `A=${am.data?.role}, B=${bm.data?.role}`);

  // RLS: Drittkonto C sieht nichts
  const C = newClient();
  await signUpIn(C, emailC);
  const cMem = await C.from('memories').select('id').eq('family_id', fam.id);
  const cPers = await C.from('persons').select('id').eq('family_id', fam.id);
  mark('RLS: Fremdes Konto C sieht KEINE Familiendaten', (cMem.data || []).length === 0 && (cPers.data || []).length === 0, `C sah ${cMem.data?.length ?? 0} Erinnerungen / ${cPers.data?.length ?? 0} Personen`);

  finish();
}

function finish() {
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n── Ergebnis: ${ok}/${results.length} Prüfungen bestanden ──`);
  console.log('Hinweis: Wegwerf-Testkonten/-daten verbleiben im Staging-Projekt.');
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((e) => { console.error('❌ Abbruch:', e.message); process.exit(1); });
