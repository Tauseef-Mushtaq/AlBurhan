-- 0007_adhkar_custom_targets.sql
--
-- Adds support for per-user, per-practice custom targets (e.g. a user
-- raising their Istighfar goal from 30 to 50), while preserving historical
-- reports exactly as they were recorded even after the user's target
-- changes later.
--
-- Two pieces:
--
-- 1. user_practice_settings — the user's *current/future* target for a
--    given practice item. Only read when creating a NEW daily log row
--    (i.e. the first time that practice is touched on a given day).
--
-- 2. daily_practice_logs.target_value — a snapshot of whichever target
--    was applicable on the day that row was created. Once a row exists,
--    its target_value is never rewritten by a later settings change, so
--    Monday's "30/30" stays "30/30" even if the user raises their target
--    to 50 on Tuesday.
--
-- Existing rows are backfilled from practice_items.target_value (the only
-- target that has ever applied to them), so existing reports do not
-- change as a result of this migration.

-- ---------------------------------------------------------------------
-- 1. user_practice_settings
-- ---------------------------------------------------------------------

create table if not exists public.user_practice_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_item_id uuid not null references public.practice_items(id) on delete cascade,
  target_value int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, practice_item_id),
  -- Mirrors the server-side bounds enforced in lib/settings/adhkarActions.ts
  -- (integer, 1..1000). A DB-level check exists as defense-in-depth in
  -- case a row is ever written outside that action.
  constraint user_practice_settings_target_bounds check (target_value between 1 and 1000)
);

create index if not exists user_practice_settings_user_id_idx
  on public.user_practice_settings(user_id);

drop trigger if exists user_practice_settings_set_updated_at on public.user_practice_settings;
create trigger user_practice_settings_set_updated_at
  before update on public.user_practice_settings
  for each row execute function public.set_updated_at();

alter table public.user_practice_settings enable row level security;

-- Users may read/write only their own settings.
drop policy if exists "user_practice_settings_select_own" on public.user_practice_settings;
create policy "user_practice_settings_select_own"
  on public.user_practice_settings for select
  using (auth.uid() = user_id);

drop policy if exists "user_practice_settings_insert_own" on public.user_practice_settings;
create policy "user_practice_settings_insert_own"
  on public.user_practice_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_practice_settings_update_own" on public.user_practice_settings;
create policy "user_practice_settings_update_own"
  on public.user_practice_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_practice_settings_delete_own" on public.user_practice_settings;
create policy "user_practice_settings_delete_own"
  on public.user_practice_settings for delete
  using (auth.uid() = user_id);

-- Admins can read and write any user's settings (to configure a target on
-- their behalf from /admin/users/[id]), reusing the existing is_admin()
-- helper rather than a new authorization mechanism. Admins never get an
-- unrestricted `using (true)` — every admin policy still requires
-- is_admin() to be true for the *caller*, re-checked per row via the
-- SECURITY DEFINER function.
drop policy if exists "user_practice_settings_select_admin" on public.user_practice_settings;
create policy "user_practice_settings_select_admin"
  on public.user_practice_settings for select
  using (public.is_admin());

drop policy if exists "user_practice_settings_write_admin" on public.user_practice_settings;
create policy "user_practice_settings_write_admin"
  on public.user_practice_settings for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "user_practice_settings_insert_admin" on public.user_practice_settings;
create policy "user_practice_settings_insert_admin"
  on public.user_practice_settings for insert
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. daily_practice_logs.target_value — historical snapshot
-- ---------------------------------------------------------------------

alter table public.daily_practice_logs
  add column if not exists target_value int;

-- Backfill: every existing row's applicable target has only ever been
-- practice_items.target_value (custom targets didn't exist before this
-- migration), so this exactly preserves current report output.
update public.daily_practice_logs as log
set target_value = item.target_value
from public.practice_items as item
where log.practice_item_id = item.id
  and log.target_value is null;

-- Any row that still has no target_value (its practice_item_id no longer
-- resolves, e.g. an orphaned row from deleted reference data) falls back
-- to 30, the platform's original default, rather than being left null.
update public.daily_practice_logs
set target_value = 30
where target_value is null;

alter table public.daily_practice_logs
  alter column target_value set not null;

alter table public.daily_practice_logs
  alter column target_value set default 30;

-- Sanity bound only — this is NOT the "performed value" cap. A user's
-- actual performed count is intentionally allowed to exceed target_value
-- (e.g. 75 performed against a target of 50 is valid and must display
-- and export as 75/50, never clamped down to 50/50). This only guards
-- against a target itself being nonsensical.
alter table public.daily_practice_logs
  add constraint daily_practice_logs_target_value_positive check (target_value > 0);

-- ---------------------------------------------------------------------
-- 3. Immutability: target_value can only ever be set once, at row
--    creation. daily_logs_update_own (0004) allows a user to update
--    their own row's `value`/`completed` freely, and that policy has no
--    column-level restriction — without this trigger, a user could call
--    the Supabase client directly and rewrite target_value on an
--    existing (already-reported) row, silently changing a past day's
--    30/30 into 30/50. This is deliberately unconditional (applies to
--    admins too): the whole point of snapshotting is that no one can
--    rewrite a historical target after the fact.
-- ---------------------------------------------------------------------

create or replace function public.prevent_target_value_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target_value is distinct from old.target_value then
    raise exception 'target_value cannot be changed after the log is created';
  end if;
  return new;
end;
$$;

drop trigger if exists daily_practice_logs_lock_target_value on public.daily_practice_logs;
create trigger daily_practice_logs_lock_target_value
  before update on public.daily_practice_logs
  for each row execute function public.prevent_target_value_change();
