-- Module 2: practice_categories
-- Run after 0001_profiles.sql.

create table if not exists public.practice_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in (
    'farz', 'nawafil', 'quran', 'morning_dhikr', 'evening_dhikr', 'character'
  )),
  name_en text not null,
  name_ur text not null,
  name_ar text not null,
  display_order int not null default 0,
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists practice_categories_set_updated_at on public.practice_categories;
create trigger practice_categories_set_updated_at
  before update on public.practice_categories
  for each row execute function public.set_updated_at();

alter table public.practice_categories enable row level security;

-- Reference data: readable by any signed-in user, writable only via the
-- Supabase SQL Editor / service role (no insert/update/delete policy).
drop policy if exists "practice_categories_select_authenticated" on public.practice_categories;
create policy "practice_categories_select_authenticated"
  on public.practice_categories for select
  to authenticated
  using (true);

insert into public.practice_categories (key, name_en, name_ur, name_ar, display_order, color)
values
  ('farz', 'Obligatory Prayers', 'فرائض', 'الفرائض', 1, '#1B3D33'),
  ('nawafil', 'Voluntary Prayers', 'نوافل', 'النوافل', 2, '#B08D57'),
  ('quran', 'Quran', 'تلاوت', 'القرآن', 3, '#1B3D33'),
  ('morning_dhikr', 'Morning Adhkar', 'صبح کے مسنون تسبیحات', 'أذكار الصباح', 4, '#B08D57'),
  ('evening_dhikr', 'Evening Adhkar', 'شام کے مسنون تسبیحات', 'أذكار المساء', 5, '#B08D57'),
  ('character', 'Character & Avoidance', 'بچنے کی چیزیں', 'الأخلاق والاجتناب', 6, '#171717')
on conflict (key) do nothing;
