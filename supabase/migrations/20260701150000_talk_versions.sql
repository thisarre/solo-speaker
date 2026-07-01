-- Add parent_talk_id to support talk versioning (Pro/Team: talk.versions capability).
-- source_talk_id is already used for multilingual translations — this is a separate concept.

alter table public.talks
  add column if not exists parent_talk_id uuid references public.talks(id) on delete set null;
