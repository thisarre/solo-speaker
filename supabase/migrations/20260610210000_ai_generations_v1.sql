create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  talk_id uuid not null references public.talks(id) on delete cascade,
  feature text not null check (feature in ('outline', 'expand-section', 'oralize-section', 'shorten-section')),
  model text not null,
  output_text text not null default '',
  status text not null check (status in ('success', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_id_created_at_idx
on public.ai_generations(user_id, created_at desc);

create index if not exists ai_generations_talk_id_created_at_idx
on public.ai_generations(talk_id, created_at desc);

alter table public.ai_generations enable row level security;

drop policy if exists "ai_generations_select_own" on public.ai_generations;
create policy "ai_generations_select_own"
on public.ai_generations
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "ai_generations_insert_own_talk" on public.ai_generations;
create policy "ai_generations_insert_own_talk"
on public.ai_generations
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.talks
    where talks.id = ai_generations.talk_id
      and talks.user_id = (select auth.uid())
  )
);
