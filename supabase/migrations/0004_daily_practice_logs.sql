-- Module 2: daily_practice_logs
-- Run after 0003_practice_items.sql. This is the only user-owned,
-- frequently-written table in Module 2 — RLS here is critical.

create table if not exists public.daily_practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_item_id uuid not null references public.practice_items(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  value int not null default 0,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, practice_item_id, date)
);

create index if not exists daily_practice_logs_user_date_idx
  on public.daily_practice_logs(user_id, date);

drop trigger if exists daily_practice_logs_set_updated_at on public.daily_practice_logs;
create trigger daily_practice_logs_set_updated_at
  before update on public.daily_practice_logs
  for each row execute function public.set_updated_at();

alter table public.daily_practice_logs enable row level security;

-- Users may only ever see or change their own logs.
drop policy if exists "daily_logs_select_own" on public.daily_practice_logs;
create policy "daily_logs_select_own"
  on public.daily_practice_logs for select
  using (auth.uid() = user_id);

drop policy if exists "daily_logs_insert_own" on public.daily_practice_logs;
create policy "daily_logs_insert_own"
  on public.daily_practice_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_logs_update_own" on public.daily_practice_logs;
create policy "daily_logs_update_own"
  on public.daily_practice_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_logs_delete_own" on public.daily_practice_logs;
create policy "daily_logs_delete_own"
  on public.daily_practice_logs for delete
  using (auth.uid() = user_id);

-- Admins can read every user's logs for /admin analytics. Writes remain
-- restricted to the owning user — admins never get insert/update/delete.
drop policy if exists "daily_logs_select_admin" on public.daily_practice_logs;
create policy "daily_logs_select_admin"
  on public.daily_practice_logs for select
  using (public.is_admin());
