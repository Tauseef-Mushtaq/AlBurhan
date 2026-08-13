# Obligatory prayer states and Day Score

Obligatory prayers (`practice_items.unit = 'prayer'`) now have three
states instead of a boolean:

| State         | Meaning                     | `value` | `completed` |
|---------------|------------------------------|---------|--------------|
| Congregation  | Performed with congregation | 2       | true         |
| Individual    | Performed without congregation | 1    | false        |
| Missed        | Not performed                | 0       | false        |

`target_value` for every farz item is `2`.

## Why this schema, not a new column

`calculateDayScore` / `practiceContribution` (lib/progress/calculations.ts)
already score every practice as `value / target_value`, clamped to
`[0, 1]`, with a shortcut to `1` when `completed` is true. Reusing that
same mechanism for prayers means:

- Congregation → `2 / 2` → **full credit** (and `completed = true`,
  so it also counts toward `completedCount` / streak-style completion
  displays exactly like any other fully-done practice).
- Individual → `1 / 2` → **half credit**.
- Missed → `0 / 2` → **no credit**.

No changes were needed to `calculateDayScore`, `calculateStreak`, or any
report/admin aggregation — they already treat this correctly because the
existing scoring philosophy (fractional credit via value/target) already
generalizes to three states once target_value is 2 instead of 1.

## Displaying prayer results

`prayerStatusFromLog(value, targetValue)` (lib/practices/types.ts) is the
single place the value → status mapping lives. It is reused by:

- the dashboard (`PrayerStatusSelector`)
- History (`HistoryPracticeList`)
- the report builder (`lib/reports/queries.ts`, which also attaches the
  localized label so PDF/image/CSV/admin never hardcode English or
  reimplement the mapping)

Nothing renders the old "Fajr ✓ / Fajr ✗" boolean display for prayer
items anymore — they always show one of the three localized states.
