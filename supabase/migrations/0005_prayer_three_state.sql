-- Module: obligatory prayers get a third state (congregation / individual
-- / missed) instead of a simple boolean.
--
-- Minimal migration: no new columns, no new tables. The existing
-- (value, target_value, completed) architecture on daily_practice_logs
-- already supports this once a farz practice_item's target_value is 2
-- instead of 1:
--
--   value = 2 (== target_value)  ->  performed with congregation
--   value = 1                    ->  performed without congregation (individual)
--   value = 0                    ->  not performed
--   completed = true only when value >= target_value (congregation only)
--
-- This is deliberately consistent with how `practiceContribution()`
-- (lib/progress/calculations.ts) already scores quantitative practices:
-- value / target_value, clamped to 1. Congregation = 2/2 = full credit,
-- individual = 1/2 = half credit, missed = 0/2 = no credit. See
-- PRAYER_SCORE_BEHAVIOR.md for the product rationale.
--
-- Run after 0004_daily_practice_logs.sql.

-- 1. Allow the new 'prayer' unit alongside the existing 'boolean'/'count'.
alter table public.practice_items drop constraint if exists practice_items_unit_check;
alter table public.practice_items
  add constraint practice_items_unit_check check (unit in ('boolean', 'count', 'prayer'));

-- 2. Convert the five farz items: unit -> 'prayer', target_value 1 -> 2.
update public.practice_items
set unit = 'prayer', target_value = 2
where key in ('fajr_jamaat', 'zuhr_jamaat', 'asr_jamaat', 'maghrib_jamaat', 'isha_jamaat');

-- 3. Any existing logs for these items were written under the old
-- boolean model (value 0 or 1, completed true/false). Re-map them onto
-- the new scale so history isn't silently reinterpreted:
--   completed = true  (was "performed", congregation assumed)  -> value 2
--   completed = false and value = 0  (not performed)           -> value 0
-- There is no way to recover whether a past "performed" was with or
-- without congregation from the old data, so already-completed days are
-- credited as congregation (the more generous, previously-implied
-- reading) rather than downgraded.
update public.daily_practice_logs l
set value = case when l.completed then 2 else 0 end
from public.practice_items i
where l.practice_item_id = i.id
  and i.unit = 'prayer'
  and l.value <= 1;
