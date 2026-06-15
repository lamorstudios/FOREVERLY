# Supabase Edge Functions

## `family-historian` (optional, Produktion)

Referenz-Implementierung für die **serverseitige** Antwort-Synthese des
Familienhistorikers (RAG). Sie ruft ausschließlich familieneigene
Wissensbausteine (`knowledge_chunks`) ab und lässt ein Sprachmodell
(Claude, `claude-opus-4-8`) daraus eine Antwort formulieren – streng auf den
Kontext beschränkt, mit Quellenangabe.

> **Wird in der Preview NICHT benötigt.** Der Familienhistoriker läuft dort
> komplett clientseitig und deterministisch (`src/historian/engine.ts`) –
> ohne Sprachmodell, ohne API-Schlüssel, ohne Backend. Diese Funktion ist die
> skalierbare Grundlage für später.

### Deploy

```bash
supabase functions deploy family-historian
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### Hinweise

- Der Anthropic-API-Schlüssel liegt nur serverseitig (Secret), nie im Client.
- Für semantische Suche `knowledge_chunks.embedding` (pgvector) befüllen und
  statt `textSearch` eine Vektor-Ähnlichkeitssuche verwenden.
- Die Antwort enthält immer die verwendeten Quellen, damit sie nachvollziehbar
  bleibt – dasselbe Prinzip wie in der clientseitigen Engine.
