/**
 * Timezone-aware date helpers. daily_practice_logs is keyed by a plain
 * "YYYY-MM-DD" date string representing the user's *local* day, not the
 * server's UTC day — so every read/write of "today" goes through here.
 */

export const DEFAULT_TIMEZONE = "Asia/Karachi";

/** Returns today's date, as YYYY-MM-DD, in the given IANA timezone. */
export function getTodayInTimezone(timezone: string = DEFAULT_TIMEZONE): string {
  return formatDateInTimezone(new Date(), timezone);
}

/** Formats an arbitrary instant as YYYY-MM-DD in the given timezone. */
export function formatDateInTimezone(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA formats as YYYY-MM-DD directly.
  return formatter.format(date);
}

/** Adds (or subtracts, with a negative value) whole days to a YYYY-MM-DD string. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function getPreviousDate(dateStr: string): string {
  return addDays(dateStr, -1);
}

export function getNextDate(dateStr: string): string {
  return addDays(dateStr, 1);
}

/** Monday-start week boundaries (inclusive) for the week containing dateStr. */
export function getWeekBoundaries(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(dt);
  start.setUTCDate(dt.getUTCDate() + diffToMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/** Every YYYY-MM-DD date in an inclusive range, oldest → newest. Shared
 * helper so callers (progress queries, admin queries, reports) stop each
 * writing their own cursor loop. */
export function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

/** Locale-aware long-form display of a YYYY-MM-DD date string. */
export function formatDisplayDate(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale, {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dt);
}
