import {
  attachLogsForDate,
  getCategoriesWithItems,
  getCurrentTimezone,
  getLogsForDateRange,
} from "@/lib/practices/queries";
import { addDays, formatDisplayDate, getTodayInTimezone } from "@/lib/date";
import { calculateDayScore, calculateStreak } from "@/lib/progress/calculations";
import type { DayScoreResult, StreakResult, WeeklyPoint } from "@/lib/progress/types";
import type { Locale } from "@/lib/i18n/config";

/** The Day Score for a single date, computed from real data (no fake demo values). */
export async function getDayScore(date: string, locale: Locale): Promise<DayScoreResult> {
  const [structure, logs] = await Promise.all([
    getCategoriesWithItems(),
    getLogsForDateRange(date, date),
  ]);
  const categories = attachLogsForDate(structure, logs);
  return calculateDayScore(date, categories, locale);
}

/** Day Scores for every date in an inclusive range, oldest → newest. One
 * query for logs, reused per-date against the same static structure —
 * avoids N+1 queries for a week/month window. */
export async function getDayScoresForRange(
  startDate: string,
  endDate: string,
  locale: Locale
): Promise<DayScoreResult[]> {
  const [structure, logs] = await Promise.all([
    getCategoriesWithItems(),
    getLogsForDateRange(startDate, endDate),
  ]);

  const logsByDate = new Map<string, typeof logs>();
  for (const log of logs) {
    const list = logsByDate.get(log.date) ?? [];
    list.push(log);
    logsByDate.set(log.date, list);
  }

  const dates: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates.map((date) => {
    const categories = attachLogsForDate(structure, logsByDate.get(date) ?? []);
    return calculateDayScore(date, categories, locale);
  });
}

/** The last 7 days (inclusive of today) as chart points, oldest → newest. */
export async function getWeeklyTrend(locale: Locale): Promise<WeeklyPoint[]> {
  const timezone = await getCurrentTimezone();
  const today = getTodayInTimezone(timezone);
  const start = addDays(today, -6);

  const scores = await getDayScoresForRange(start, today, locale);

  return scores.map((s) => ({
    date: s.date,
    label: formatWeekdayLabel(s.date, locale),
    score: s.score,
  }));
}

/** The last N days (default 30) of Day Scores, oldest → newest — for a
 * compact calendar-heatmap / bar view. */
export async function getMonthlyTrend(locale: Locale, days = 30): Promise<WeeklyPoint[]> {
  const timezone = await getCurrentTimezone();
  const today = getTodayInTimezone(timezone);
  const start = addDays(today, -(days - 1));

  const scores = await getDayScoresForRange(start, today, locale);

  return scores.map((s) => ({
    date: s.date,
    label: formatWeekdayLabel(s.date, locale),
    score: s.score,
  }));
}

/** Current + longest streak, computed from the last `windowDays` of real
 * Day Scores. Returns { currentStreak: 0, longestStreak: 0 } if there is
 * no recorded activity at all in the window. */
export async function getStreak(locale: Locale, windowDays = 90): Promise<StreakResult> {
  const timezone = await getCurrentTimezone();
  const today = getTodayInTimezone(timezone);
  const start = addDays(today, -(windowDays - 1));

  const scores = await getDayScoresForRange(start, today, locale);
  return calculateStreak(scores.map((s) => s.score));
}

function formatWeekdayLabel(dateStr: string, locale: Locale): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale, {
    timeZone: "UTC",
    weekday: "short",
  }).format(dt);
}

export { formatDisplayDate };
