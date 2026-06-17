-- =====================================================================
-- Phase 6 · Einladung: angenommene Person mit Konto verknüpfen (Familienbaum)
-- =====================================================================
-- Erweitert accept_invitation: Wird per Smart-Invite eine bereits angelegte
-- Person eingeladen (invitations.person_id gesetzt), so wird diese Person beim
-- Annehmen mit dem neuen Konto verknüpft und – falls Beziehungsdaten vorhanden
-- sind – die Beziehung zum Einladenden angelegt. Dadurch erscheint das neue
-- Mitglied SICHTBAR im Familienbaum (nicht nur in der Mitgliederliste).
--
-- Rein additiv (CREATE OR REPLACE FUNCTION). Keine Datenänderung, keine
-- Tabellenänderung. Auf die Staging-DB anwenden (einmal im SQL Editor).
-- =====================================================================

create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_invitation
  from public.invitations
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Einladungscode ungültig.';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Einladung ist nicht mehr gültig.';
  end if;

  if v_invitation.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_invitation.id;
    raise exception 'Einladung ist abgelaufen.';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (v_invitation.family_id, v_uid, v_invitation.role)
  on conflict (family_id, user_id) do nothing;

  -- Smart-Invite: vorhandene Person mit dem neuen Konto verknüpfen.
  if v_invitation.person_id is not null then
    update public.persons
       set user_id = v_uid
     where id = v_invitation.person_id
       and family_id = v_invitation.family_id
       and user_id is null;

    -- Beziehung Einladender -> Person automatisch anlegen (für den Familienbaum).
    if v_invitation.inviter_person_id is not null
       and v_invitation.relationship_type is not null
       and v_invitation.inviter_person_id <> v_invitation.person_id then
      insert into public.relationships
        (family_id, from_person_id, to_person_id, type, category, created_by)
      select
        v_invitation.family_id,
        v_invitation.inviter_person_id,
        v_invitation.person_id,
        v_invitation.relationship_type,
        'biological'::relationship_category,
        v_invitation.invited_by
      where not exists (
        select 1 from public.relationships r
        where r.from_person_id = v_invitation.inviter_person_id
          and r.to_person_id   = v_invitation.person_id
          and r.type           = v_invitation.relationship_type
      );
    end if;
  end if;

  update public.invitations
     set status = 'accepted', accepted_by = v_uid, accepted_at = now()
   where id = v_invitation.id;

  return v_invitation.family_id;
end;
$$;
