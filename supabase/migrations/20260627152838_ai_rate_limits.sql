-- Server-side AI rate limiting.
--
-- The application calls public.consume_ai_rate_limit with the service_role key from API routes.
-- Browser roles cannot read, write, or execute this limiter directly.

create table if not exists public.ai_rate_limits (
  limiter_key text not null,
  route text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (limiter_key, route, window_start)
);

create index if not exists ai_rate_limits_updated_at_idx
  on public.ai_rate_limits (updated_at);

alter table public.ai_rate_limits enable row level security;

revoke all on public.ai_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.ai_rate_limits to service_role;

create or replace function public.consume_ai_rate_limit(
  p_limiter_key text,
  p_route text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  limit_value integer
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_seconds integer := greatest(1, least(coalesce(p_window_seconds, 60), 86400));
  v_limit integer := greatest(1, least(coalesce(p_limit, 1), 100000));
  v_window_start timestamptz := to_timestamp(
    floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds
  );
  v_count integer;
begin
  if length(coalesce(trim(p_limiter_key), '')) < 3 then
    raise exception 'limiter key is required';
  end if;

  if length(coalesce(trim(p_route), '')) < 2 then
    raise exception 'route is required';
  end if;

  insert into public.ai_rate_limits (
    limiter_key,
    route,
    window_start,
    request_count,
    updated_at
  )
  values (
    left(trim(p_limiter_key), 200),
    left(trim(p_route), 80),
    v_window_start,
    1,
    v_now
  )
  on conflict (limiter_key, route, window_start)
  do update set
    request_count = public.ai_rate_limits.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_count;

  if random() < 0.01 then
    delete from public.ai_rate_limits
    where window_start < v_window_start - interval '1 day';
  end if;

  allowed := v_count <= v_limit;
  remaining := greatest(v_limit - v_count, 0);
  reset_at := v_window_start + make_interval(secs => v_window_seconds);
  limit_value := v_limit;
  return next;
end;
$$;

revoke all on function public.consume_ai_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_ai_rate_limit(text, text, integer, integer) from anon, authenticated;
grant execute on function public.consume_ai_rate_limit(text, text, integer, integer) to service_role;

notify pgrst, 'reload schema';
