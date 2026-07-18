-- Confirmation STT transactionnelle (audit 2026-07-18, reco Technique-2, Majeur).
--
-- Avant : la route /api/stt/session faisait SELECT session → calcul applicatif
-- (applyConfirmation) → UPDATE stt_sessions + UPSERT usage_counters — trois
-- allers-retours non transactionnels. Le garde « status = confirmed » était un
-- TOCTOU : deux confirmations concurrentes du même sessionId (double
-- beforeunload / retry réseau, réaliste sur le prompteur) pouvaient compter
-- confirmed_seconds deux fois.
--
-- Après : une fonction unique, sur le modèle de consume_ai_rate_limit —
-- SELECT … FOR UPDATE sur la session (sérialise les appels concurrents),
-- garde d'idempotence, upsert du compteur, le tout dans la MÊME transaction.
-- La sémantique du compteur reproduit EXACTEMENT applyConfirmation
-- (src/modules/billing/stt-metering.ts, la spécification exécutable testée) :
--   cloud_reserved  = greatest(0, cloud_reserved - session.reserved_seconds)
--   cloud_confirmed = cloud_confirmed + greatest(0, confirmed_seconds)

create or replace function public.confirm_stt_session(
  p_session_id text,
  p_user_id uuid,
  p_confirmed_seconds integer
)
returns table (
  confirmed boolean,
  already_confirmed boolean
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_session public.stt_sessions%rowtype;
  v_confirmed_seconds integer := greatest(0, least(coalesce(p_confirmed_seconds, 0), 86400));
begin
  if length(coalesce(trim(p_session_id), '')) < 3 then
    raise exception 'session id is required';
  end if;

  -- Verrou de ligne : le second appel concurrent attend ici, puis voit
  -- status = 'confirmed' → idempotent, jamais de double comptage.
  select * into v_session
  from public.stt_sessions
  where id = p_session_id
  for update;

  if not found or v_session.user_id is distinct from p_user_id then
    confirmed := false;
    already_confirmed := false;
    return next;
    return;
  end if;

  if v_session.status = 'confirmed' then
    confirmed := true;
    already_confirmed := true;
    return next;
    return;
  end if;

  update public.stt_sessions
  set confirmed_seconds = v_confirmed_seconds,
      status = 'confirmed',
      updated_at = now()
  where id = p_session_id;

  insert into public.usage_counters (
    user_id,
    period_key,
    cloud_reserved_seconds,
    cloud_confirmed_seconds,
    updated_at
  )
  values (
    v_session.user_id,
    v_session.period_key,
    0, -- greatest(0, 0 - reserved) : pas de compteur préexistant
    v_confirmed_seconds,
    now()
  )
  on conflict (user_id, period_key)
  do update set
    cloud_reserved_seconds = greatest(0, public.usage_counters.cloud_reserved_seconds - v_session.reserved_seconds),
    cloud_confirmed_seconds = public.usage_counters.cloud_confirmed_seconds + v_confirmed_seconds,
    updated_at = now();

  confirmed := true;
  already_confirmed := false;
  return next;
end;
$$;

revoke all on function public.confirm_stt_session(text, uuid, integer) from public;
revoke all on function public.confirm_stt_session(text, uuid, integer) from anon, authenticated;
grant execute on function public.confirm_stt_session(text, uuid, integer) to service_role;

notify pgrst, 'reload schema';
