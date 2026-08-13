-- Module 2: practice_items
-- Run after 0002_practice_categories.sql.

create table if not exists public.practice_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.practice_categories(id) on delete cascade,
  key text not null unique,
  title_en text not null,
  title_ur text not null,
  title_ar text not null,
  description_en text,
  description_ur text,
  description_ar text,
  target_value int not null default 1,
  unit text not null default 'boolean' check (unit in ('boolean', 'count')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_items_category_id_idx on public.practice_items(category_id);

drop trigger if exists practice_items_set_updated_at on public.practice_items;
create trigger practice_items_set_updated_at
  before update on public.practice_items
  for each row execute function public.set_updated_at();

alter table public.practice_items enable row level security;

drop policy if exists "practice_items_select_authenticated" on public.practice_items;
create policy "practice_items_select_authenticated"
  on public.practice_items for select
  to authenticated
  using (true);

-- Seed data, matching the Al Burhan practice list from the product spec.
insert into public.practice_items
  (category_id, key, title_en, title_ur, title_ar, target_value, unit, sort_order)
select c.id, v.key, v.title_en, v.title_ur, v.title_ar, v.target_value, v.unit, v.sort_order
from (values
  -- Farz (obligatory, with congregation)
  ('farz', 'fajr_jamaat', 'Fajr with congregation', 'فجر با جماعت', 'الفجر جماعة', 1, 'boolean', 1),
  ('farz', 'zuhr_jamaat', 'Zuhr with congregation', 'ظہر با جماعت', 'الظهر جماعة', 1, 'boolean', 2),
  ('farz', 'asr_jamaat', 'Asr with congregation', 'عصر با جماعت', 'العصر جماعة', 1, 'boolean', 3),
  ('farz', 'maghrib_jamaat', 'Maghrib with congregation', 'مغرب با جماعت', 'المغرب جماعة', 1, 'boolean', 4),
  ('farz', 'isha_jamaat', 'Isha with congregation', 'عشاء با جماعت', 'العشاء جماعة', 1, 'boolean', 5),

  -- Nawafil (voluntary)
  ('nawafil', 'ishraq', 'Ishraq', 'اشراق', 'الإشراق', 1, 'boolean', 1),
  ('nawafil', 'chasht', 'Chasht', 'چاشت', 'الضحى', 1, 'boolean', 2),
  ('nawafil', 'awwabin', 'Awwabin', 'اوابین', 'الأوابين', 1, 'boolean', 3),

  -- Quran
  ('quran', 'surah_yaseen', 'Surah Yaseen', 'سورہ یٰسین', 'سورة يس', 1, 'boolean', 1),
  ('quran', 'surah_mulk', 'Surah Al-Mulk', 'سورہ الملک', 'سورة الملك', 1, 'boolean', 2),
  ('quran', 'half_para', 'Half Juz / half para', 'آدھا پارہ', 'نصف جزء', 1, 'boolean', 3),

  -- Morning adhkar
  ('morning_dhikr', 'morning_istighfar', 'Istighfar × 30', 'استغفار × 30', 'الاستغفار × 30', 30, 'count', 1),
  ('morning_dhikr', 'morning_durood', 'Durood Sharif × 30', 'درود شریف × 30', 'الدرود الشريف × 30', 30, 'count', 2),
  ('morning_dhikr', 'morning_kalma_3', 'Third Kalma × 30', 'تیسرا کلمہ × 30', 'الكلمة الثالثة × 30', 30, 'count', 3),
  ('morning_dhikr', 'morning_kalma_1', 'First Kalma × 30', 'پہلا کلمہ × 30', 'الكلمة الأولى × 30', 30, 'count', 4),

  -- Evening adhkar
  ('evening_dhikr', 'evening_istighfar', 'Istighfar × 30', 'استغفار × 30', 'الاستغفار × 30', 30, 'count', 1),
  ('evening_dhikr', 'evening_durood', 'Durood Sharif × 30', 'درود شریف × 30', 'الدرود الشريف × 30', 30, 'count', 2),
  ('evening_dhikr', 'evening_kalma_3', 'Third Kalma × 30', 'تیسرا کلمہ × 30', 'الكلمة الثالثة × 30', 30, 'count', 3),
  ('evening_dhikr', 'evening_kalma_1', 'First Kalma × 30', 'پہلا کلمہ × 30', 'الكلمة الأولى × 30', 30, 'count', 4),

  -- Character / avoidance
  ('character', 'guard_eyes', 'Guarding the eyes', 'نگاہوں کی حفاظت', 'غض البصر', 1, 'boolean', 1),
  ('character', 'guard_tongue', 'Guarding the tongue', 'زبان کی حفاظت', 'حفظ اللسان', 1, 'boolean', 2),
  ('character', 'guard_ears', 'Guarding the ears', 'کانوں کی حفاظت', 'حفظ السمع', 1, 'boolean', 3)
) as v(category_key, key, title_en, title_ur, title_ar, target_value, unit, sort_order)
join public.practice_categories c on c.key = v.category_key
on conflict (key) do nothing;
