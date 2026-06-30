-- Subscription state, source of truth synced from Stripe webhooks. One row per buyer/owner.
-- Written only by the service role (webhook + sync). Users may read their own row.
alter table public.profiles
  drop constraint if exists profiles_billing_plan_check;
alter table public.profiles
  add constraint profiles_billing_plan_check
    check (billing_plan in ('trial', 'studio', 'pro', 'team'));

create table if not exists public.subscriptions (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  plan                   text not null check (plan in ('studio', 'pro', 'team')),
  cadence                text not null check (cadence in ('monthly', 'yearly')),
  status                 text not null,
  seats                  integer not null default 1 check (seats >= 1),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_owner_read" on public.subscriptions
  for select using (user_id = auth.uid());

notify pgrst, 'reload schema';
