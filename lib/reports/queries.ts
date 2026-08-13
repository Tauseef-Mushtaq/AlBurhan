import {
  getCategoriesWithItems,
  getLogsForDateRange,
  attachLogsForDate,
  getCurrentProfile,
} from "@/lib/practices/queries";
import { localizedCategoryName, localizedItemTitle, prayerStatusFromLog } from "@/lib/practices/types";
import type { CategoryWithPractices, DailyPracticeLog } from "@/lib/practices/types";
import { calculateDayScore } from "@/lib/progress/calculations";
import { getStreak } from "@/lib/progress/queries";
import { getAllLogsForRange, getAdminUserDetail } from "@/lib/admin/queries";
import { enumerateDates, formatDisplayDate } from "@/lib/date";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { CategoryScore, DayScoreResult } from "@/lib/progress/types";
import { resolveReportUserId } from "@/lib/reports/permissions";
import type {
  DailyReportData,
  RangeReportSummary,
  ReportCategorySection,
} from "@/lib/reports/types";

interface ReportSubject {
  userId: string;
  userName: string;
  currentStreak: number;
}

/** Resolves who the report is for (self or, for an admin, another user)
 * and returns their display name + current streak in one shot — reusing
 * getStreak (self) or getAdminUserDetail's already-computed streak
 * (admin-on-other), never recomputing streak logic here. */
async function resolveReportSubject(
  requestedUserId: string | null | undefined,
  locale: Locale
): Promise<ReportSubject & { isAdminActingOnOther: boolean }> {
  const { userId, isAdminActingOnOther } = await resolveReportUserId(requestedUserId);

  if (!isAdminActingOnOther) {
    const [profile, streak] = await Promise.all([getCurrentProfile(), getStreak(locale)]);
    return {
      userId,
      userName: profile?.name || "",
      currentStreak: streak.currentStreak,
      isAdminActingOnOther,
    };
  }

  const detail = await getAdminUserDetail(userId, locale);
  return {
    userId,
    userName: detail?.profile.name || "",
    currentStreak: detail?.currentStreak ?? 0,
    isAdminActingOnOther,
  };
}

function buildCategorySections(
  categoriesWithLogs: CategoryWithPractices[],
  dayScore: DayScoreResult,
  locale: Locale
): ReportCategorySection[] {
  const scoreByCategoryId = new Map(dayScore.categories.map((c) => [c.categoryId, c]));
  const prayerLabels = getDictionary(locale).dashboard.prayer;

  return categoriesWithLogs.map((category) => ({
    categoryId: category.id,
    key: category.key,
    name: localizedCategoryName(category, locale),
    color: category.color,
    score: scoreByCategoryId.get(category.id)?.score ?? 0,
    rows: category.items.map((item) => {
      const value = item.log?.value ?? 0;
      const isPrayer = item.unit === "prayer";
      const prayerStatus = isPrayer ? prayerStatusFromLog(value, item.target_value) : undefined;
      return {
        categoryKey: category.key,
        categoryName: localizedCategoryName(category, locale),
        practiceKey: item.key,
        practiceName: localizedItemTitle(item, locale),
        unit: item.unit,
        value,
        targetValue: item.target_value,
        completed: item.log?.completed ?? false,
        prayerStatus,
        prayerStatusLabel: prayerStatus ? prayerLabels[prayerStatus] : undefined,
      };
    }),
  }));
}

/**
 * One bulk fetch (one structure query + one logs query for the whole
 * range, whichever side owns the RLS-scoped read) reused by both the
 * single-day report and the date-range report — no N+1 across days.
 */
async function getReportRangeRaw(
  startDate: string,
  endDate: string,
  requestedUserId: string | null | undefined
): Promise<{
  subjectUserId: string;
  isAdminActingOnOther: boolean;
  structure: Awaited<ReturnType<typeof getCategoriesWithItems>>;
  logsByDate: Map<string, DailyPracticeLog[]>;
}> {
  const { userId, isAdminActingOnOther } = await resolveReportUserId(requestedUserId);

  const [structure, logs] = await Promise.all([
    getCategoriesWithItems(),
    isAdminActingOnOther
      ? getAllLogsForRange(startDate, endDate)
      : getLogsForDateRange(startDate, endDate),
  ]);

  const scopedLogs = isAdminActingOnOther ? logs.filter((l) => l.user_id === userId) : logs;

  const logsByDate = new Map<string, DailyPracticeLog[]>();
  for (const log of scopedLogs) {
    const list = logsByDate.get(log.date) ?? [];
    list.push(log);
    logsByDate.set(log.date, list);
  }

  return { subjectUserId: userId, isAdminActingOnOther, structure, logsByDate };
}

/**
 * Every date in the range as a full DailyReportData, built from one bulk
 * fetch. Used for the practice-level date-range CSV and internally by
 * getDailyReportData (a 1-day range) and getRangeReportData.
 */
export async function getDailyReportsForRange(
  startDate: string,
  endDate: string,
  locale: Locale,
  requestedUserId?: string | null
): Promise<DailyReportData[]> {
  const [subject, raw] = await Promise.all([
    resolveReportSubject(requestedUserId, locale),
    getReportRangeRaw(startDate, endDate, requestedUserId),
  ]);

  return enumerateDates(startDate, endDate).map((date) => {
    const categoriesWithLogs = attachLogsForDate(raw.structure, raw.logsByDate.get(date) ?? []);
    const dayScore = calculateDayScore(date, categoriesWithLogs, locale);
    const hasRecord = categoriesWithLogs.some((c) => c.items.some((i) => i.log !== null));

    return {
      userId: subject.userId,
      userName: subject.userName,
      date,
      dayLabel: formatDisplayDate(date, locale),
      dayScore: dayScore.score,
      // Report-level streak is always the subject's *current* streak
      // (same figure the app shows them today), not recomputed per date.
      streak: subject.currentStreak,
      hasRecord,
      categories: buildCategorySections(categoriesWithLogs, dayScore, locale),
    };
  });
}

/** A single date's full report. Thin wrapper around getDailyReportsForRange. */
export async function getDailyReportData(
  date: string,
  locale: Locale,
  requestedUserId?: string | null
): Promise<DailyReportData> {
  const [report] = await getDailyReportsForRange(date, date, locale, requestedUserId);
  return report;
}

/** Flat practice-level rows for CSV export — every category's items for one date. */
export function flattenReportRows(report: DailyReportData) {
  return report.categories.flatMap((c) => c.rows);
}

/**
 * A date-range summary — average/best/lowest Day Score, current streak,
 * per-category averages, and a daily trend — derived from the same
 * per-date DayScoreResults getDailyReportsForRange already computes via
 * calculateDayScore. No score is computed twice.
 */
export async function getRangeReportData(
  startDate: string,
  endDate: string,
  locale: Locale,
  requestedUserId?: string | null
): Promise<RangeReportSummary> {
  const reports = await getDailyReportsForRange(startDate, endDate, locale, requestedUserId);
  if (reports.length === 0) {
    const subject = await resolveReportSubject(requestedUserId, locale);
    return {
      userId: subject.userId,
      userName: subject.userName,
      startDate,
      endDate,
      avgDayScore: 0,
      bestDay: null,
      lowestDay: null,
      currentStreak: subject.currentStreak,
      categoryPerformance: [],
      dailyTrend: [],
    };
  }

  const avgDayScore = Math.round(
    reports.reduce((sum, r) => sum + r.dayScore, 0) / reports.length
  );

  let bestDay: { date: string; score: number } | null = null;
  let lowestDay: { date: string; score: number } | null = null;
  for (const r of reports) {
    if (!bestDay || r.dayScore > bestDay.score) bestDay = { date: r.date, score: r.dayScore };
    if (!lowestDay || r.dayScore < lowestDay.score) lowestDay = { date: r.date, score: r.dayScore };
  }

  const categoryPerformance = averageCategoryScores(reports);

  const dailyTrend = reports.map((r) => ({ date: r.date, label: r.dayLabel, score: r.dayScore }));

  return {
    userId: reports[0].userId,
    userName: reports[0].userName,
    startDate,
    endDate,
    avgDayScore,
    bestDay,
    lowestDay,
    currentStreak: reports[0].streak,
    categoryPerformance,
    dailyTrend,
  };
}

/** Averages each category's already-computed per-day score across a
 * range — the only new arithmetic here is the average itself. */
function averageCategoryScores(reports: DailyReportData[]): CategoryScore[] {
  const totals = new Map<
    string,
    { key: string; name: string; color: string | null; sum: number; count: number }
  >();

  for (const report of reports) {
    for (const cat of report.categories) {
      const bucket = totals.get(cat.categoryId) ?? {
        key: cat.key,
        name: cat.name,
        color: cat.color,
        sum: 0,
        count: 0,
      };
      bucket.sum += cat.score;
      bucket.count += 1;
      totals.set(cat.categoryId, bucket);
    }
  }

  return Array.from(totals.entries()).map(([categoryId, bucket]) => ({
    categoryId,
    key: bucket.key as CategoryScore["key"],
    name: bucket.name,
    color: bucket.color,
    completedCount: 0,
    totalCount: 0,
    score: bucket.count ? Math.round(bucket.sum / bucket.count) : 0,
  }));
}
