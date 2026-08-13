-- 0006_lock_profile_role.sql
--
-- P0 FIX: profiles_update_own (0001_profiles.sql) allows any authenticated
-- user to UPDATE their own profiles row via the public anon key, but the
-- policy only checks auth.uid() = user_id — it never restricts which
-- columns change. Because "role" lives on that same row, a user can call:
--
--   supabase.from('profiles').update({ role: 'admin' }).eq('user_id', me)
--
-- directly from the browser (bypassing all application code) and grant
-- themselves admin. This trigger makes "role" (and "user_id"/"id") immutable
-- through the client, regardless of RLS policy, no matter which endpoint or
-- future code path performs the update.

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only the actual owner of the row (normal client update) is subject to
  -- this restriction; direct service-role/SQL-editor changes bypass RLS
  -- and triggers still run, so we only block when auth.uid() is set,
  -- i.e. the change came through the authenticated client, not a trusted
  -- server-side service-role connection.
  if auth.uid() is not null then
    if new.role is distinct from old.role then
      raise exception 'role cannot be changed by the user';
    end if;
    if new.user_id is distinct from old.user_id then
      raise exception 'user_id cannot be changed';
    end if;
    if new.id is distinct from old.id then
      raise exception 'id cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();
