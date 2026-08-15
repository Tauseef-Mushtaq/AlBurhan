import { cache } from "react";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getTodayInTimezone, DEFAULT_TIMEZONE } from "@/lib/date";
import type {
  CategoryWithPractices,
  DailyPracticeLog,
  PracticeCategory,
  PracticeItem,
  UserPracticeSetting,
} from "@/lib/practices/types";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  timezone: string;
  language: string;
  role: "user" | "admin";
}

/**
 * The signed-in user's profile row. Returns null if not authenticated.
 *
 * Memoized per request: profile is read from many independent code paths
 * (page components, getCurrentTimezone, report subject resolution, …) in
 * the course of rendering a single page — without this, a Today-page
 * render alone triggered 3+ identical `profiles` selects.
 */
export const getCurrentProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, user_id, name, email, timezone, language, role")
    .eq("user_id", user.id)
    .single();

  return (data as UserProfile) ?? null;
});

/** The user's saved timezone, falling back to the platform default. Used
 * anywhere "today" needs to be resolved consistently (Today, Progress,
 * History, streaks). Memoized per request (see getCurrentProfile). */
export const getCurrentTimezone = cache(async (): Promise<string> => {
  const profile = await getCurrentProfile();
  return profile?.timezone ?? DEFAULT_TIMEZONE;
});

/**
 * All active categories + items, in display/sort order, with no logs
 * attached. This is global reference data — identical for every user and
 * essentially static within a request — so it's memoized per request.
 * Today, Progress, History, and reports each ask for this independently;
 * before memoization that was a duplicate pair of queries (categories +
 * items) per call.
 */
export const getCategoriesWithItems = cache(async (): Promise<
  { category: PracticeCategory; items: PracticeItem[] }[]
> => {
  const supabase = createClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("practice_categories").select("*").order("display_order", { ascending: true }),
    supabase
      .from("practice_items")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const itemsByCategory = new Map<string, PracticeItem[]>();
  for (const item of (items as PracticeItem[]) ?? []) {
    const list = itemsByCategory.get(item.category_id) ?? [];
    list.push(item);
    itemsByCategory.set(item.category_id, list);
  }

  return ((categories as PracticeCategory[]) ?? []).map((category) => ({
    category,
    items: itemsByCategory.get(category.id) ?? [],
  }));
});

/**
 * Raw logs for the signed-in user across an inclusive date range
 * (YYYY-MM-DD). Read-only — never creates rows for dates without one.
 *
 * Memoized per request per exact (startDate, endDate) pair. Today's page
 * alone calls this with the same single-day range from two independent
 * paths (getPracticesForDate and the report builder) — this collapses
 * that back down to one query, without caching across different ranges
 * (e.g. a single day vs. a 90-day streak window stay separate queries,
 * since they need different rows).
 */
export const getLogsForDateRange = cache(async function getLogsForDateRange(
  startDate: string,
  endDate: string
): Promise<DailyPracticeLog[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("daily_practice_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate);

  return (data as DailyPracticeLog[]) ?? [];
});

/**
 * The signed-in user's custom targets, as a Map<practice_item_id, target>.
 * Only ever consulted when a *new* daily log row is created — an existing
 * row's own target_value snapshot always wins (see attachLogsForDate).
 * Memoized per request like the other lookups here.
 */
export const getUserPracticeTargetsMap = cache(async (): Promise<Map<string, number>> => {
  const user = await getAuthUser();
  if (!user) return new Map();

  const supabase = createClient();
  const { data } = await supabase
    .from("user_practice_settings")
    .select("practice_item_id, target_value")
    .eq("user_id", user.id);

  return new Map(
    ((data as Pick<UserPracticeSetting, "practice_item_id" | "target_value">[]) ?? []).map(
      (row) => [row.practice_item_id, row.target_value]
    )
  );
});

/** Joins the static category/item structure with one date's logs. */
export function attachLogsForDate(
  structure: { category: PracticeCategory; items: PracticeItem[] }[],
  logs: DailyPracticeLog[],
  userTargets: Map<string, number> = new Map()
): CategoryWithPractices[] {
  const logsByItemId = new Map<string, DailyPracticeLog>(
    logs.map((log) => [log.practice_item_id, log])
  );

  return structure.map(({ category, items }) => ({
    ...category,
    items: items.map((item) => {
      const log = logsByItemId.get(item.id) ?? null;
      // Effective target for display/scoring, in priority order:
      // 1. The log's own snapshot, if a log already exists for this day
      //    (this is what makes history immune to later settings changes).
      // 2. The user's current custom setting, if this day hasn't been
      //    logged yet (so "today, not yet started" shows the right goal
      //    before the first write creates the snapshot).
      // 3. The practice item's built-in default (30, or whatever the
      //    reference data specifies for non-adhkar items).
      const effectiveTarget = log?.target_value ?? userTargets.get(item.id) ?? item.target_value;
      return {
        ...item,
        target_value: effectiveTarget,
        log,
      };
    }),
  }));
}

/**
 * All active categories and practice items, each joined with the current
 * user's log for the given date (defaults to "today" in their timezone).
 * A missing log simply means the practice hasn't been recorded yet.
 */
export async function getPracticesForDate(
  date?: string
): Promise<{ date: string; categories: CategoryWithPractices[] }> {
  const user = await getAuthUser();

  if (!user) {
    return { date: date ?? getTodayInTimezone(), categories: [] };
  }

  const timezone = await getCurrentTimezone();
  const targetDate = date ?? getTodayInTimezone(timezone);

  const [structure, logs, userTargets] = await Promise.all([
    getCategoriesWithItems(),
    getLogsForDateRange(targetDate, targetDate),
    getUserPracticeTargetsMap(),
  ]);

  return { date: targetDate, categories: attachLogsForDate(structure, logs, userTargets) };
}
