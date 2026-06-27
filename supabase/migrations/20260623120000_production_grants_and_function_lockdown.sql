grant usage on schema public to anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.talks to authenticated;
grant select, insert, update, delete on table public.talk_sections to authenticated;

grant usage on schema app_private to postgres, service_role;

revoke all on function app_private.set_updated_at() from public;
revoke all on function app_private.handle_new_user() from public;
revoke all on function app_private.set_updated_at() from anon, authenticated;
revoke all on function app_private.handle_new_user() from anon, authenticated;

notify pgrst, 'reload schema';
