import type { DailyReportData, RangeReportSummary } from "@/lib/reports/types";

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: (string | number | boolean)[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

/**
 * One row per practice for one date — matches the requested shape:
 * Name,Date,Category,Practice,Value,Target,Completed.
 * Only ever built from a DailyReportData the caller was already
 * authorized to read (see lib/reports/permissions.ts) — never takes a
 * raw user id itself.
 */
export function dailyReportToCsv(report: DailyReportData): string {
  const header = ["Name", "Date", "Category", "Practice", "Value", "Target", "Completed", "Status"];
  const rows = report.categories.flatMap((category) =>
    category.rows.map((row) => [
      report.userName,
      report.date,
      row.categoryName,
      row.practiceName,
      row.unit === "count" ? row.value : row.unit === "prayer" ? row.value : row.completed ? 1 : 0,
      row.unit === "count" || row.unit === "prayer" ? row.targetValue : 1,
      row.completed,
      row.unit === "prayer" ? row.prayerStatusLabel ?? "" : "",
    ])
  );
  return toCsv([header, ...rows]);
}

/** Same per-practice shape, across every date in a report list — used for
 * the date-range export. */
export function dailyReportsToCsv(reports: DailyReportData[]): string {
  const header = ["Name", "Date", "Category", "Practice", "Value", "Target", "Completed", "Status"];
  const rows = reports.flatMap((report) =>
    report.categories.flatMap((category) =>
      category.rows.map((row) => [
        report.userName,
        report.date,
        row.categoryName,
        row.practiceName,
        row.unit === "count" ? row.value : row.unit === "prayer" ? row.value : row.completed ? 1 : 0,
        row.unit === "count" || row.unit === "prayer" ? row.targetValue : 1,
        row.completed,
        row.unit === "prayer" ? row.prayerStatusLabel ?? "" : "",
      ])
    )
  );
  return toCsv([header, ...rows]);
}

/** Compact summary CSV for a date-range report: headline metrics, then
 * per-category averages, then the daily trend. */
export function rangeSummaryToCsv(summary: RangeReportSummary): string {
  const rows: (string | number)[][] = [
    ["Name", summary.userName],
    ["Start date", summary.startDate],
    ["End date", summary.endDate],
    ["Average Day Score", `${summary.avgDayScore}%`],
    ["Current streak (days)", summary.currentStreak],
    ["Best day", summary.bestDay ? `${summary.bestDay.date} (${summary.bestDay.score}%)` : "—"],
    ["Lowest day", summary.lowestDay ? `${summary.lowestDay.date} (${summary.lowestDay.score}%)` : "—"],
    [],
    ["Category", "Average score"],
    ...summary.categoryPerformance.map((c) => [c.name, `${c.score}%`]),
    [],
    ["Date", "Day Score"],
    ...summary.dailyTrend.map((d) => [d.date, `${d.score}%`]),
  ];
  return toCsv(rows);
}
