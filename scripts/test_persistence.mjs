/**
 * End-to-End-Test: Datenpersistenz gegen Supabase (echte Daten, Echt-Modus).
 *
 * Legt mit einem echten Konto Familie, Erinnerung, Foto, Zeitkapsel und
 * Ehrenmitglied (inkl. Zitat/Erinnerung) an, simuliert dann einen Reload +
 * erneuten Login (frischer Client, neue Session) und prüft, ob ALLES erhalten
 * bleibt. Gibt ja/nein pro Datentyp aus.
 *
 * AUSFÜHREN (lokal, Staging):
 *   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
 *   node scripts/test_persistence.mjs
 *
 * Voraussetzungen: Schema+RLS angewandt; „Confirm email" für den Test AUS;
 * nur auf Staging verwenden (legt Wegwerf-Daten an).
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
const email = `famii.persist.${rand}@example.com`;
// 1x1 transparentes PNG
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
  let { data, error } = await c.auth.signUp({ email: em, password: pw, options: { data: { full_name: 'Persist Tester' } } });
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
  const uid = await signUpIn(A, email);

  // --- Anlegen ---
  const { data: fam, error: famErr } = await A.from('families').insert({ name: `Persist ${rand}`, created_by: uid }).select('*').single();
  if (famErr || !fam) { mark('Familie anlegen', false, famErr?.message); return finish(); }
  mark('Familie anlegen', true);

  const ins = async (table, row) => {
    const { data, error } = await A.from(table).insert(row).select('id').single();
    return { id: data?.id, error };
  };

  const mem = await ins('memories', { family_id: fam.id, author_id: uid, title: `Erinnerung ${rand}`, content_type: 'text' });
  mark('Erinnerung anlegen', !mem.error, mem.error?.message);

  const cap = await ins('time_capsules', { family_id: fam.id, creator_id: uid, title: `Kapsel ${rand}`, content_type: 'text', text_content: 'Hallo Zukunft', open_at: new Date(Date.now() + 365 * 864e5).toISOString() });
  mark('Zeitkapsel anlegen', !cap.error, cap.error?.message);

  const person = await ins('persons', { family_id: fam.id, created_by: uid, first_name: `Opa ${rand}`, is_memorial: true, death_date: '1990-05-01' });
  mark('Ehrenmitglied anlegen', !person.error, person.error?.message);
  if (person.id) {
    const q = await ins('person_quotes', { family_id: fam.id, person_id: person.id, text: 'Wer rastet, der rostet.', added_by_user_id: uid, added_by_name: 'Persist Tester' });
    const tr = await ins('person_tributes', { family_id: fam.id, person_id: person.id, text: 'Ich erinnere mich …', author_user_id: uid, author_name: 'Persist Tester' });
    mark('Zitat & Erinnerung am Ehrenmitglied', !q.error && !tr.error, q.error?.message || tr.error?.message);
  }

  // Foto: echter Storage-Upload + DB-Zeile
  const path = `${fam.id}/test/${rand}.png`;
  const up = await A.storage.from('photos').upload(path, PNG, { contentType: 'image/png', upsert: false });
  let photoOk = !up.error;
  if (photoOk) {
    const ph = await ins('photos', { family_id: fam.id, uploaded_by: uid, storage_path: path, caption: 'Testfoto' });
    photoOk = !ph.error;
    if (ph.error) mark('Foto hochladen', false, ph.error.message);
  }
  if (up.error) mark('Foto hochladen', false, 'Storage: ' + up.error.message);
  if (photoOk) mark('Foto hochladen', true);

  // --- Reload + erneuter Login simulieren (frischer Client, neue Session) ---
  const B = newClient();
  await signUpIn(B, email); // erneuter Login desselben Kontos
  console.log('— Reload/Relogin simuliert (frischer Client) —');

  const cnt = async (table) => {
    const { count, error } = await B.from(table).select('*', { count: 'exact', head: true }).eq('family_id', fam.id);
    return error ? -1 : (count ?? 0);
  };
  mark('Familie bleibt nach Reload', (await B.from('family_members').select('family_id').eq('family_id', fam.id)).data?.length > 0);
  mark('Erinnerung bleibt nach Reload', (await cnt('memories')) > 0);
  mark('Zeitkapsel bleibt nach Reload', (await cnt('time_capsules')) > 0);
  mark('Ehrenmitglied bleibt nach Reload', (await cnt('persons')) > 0);
  mark('Zitate bleiben nach Reload', (await cnt('person_quotes')) > 0);
  const photoCount = await cnt('photos');
  const signed = await B.storage.from('photos').createSignedUrl(path, 60);
  mark('Foto bleibt nach Reload (DB + signierte URL)', photoCount > 0 && !signed.error, signed.error?.message);

  finish();
}

function finish() {
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n── Ergebnis: ${ok}/${results.length} Prüfungen bestanden ──`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((e) => { console.error('❌ Abbruch:', e.message); process.exit(1); });
