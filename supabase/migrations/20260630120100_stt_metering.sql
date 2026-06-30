-- STT metering. stt_sessions = source of truth (reservations + confirmations).
-- usage_counters = derived aggregate for fast cap reads at mint time.
-- Both service-role only (no client access — written by server STT flow).
create table if not exists public.stt_sessions (
  id                text primary key,                 -- client-generated speaking-session UUID
  user_id           uuid not null references public.profiles(id) on delete cascade,
  period_key        text not null,                    -- 'trial' or 'sub:<subId>:<period_start_epoch>'
  reserved_seconds  integer not null default 0,
  confirmed_seconds integer,
  status            text not null default 'reserved'
                      check (status in ('reserved', 'confirmed', 'expired')),
  engine            text not null default 'cloud' check (engine in ('cloud', 'browser')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists stt_sessions_sweep_idx
  on public.stt_sessions (status, created_at);
create index if not exists stt_sessions_user_period_idx
  on public.stt_sessions (user_id, period_key);

create table if not exists public.usage_counters (
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  period_key              text not null,
  cloud_reserved_seconds  integer not null default 0,
  cloud_confirmed_seconds integer not null default 0,
  browser_seconds         integer not null default 0,
  updated_at              timestamptz not null default now(),
  primary key (user_id, period_key)
);

alter table public.stt_sessions enable row level security;
alter table public.usage_counters enable row level security;
-- No policies: service-role bypasses RLS; authenticated users get no access.

notify pgrst, 'reload schema';
