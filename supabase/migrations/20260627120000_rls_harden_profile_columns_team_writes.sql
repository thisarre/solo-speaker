-- Pre-launch privilege hardening.
--
-- Context: RLS is enabled on every table and row-ownership policies are correct, but two
-- column/grant gaps let an authenticated user escalate their own billing.

-- 1) profiles ---------------------------------------------------------------------------------
-- The `profiles_update_own` policy plus the table-level UPDATE grant let a logged-in user update
-- ANY column of their own row from the browser, including `billing_plan` (free upgrade to a paid
-- plan) and `team_id` (attach to an arbitrary team and read its data via the team read policies).
--
-- Every legitimate write to `billing_plan`/`team_id` goes through the service_role
-- (Stripe webhook, /api/billing/sync, /api/team/{accept,revoke}, /join), which bypasses these
-- grants, so restrict the authenticated role to column-level UPDATE on the fields users actually
-- edit. INSERT is left as-is: the profile row is created server-side by the security-definer
-- handle_new_user trigger, and `profiles_insert_own` + the primary key (id = auth.uid()) make a
-- client-side insert of a second/elevated row impossible.
revoke update on public.profiles from authenticated;

grant update (
  full_name,
  speaker_role,
  primary_talk_type,
  onboarding_completed_at,
  onboarding_help_requested,
  onboarding_support_note
) on public.profiles to authenticated;

-- 2) teams ------------------------------------------------------------------------------------
-- Teams are provisioned server-side when a team plan is purchased (service_role via
-- /api/billing/{sync,webhook}); all reads also go through the service_role. Without this, the
-- `teams_owner_all` FOR ALL policy would let a client self-insert a team or inflate `max_seats`
-- on their own team — and every accepted invitation grants the invitee a free `studio` plan.
-- Writes become service_role only (unaffected by these revokes); SELECT is kept for any future
-- client-side reads governed by the existing read policies.
revoke insert, update, delete on public.teams from anon, authenticated;

notify pgrst, 'reload schema';
