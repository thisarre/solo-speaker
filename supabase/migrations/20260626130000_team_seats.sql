CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Mon équipe',
  max_seats integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'
    CONSTRAINT team_invitations_status_check CHECK (status IN ('pending', 'active', 'revoked')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(team_id, email)
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_owner_all" ON public.teams FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "teams_member_read" ON public.teams FOR SELECT USING (
  id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid() AND team_id IS NOT NULL)
);

CREATE POLICY "invitations_owner_all" ON public.team_invitations FOR ALL USING (
  team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
);
CREATE POLICY "invitations_member_read" ON public.team_invitations FOR SELECT USING (
  team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid() AND team_id IS NOT NULL)
);
