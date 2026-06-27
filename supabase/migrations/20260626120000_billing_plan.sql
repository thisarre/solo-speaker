ALTER TABLE public.profiles
  ADD COLUMN billing_plan text NOT NULL DEFAULT 'trial'
    CONSTRAINT profiles_billing_plan_check CHECK (billing_plan IN ('trial', 'studio', 'team'));
