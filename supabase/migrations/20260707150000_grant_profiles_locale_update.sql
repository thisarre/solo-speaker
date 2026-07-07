-- profiles.locale (ajoutée le 29/06 par profile_locale) est écrite par l'UPDATE
-- d'onboarding, mais le durcissement par colonnes du 27/06
-- (rls_harden_profile_columns_team_writes) ne l'inclut pas dans les colonnes
-- UPDATE autorisées pour authenticated → "permission denied for table profiles"
-- sur tout l'onboarding. On autorise uniquement cette colonne.
grant update (locale) on public.profiles to authenticated;
