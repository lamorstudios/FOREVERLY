-- =====================================================================
-- Foreverly · Storage Buckets & Policies
-- =====================================================================
-- Drei private Buckets. Zugriff über signierte URLs aus der App.
--   avatars : Profilbilder            · Pfad: {user_id}/...
--   photos  : Familienfotos, Personen-/Familienbilder · Pfad: {family_id}/...
--   audios  : Audioaufnahmen          · Pfad: {family_id}/...
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic']),
  ('photos',  'photos',  false, 26214400, array['image/jpeg','image/png','image/webp','image/heic']),
  ('audios',  'audios',  false, 52428800, array['audio/mpeg','audio/mp4','audio/m4a','audio/aac','audio/wav','audio/x-m4a','audio/webm'])
on conflict (id) do nothing;

-- Erste Pfadkomponente als uuid (family_id bzw. user_id)
-- ---------------------------------------------------------------------
-- avatars
-- ---------------------------------------------------------------------
create policy "Avatare lesen (eigene oder gemeinsame Familie)"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.shares_family(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "Avatar hochladen (eigener Ordner)"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Avatar ersetzen (eigener Ordner)"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Avatar löschen (eigener Ordner)"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------
create policy "Fotos lesen (Familienmitglied)"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Foto hochladen (Familienmitglied)"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
    and owner = auth.uid()
  );

create policy "Foto ersetzen (Familienmitglied)"
  on storage.objects for update
  using (
    bucket_id = 'photos'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Foto-Datei löschen (Eigentümer oder Admin)"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and (
      owner = auth.uid()
      or public.is_family_admin(((storage.foldername(name))[1])::uuid)
    )
  );

-- ---------------------------------------------------------------------
-- audios
-- ---------------------------------------------------------------------
create policy "Audios lesen (Familienmitglied)"
  on storage.objects for select
  using (
    bucket_id = 'audios'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Audio hochladen (Familienmitglied)"
  on storage.objects for insert
  with check (
    bucket_id = 'audios'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
    and owner = auth.uid()
  );

create policy "Audio-Datei löschen (Eigentümer oder Admin)"
  on storage.objects for delete
  using (
    bucket_id = 'audios'
    and (
      owner = auth.uid()
      or public.is_family_admin(((storage.foldername(name))[1])::uuid)
    )
  );
