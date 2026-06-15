// =====================================================================
// Foreverly · Familienhistoriker · Supabase Edge Function (REFERENZ)
// =====================================================================
// OPTIONAL / PRODUKTION: Diese Funktion zeigt, wie in Produktion eine
// sprachliche Antwort über DIESELBE Treffermenge (RAG) erzeugt werden kann –
// serverseitig, damit kein API-Schlüssel im Client liegt.
//
// In der aktuellen Preview wird sie NICHT verwendet: Der Familienhistoriker
// läuft clientseitig deterministisch (src/historian/engine.ts) und kommt
// ganz ohne Sprachmodell aus. Diese Datei ist die skalierbare Grundlage für
// spätere Phasen.
//
// Grundprinzip (gegen Halluzinationen):
//   1. NUR familieneigene Wissensbausteine (knowledge_chunks) abrufen.
//   2. Diese als Kontext an das Modell geben.
//   3. Das Modell streng anweisen: ausschließlich aus dem Kontext antworten,
//      sonst "keine Information vorhanden" – und Quellen nennen.
//
// Deploy: supabase functions deploy family-historian
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// =====================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

interface RequestBody {
  familyId: string;
  query: string;
}

interface Chunk {
  source_type: string;
  title: string | null;
  content: string;
  source_date: string | null;
}

Deno.serve(async (req: Request) => {
  try {
    const { familyId, query } = (await req.json()) as RequestBody;
    if (!familyId || !query) {
      return json({ error: 'familyId und query sind erforderlich.' }, 400);
    }

    // Mit dem Auth-Token des Aufrufers: RLS stellt sicher, dass nur
    // Familienmitglieder die Wissensbausteine ihrer Familie sehen.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );

    // Einfaches lexikalisches Retrieval (für semantisches RAG: pgvector +
    // Embeddings auf knowledge_chunks.embedding). Nur Familieninhalte.
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('source_type, title, content, source_date')
      .eq('family_id', familyId)
      .textSearch('content', query, { type: 'websearch', config: 'german' })
      .limit(8);

    if (error) return json({ error: error.message }, 500);

    const context = (chunks ?? []) as Chunk[];
    if (context.length === 0) {
      return json({
        answer:
          'Dazu liegen in euren gespeicherten Familiendaten keine Informationen vor.',
        sources: [],
      });
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const contextText = context
      .map(
        (c, i) =>
          `[Quelle ${i + 1}: ${c.source_type}${c.title ? ` – ${c.title}` : ''}${
            c.source_date ? ` (${c.source_date})` : ''
          }]\n${c.content}`,
      )
      .join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system:
        'Du bist der Familienhistoriker von Foreverly. Beantworte die Frage ' +
        'AUSSCHLIESSLICH auf Basis des bereitgestellten Familienkontexts. ' +
        'Erfinde nichts. Wenn die Antwort nicht im Kontext steht, sage klar, ' +
        'dass dazu keine Informationen vorliegen. Nenne am Ende die verwendeten ' +
        'Quellen (z.B. „Quelle 1"). Antworte auf Deutsch, warm und knapp.',
      messages: [
        {
          role: 'user',
          content: `Familienkontext:\n\n${contextText}\n\nFrage: ${query}`,
        },
      ],
    });

    const answer = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    return json({
      answer,
      sources: context.map((c) => ({
        source_type: c.source_type,
        title: c.title,
        date: c.source_date,
      })),
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unbekannter Fehler' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
