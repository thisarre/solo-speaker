-- User's preferred locale ("fr" | "en"), captured at signup/onboarding and used to
-- localize transactional/lifecycle emails (welcome, subscription, trial reminders).
alter table public.profiles
  add column if not exists locale text not null default 'fr';
