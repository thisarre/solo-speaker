alter table public.profiles
  add column if not exists speaker_role text not null default 'speaker'
    check (speaker_role in ('pastor', 'conference_speaker', 'trainer', 'founder', 'speaker')),
  add column if not exists primary_talk_type text not null default 'conference'
    check (primary_talk_type in ('sermon', 'conference', 'training', 'pitch', 'speech')),
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_help_requested boolean not null default false,
  add column if not exists onboarding_support_note text not null default '';

notify pgrst, 'reload schema';
