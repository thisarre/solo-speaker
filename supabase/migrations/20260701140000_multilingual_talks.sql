-- Extend the language check constraint to support ≥ 5 languages (Pro: talk.multilingual).
-- Add source_talk_id so a translated talk can reference its original.

alter table public.talks drop constraint if exists talks_language_check;
alter table public.talks add constraint talks_language_check
  check (language in ('FR', 'EN', 'ES', 'DE', 'IT', 'PT'));

alter table public.talks
  add column if not exists source_talk_id uuid references public.talks(id) on delete set null;
