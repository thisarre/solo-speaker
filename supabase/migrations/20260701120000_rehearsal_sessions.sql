-- rehearsal_sessions: one row per speaking-mode session that lasted ≥ 30 s.
-- Written by /api/analytics/rehearsal/sessions (service-role) after auth validation.
-- RLS: users SELECT their own rows; no direct INSERT (service-role only).
create table if not exists public.rehearsal_sessions (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.profiles(id) on delete cascade,
  talk_id           uuid        references public.talks(id) on delete set null,
  talk_title        text,
  started_at        timestamptz not null,
  duration_seconds  integer     not null check (duration_seconds > 0),
  estimated_seconds integer,
  created_at        timestamptz not null default now()
);

create index if not exists rehearsal_sessions_user_started_idx
  on public.rehearsal_sessions (user_id, started_at desc);

create index if not exists rehearsal_sessions_user_talk_idx
  on public.rehearsal_sessions (user_id, talk_id);

alter table public.rehearsal_sessions enable row level security;

create policy "rehearsal_sessions: users read own"
  on public.rehearsal_sessions
  for select
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
