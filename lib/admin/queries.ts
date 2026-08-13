import { createClient } from "@/lib/supabase/server";
import { getCategoriesWithItems, attachLogsForDate } from "@/lib/practices/queries";
import { calculateDayScore, calculateStreak } from "@/lib/progress/calculations";
import { localizedCategoryName, localizedItemTitle } from "@/lib/practices/types";
import type { PracticeCategory, PracticeItem, DailyPracticeLog } from "@/lib/practices/types";
import { addDays, getTodayInTimezone, getWeekBoundaries, DEFAULT_TIMEZONE } from "@/lib/date";
import type { Locale } from "@/lib/i18n/config";
import type {
  AdminOverviewStats,
  AdminActivityPoint,
  AdminCategoryStat,
  AdminUserRow,
  AdminUserListResult,
  AdminUserDetail,
  AdminActivityEntry,
  AdminAnalytics,
  AdminGrowthPoint,
  AdminReportData,
} from "@/lib/admin/types";

type Structure = { category: PracticeCategory; items: PracticeItem[] }[];

/**
 * Platform-wide "today" used for every admin aggregate. Individual users
 * record against their own local day (see lib/date), but a single admin
 * dashboard needs one consistent day boundary — the platform default
 * timezone is used here, same as new profiles default to.
 */
function platformToday(): string {
  return getTodayInTimezone(DEFAULT_TIMEZONE);
}

function formatWeekdayLabel(dateStr: string, locale: Locale): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale, {
    timeZone: "UTC",
    weekday: "short",
  }).format(dt);
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

/** All active categories + items — global reference data, identical for
 * every user, fetched once per request and reused across every per-user
 * score computation below. */
async function getStructure(): Promise<Structure> {
  return getCategoriesWithItems();
}

/** Every practice log across every user for an inclusive date range.
 * Relies on the admin-only RLS policy — never filters by user_id.
 * Exported for lib/reports, which needs the same admin-scoped read when
 * building a report for a user other than the caller. */
export async function getAllLogsForRange(
  startDate: string,
  endDate: string
): Promise<DailyPracticeLog[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_practice_logs")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);
  return (data as DailyPracticeLog[]) ?? [];
}

async function getAllProfileIds(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("user_id");
  return ((data as { user_id: string }[]) ?? []).map((p) => p.user_id);
}

function groupLogsByUser(logs: DailyPracticeLog[]): Map<string, DailyPracticeLog[]> {
  const byUser = new Map<string, DailyPracticeLog[]>();
  for (const log of logs) {
    const list = byUser.get(log.user_id) ?? [];
    list.push(log);
    byUser.set(log.user_id, list);
  }
  return byUser;
}

/**
 * Average Day Score, across `userIds`, for a single date — computed by
 * reusing calculateDayScore per user (a user with no logs that day simply
 * scores 0, same as it would on their own Today page).
 */
function averageDayScoreForDate(
  structure: Structure,
  logsByUser: Map<string, DailyPracticeLog[]>,
  userIds: string[],
  date: string,
  locale: Locale
): number {
  if (userIds.length === 0) return 0;
  const total = userIds.reduce((sum, userId) => {
    const userLogs = (logsByUser.get(userId) ?? []).filter((l) => l.date === date);
    const categories = attachLogsForDate(structure, userLogs);
    return sum + calculateDayScore(date, categories, locale).score;
  }, 0);
  return Math.round(total / userIds.length);
}

/**
 * Category completion rate, defined as: of the practice logs recorded
 * for items in this category within the window, what share were marked
 * completed. This only counts practices users actually engaged with —
 * it does not penalize a category for users who never opened the app,
 * since there is no meaningful per-user-per-day denominator for that.
 */
function categoryCompletionRates(
  structure: Structure,
  logs: DailyPracticeLog[],
  locale: Locale
): AdminCategoryStat[] {
  const itemToCategory = new Map<string, { id: string; name: string; color: string | null }>();
  for (const { category, items } of structure) {
    for (const item of items) {
      itemToCategory.set(item.id, {
        id: category.id,
        name: localizedCategoryName(category, locale),
        color: category.color,
      });
    }
  }

  const totals = new Map<string, { completed: number; total: number; name: string; color: string | null }>();
  for (const { category } of structure) {
    totals.set(category.id, {
      completed: 0,
      total: 0,
      name: localizedCategoryName(category, locale),
      color: category.color,
    });
  }

  for (const log of logs) {
    const cat = itemToCategory.get(log.practice_item_id);
    if (!cat) continue;
    const bucket = totals.get(cat.id);
    if (!bucket) continue;
    bucket.total += 1;
    if (log.completed) bucket.completed += 1;
  }

  return structure.map(({ category }) => {
    const bucket = totals.get(category.id)!;
    return {
      categoryId: category.id,
      name: bucket.name,
      color: bucket.color,
      completionRate: bucket.total > 0 ? Math.round((bucket.completed / bucket.total) * 100) : 0,
    };
  });
}

export async function getAdminOverviewStats(locale: Locale): Promise<AdminOverviewStats> {
  const today = platformToday();
  const weekStart = getWeekBoundaries(today).start;
  const rangeStart = weekStart < addDays(today, -6) ? weekStart : addDays(today, -6);

  const [structure, allProfileIds, weekLogs] = await Promise.all([
    getStructure(),
    getAllProfileIds(),
    getAllLogsForRange(rangeStart, today),
  ]);

  const logsByUser = groupLogsByUser(weekLogs);
  const todaysLogs = weekLogs.filter((l) => l.date === today);
  const weeksLogs = weekLogs.filter((l) => l.date >= weekStart);

  const activeTodayUsers = new Set(todaysLogs.map((l) => l.user_id));
  const activeWeekUsers = new Set(weeksLogs.map((l) => l.user_id));
  const practicesCompletedToday = todaysLogs.filter((l) => l.completed).length;

  const avgDayScoreToday = averageDayScoreForDate(
    structure,
    logsByUser,
    allProfileIds,
    today,
    locale
  );

  const last7Dates = dateRange(addDays(today, -6), today);
  const weeklyActivity: AdminActivityPoint[] = last7Dates.map((date) => {
    const dayLogs = weekLogs.filter((l) => l.date === date);
    return {
      date,
      label: formatWeekdayLabel(date, locale),
      activeUsers: new Set(dayLogs.map((l) => l.user_id)).size,
      completions: dayLogs.filter((l) => l.completed).length,
      avgScore: averageDayScoreForDate(structure, logsByUser, allProfileIds, date, locale),
    };
  });

  const categoryCompletion = categoryCompletionRates(structure, weekLogs, locale);

  return {
    totalUsers: allProfileIds.length,
    activeToday: activeTodayUsers.size,
    activeThisWeek: activeWeekUsers.size,
    practicesCompletedToday,
    avgDayScoreToday,
    weeklyActivity,
    categoryCompletion,
  };
}

export async function getAdminUsers(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserListResult> {
  const pageSize = params.pageSize ?? 20;
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select("id, user_id, name, email, role, timezone, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.search && params.search.trim()) {
    const term = params.search.trim().replace(/[%_]/g, "");
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, count } = await query.range(from, to);
  const rows = (data as {
    id: string;
    user_id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    timezone: string;
    created_at: string;
  }[]) ?? [];

  const userIds = rows.map((r) => r.user_id);
  const lastActivityByUser = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: recentLogs } = await supabase
      .from("daily_practice_logs")
      .select("user_id, date")
      .in("user_id", userIds)
      .order("date", { ascending: false });

    for (const log of (recentLogs as { user_id: string; date: string }[]) ?? []) {
      if (!lastActivityByUser.has(log.user_id)) {
        lastActivityByUser.set(log.user_id, log.date);
      }
    }
  }

  const users: AdminUserRow[] = rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    email: r.email,
    role: r.role,
    timezone: r.timezone,
    createdAt: r.created_at,
    lastActivity: lastActivityByUser.get(r.user_id) ?? null,
  }));

  return { users, page, pageSize, totalCount: count ?? users.length };
}

export async function getAdminUserDetail(
  userId: string,
  locale: Locale
): Promise<AdminUserDetail | null> {
  const supabase = createClient();
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, user_id, name, email, role, timezone, created_at")
    .eq("user_id", userId)
    .single();

  if (!profileRow) return null;

  const today = platformToday();
  const windowStart = addDays(today, -89); // 90-day window for streak + trends

  const [structure, logs] = await Promise.all([
    getStructure(),
    getAllLogsForRange(windowStart, today),
  ]);

  const userLogs = logs.filter((l) => l.user_id === userId);

  const dates90 = dateRange(windowStart, today);
  const dayScores = dates90.map((date) => {
    const dayLogs = userLogs.filter((l) => l.date === date);
    const categories = attachLogsForDate(structure, dayLogs);
    return calculateDayScore(date, categories, locale);
  });

  const { currentStreak } = calculateStreak(dayScores.map((d) => d.score));

  const last7 = dayScores.slice(-7);
  const last30 = dayScores.slice(-30);
  const avgDayScore7 = last7.length
    ? Math.round(last7.reduce((s, d) => s + d.score, 0) / last7.length)
    : 0;
  const avgDayScore30 = last30.length
    ? Math.round(last30.reduce((s, d) => s + d.score, 0) / last30.length)
    : 0;

  const todayScore = dayScores[dayScores.length - 1];

  const recentDayScores = dayScores.slice(-14).map((d) => ({
    date: d.date,
    label: formatWeekdayLabel(d.date, locale),
    score: d.score,
  }));

  const itemById = new Map<string, PracticeItem>();
  const categoryByItemId = new Map<string, PracticeCategory>();
  for (const { category, items } of structure) {
    for (const item of items) {
      itemById.set(item.id, item);
      categoryByItemId.set(item.id, category);
    }
  }

  const recentActivity: AdminActivityEntry[] = userLogs
    .filter((l) => l.completed_at)
    .sort((a, b) => (b.completed_at! > a.completed_at! ? 1 : -1))
    .slice(0, 15)
    .map((log) => {
      const item = itemById.get(log.practice_item_id);
      const category = categoryByItemId.get(log.practice_item_id);
      return {
        id: log.id,
        type: "practice" as const,
        userName: profileRow.name,
        userId,
        itemTitle: item ? localizedItemTitle(item, locale) : undefined,
        categoryName: category ? localizedCategoryName(category, locale) : undefined,
        completed: log.completed,
        timestamp: log.completed_at as string,
      };
    });

  return {
    profile: {
      id: profileRow.id,
      userId: profileRow.user_id,
      name: profileRow.name,
      email: profileRow.email,
      role: profileRow.role,
      timezone: profileRow.timezone,
      createdAt: profileRow.created_at,
    },
    currentStreak,
    avgDayScore7,
    avgDayScore30,
    completionToday: todayScore?.score ?? 0,
    categoryPerformance: todayScore?.categories ?? [],
    recentDayScores,
    recentActivity,
  };
}

export async function getAdminActivity(limit = 30): Promise<AdminActivityEntry[]> {
  const supabase = createClient();

  const [{ data: logs }, { data: recentProfiles }] = await Promise.all([
    supabase
      .from("daily_practice_logs")
      .select("id, user_id, practice_item_id, completed, completed_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("profiles")
      .select("id, user_id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const logRows = (logs as {
    id: string;
    user_id: string;
    practice_item_id: string;
    completed: boolean;
    completed_at: string | null;
    updated_at: string;
  }[]) ?? [];
  const profileRows = (recentProfiles as { id: string; user_id: string; name: string; created_at: string }[]) ?? [];

  const userIds = Array.from(new Set(logRows.map((l) => l.user_id)));
  const itemIds = Array.from(new Set(logRows.map((l) => l.practice_item_id)));

  const [{ data: profilesForLogs }, { data: items }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("user_id, name").in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; name: string }[] }),
    itemIds.length
      ? supabase.from("practice_items").select("id, category_id, title_en, title_ur, title_ar").in("id", itemIds)
      : Promise.resolve({ data: [] as { id: string; category_id: string; title_en: string; title_ur: string; title_ar: string }[] }),
  ]);

  const nameByUser = new Map(
    ((profilesForLogs as { user_id: string; name: string }[]) ?? []).map((p) => [p.user_id, p.name])
  );
  const itemById = new Map(
    ((items as { id: string; category_id: string; title_en: string; title_ur: string; title_ar: string }[]) ?? []).map(
      (i) => [i.id, i]
    )
  );

  const practiceEntries: AdminActivityEntry[] = logRows.map((log) => {
    const item = itemById.get(log.practice_item_id);
    return {
      id: `log-${log.id}`,
      type: "practice",
      userName: nameByUser.get(log.user_id) ?? "—",
      userId: log.user_id,
      itemTitle: item?.title_en,
      completed: log.completed,
      timestamp: log.completed_at ?? log.updated_at,
    };
  });

  const newUserEntries: AdminActivityEntry[] = profileRows.map((p) => ({
    id: `user-${p.id}`,
    type: "new_user",
    userName: p.name,
    userId: p.user_id,
    timestamp: p.created_at,
  }));

  return [...practiceEntries, ...newUserEntries]
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
    .slice(0, limit);
}

export async function getAdminAnalytics(locale: Locale): Promise<AdminAnalytics> {
  const today = platformToday();
  const start30 = addDays(today, -29);

  const supabase = createClient();
  const [structure, logs30, { data: allProfiles }] = await Promise.all([
    getStructure(),
    getAllLogsForRange(start30, today),
    supabase.from("profiles").select("user_id, created_at").order("created_at", { ascending: true }),
  ]);

  const profileRows = (allProfiles as { user_id: string; created_at: string }[]) ?? [];
  const allUserIds = profileRows.map((p) => p.user_id);
  const logsByUser = groupLogsByUser(logs30);

  const dates30 = dateRange(start30, today);
  const dates7 = dates30.slice(-7);

  function buildActivityPoints(dates: string[]): AdminActivityPoint[] {
    return dates.map((date) => {
      const dayLogs = logs30.filter((l) => l.date === date);
      return {
        date,
        label: formatWeekdayLabel(date, locale),
        activeUsers: new Set(dayLogs.map((l) => l.user_id)).size,
        completions: dayLogs.filter((l) => l.completed).length,
        avgScore: averageDayScoreForDate(structure, logsByUser, allUserIds, date, locale),
      };
    });
  }

  function buildGrowthPoints(dates: string[]): AdminGrowthPoint[] {
    return dates.map((date) => {
      const newUsers = profileRows.filter((p) => p.created_at.slice(0, 10) === date).length;
      const totalUsers = profileRows.filter((p) => p.created_at.slice(0, 10) <= date).length;
      return { date, label: formatWeekdayLabel(date, locale), newUsers, totalUsers };
    });
  }

  const practiceActivity30 = buildActivityPoints(dates30);
  const practiceActivity7 = practiceActivity30.slice(-7);

  const dayScoreTrend30 = practiceActivity30.map((p) => ({ date: p.date, label: p.label, score: p.avgScore }));
  const dayScoreTrend7 = dayScoreTrend30.slice(-7);

  const categoryCompletion = categoryCompletionRates(structure, logs30, locale);

  return {
    userGrowth7: buildGrowthPoints(dates7),
    userGrowth30: buildGrowthPoints(dates30),
    practiceActivity7,
    practiceActivity30,
    dayScoreTrend7,
    dayScoreTrend30,
    categoryCompletion,
  };
}

export async function getAdminReport(
  startDate: string,
  endDate: string,
  locale: Locale
): Promise<AdminReportData> {
  const [structure, logs, allProfileIds] = await Promise.all([
    getStructure(),
    getAllLogsForRange(startDate, endDate),
    getAllProfileIds(),
  ]);

  const activeUsers = new Set(logs.map((l) => l.user_id)).size;
  const practiceCompletions = logs.filter((l) => l.completed).length;

  const logsByUser = groupLogsByUser(logs);
  const dates = dateRange(startDate, endDate);
  const dailyAverages = dates.map((date) =>
    averageDayScoreForDate(structure, logsByUser, allProfileIds, date, locale)
  );
  const avgDayScore = dailyAverages.length
    ? Math.round(dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length)
    : 0;

  const categoryCompletion = categoryCompletionRates(structure, logs, locale);

  return {
    startDate,
    endDate,
    totalUsers: allProfileIds.length,
    activeUsers,
    practiceCompletions,
    avgDayScore,
    categoryCompletion,
  };
}
