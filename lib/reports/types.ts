import type { CategoryScore } from "@/lib/progress/types";
import type { PrayerStatus } from "@/lib/practices/types";

/**
 * Thrown by lib/reports/permissions.ts when the caller isn't authorized
 * to read the requested user's data. Route handlers catch this and
 * respond 401/403 without ever exposing a Postgres/Supabase error.
 */
export class ReportPermissionError extends Error {
  status: 401 | 403;
  constructor(message: string, status: 401 | 403) {
    super(message);
    this.status = status;
  }
}

export interface ReportPracticeRow {
  categoryKey: string;
  categoryName: string;
  practiceKey: string;
  practiceName: string;
  unit: "boolean" | "count" | "prayer";
  value: number;
  targetValue: number;
  completed: boolean;
  /** Only set when unit === "prayer". */
  prayerStatus?: PrayerStatus;
  /** Localized display text for prayerStatus, e.g. "With Congregation" —
   * computed once in lib/reports/queries.ts from the same dictionary the
   * rest of the report uses, so PDF/image/CSV/admin never hardcode
   * English or reimplement the mapping. */
  prayerStatusLabel?: string;
}

export interface ReportCategorySection {
  categoryId: string;
  key: string;
  name: string;
  color: string | null;
  score: number;
  rows: ReportPracticeRow[];
}

/** Everything a single day's report — screen, PDF, or image — is built from. */
export interface DailyReportData {
  userId: string;
  userName: string;
  date: string;
  dayLabel: string;
  dayScore: number;
  streak: number;
  hasRecord: boolean;
  categories: ReportCategorySection[];
}

export interface RangeReportSummary {
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  avgDayScore: number;
  bestDay: { date: string; score: number } | null;
  lowestDay: { date: string; score: number } | null;
  currentStreak: number;
  categoryPerformance: CategoryScore[];
  dailyTrend: { date: string; label: string; score: number }[];
}

export type ReportFormat = "pdf" | "image" | "csv";
