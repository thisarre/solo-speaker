-- Track which trial-ending reminder emails have been sent to each user, so the
-- daily reminder cron never sends the same milestone (e.g. "d3", "d1") twice.
alter table public.profiles
  add column if not exists trial_reminders_sent text[] not null default '{}';
