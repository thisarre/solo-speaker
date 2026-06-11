create extension if not exists pgcrypto;

create schema if not exists app_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.talks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('sermon', 'conference', 'training', 'pitch', 'speech')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  audience text not null default '',
  duration_minutes integer not null default 10 check (duration_minutes > 0),
  language text not null default 'FR' check (language in ('FR', 'EN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.talk_sections (
  id uuid primary key default gen_random_uuid(),
  talk_id uuid not null references public.talks(id) on delete cascade,
  heading text not null,
  body text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists talks_user_id_updated_at_idx on public.talks(user_id, updated_at desc);
create index if not exists talk_sections_talk_id_position_idx on public.talk_sections(talk_id, position);

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

drop trigger if exists talks_set_updated_at on public.talks;
create trigger talks_set_updated_at
before update on public.talks
for each row execute function app_private.set_updated_at();

drop trigger if exists talk_sections_set_updated_at on public.talk_sections;
create trigger talk_sections_set_updated_at
before update on public.talk_sections
for each row execute function app_private.set_updated_at();

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.talks enable row level security;
alter table public.talk_sections enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "talks_select_own" on public.talks;
create policy "talks_select_own"
on public.talks
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "talks_insert_own" on public.talks;
create policy "talks_insert_own"
on public.talks
for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "talks_update_own" on public.talks;
create policy "talks_update_own"
on public.talks
for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "talks_delete_own" on public.talks;
create policy "talks_delete_own"
on public.talks
for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "talk_sections_select_own_talk" on public.talk_sections;
create policy "talk_sections_select_own_talk"
on public.talk_sections
for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.talks
    where talks.id = talk_sections.talk_id
      and talks.user_id = (select auth.uid())
  )
);

drop policy if exists "talk_sections_insert_own_talk" on public.talk_sections;
create policy "talk_sections_insert_own_talk"
on public.talk_sections
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.talks
    where talks.id = talk_sections.talk_id
      and talks.user_id = (select auth.uid())
  )
);

drop policy if exists "talk_sections_update_own_talk" on public.talk_sections;
create policy "talk_sections_update_own_talk"
on public.talk_sections
for update
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.talks
    where talks.id = talk_sections.talk_id
      and talks.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.talks
    where talks.id = talk_sections.talk_id
      and talks.user_id = (select auth.uid())
  )
);

drop policy if exists "talk_sections_delete_own_talk" on public.talk_sections;
create policy "talk_sections_delete_own_talk"
on public.talk_sections
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.talks
    where talks.id = talk_sections.talk_id
      and talks.user_id = (select auth.uid())
  )
);
