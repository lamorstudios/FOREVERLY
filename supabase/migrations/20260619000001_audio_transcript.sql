-- ---------------------------------------------------------------------
-- Audio-Transkription
-- ---------------------------------------------------------------------
-- Ergänzt die Tabelle "audios" um ein optionales, durchsuchbares
-- Transkriptionsfeld. Das Original-Audio bleibt immer erhalten; die
-- Transkription kann nachträglich erstellt oder bearbeitet werden.

alter table public.audios
  add column if not exists transcript text;

comment on column public.audios.transcript is
  'Optionale, editierbare Transkription der Aufnahme (durchsuchbar). Original-Audio bleibt erhalten.';
