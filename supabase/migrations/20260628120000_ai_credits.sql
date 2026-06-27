-- Trial AI credit pool: counts deliberate assistant generations for trial accounts.
-- Written only by the service role (the AI route increments via admin); not in the column-level
-- UPDATE grant for `authenticated`, so users can't reset their own counter.
alter table public.profiles
  add column if not exists ai_credits_used integer not null default 0;

notify pgrst, 'reload schema';
