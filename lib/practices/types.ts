import type { Locale } from "@/lib/i18n/config";

export type CategoryKey =
  | "farz"
  | "nawafil"
  | "quran"
  | "morning_dhikr"
  | "evening_dhikr"
  | "character";

export interface PracticeCategory {
  id: string;
  key: CategoryKey;
  name_en: string;
  name_ur: string;
  name_ar: string;
  display_order: number;
  color: string | null;
  icon: string | null;
}

export interface PracticeItem {
  id: string;
  category_id: string;
  key: string;
  title_en: string;
  title_ur: string;
  title_ar: string;
  description_en: string | null;
  description_ur: string | null;
  description_ar: string | null;
  target_value: number;
  unit: "boolean" | "count" | "prayer";
  sort_order: number;
  is_active: boolean;
}

export interface DailyPracticeLog {
  id: string;
  user_id: string;
  practice_item_id: string;
  date: string;
  completed: boolean;
  value: number;
  /** The target applicable on the day this row was created — snapshotted
   * once, immutable after (see 0007_adhkar_custom_targets.sql). This is
   * the source of truth for "performed / target" on any day that already
   * has a log, taking precedence over both the user's current settings
   * and the practice item's default. */
  target_value: number;
  notes: string | null;
  completed_at: string | null;
}

/** A user's current custom target for a practice item (e.g. Istighfar
 * raised from 30 to 50). Only consulted when creating a *new* daily log
 * row — never used to reinterpret an existing one. */
export interface UserPracticeSetting {
  id: string;
  user_id: string;
  practice_item_id: string;
  target_value: number;
}

/** A practice item joined with (at most) today's log for the current user. */
export interface PracticeWithLog extends PracticeItem {
  log: DailyPracticeLog | null;
}

export interface CategoryWithPractices extends PracticeCategory {
  items: PracticeWithLog[];
}

export function localizedCategoryName(category: PracticeCategory, locale: Locale): string {
  if (locale === "ur") return category.name_ur;
  if (locale === "ar") return category.name_ar;
  return category.name_en;
}

export function localizedItemTitle(item: PracticeItem, locale: Locale): string {
  if (locale === "ur") return item.title_ur;
  if (locale === "ar") return item.title_ar;
  return item.title_en;
}

/** The three obligatory-prayer states. See PRAYER_SCORE_BEHAVIOR.md for
 * how each maps onto (value, target_value, completed). */
export type PrayerStatus = "congregation" | "individual" | "missed";

/**
 * Derives the prayer status from a log's stored value/target — the
 * single place this mapping is defined, reused by the dashboard, history,
 * reports (PDF/image/CSV), and the admin views so none of them can drift
 * from one another.
 */
export function prayerStatusFromLog(
  value: number | null | undefined,
  targetValue: number
): PrayerStatus {
  const v = value ?? 0;
  if (v >= targetValue) return "congregation";
  if (v > 0) return "individual";
  return "missed";
}
