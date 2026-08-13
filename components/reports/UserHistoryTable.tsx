import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { DailyReportData } from "@/lib/reports/types";

export interface UserHistoryTableLabels {
  title: string;
  date: string;
  dayScore: string;
  completed: string;
  status: string;
  excellent: string;
  good: string;
  needsImprovement: string;
  noRecords: string;
}

/** Score bands only used for the display label in this table — never
 * feeds back into Day Score math, which stays entirely inside
 * lib/progress/calculations.ts. */
function statusFor(score: number, labels: UserHistoryTableLabels) {
  if (score >= 85) return { text: labels.excellent, className: "text-accent" };
  if (score >= 70) return { text: labels.good, className: "text-foreground/80" };
  return { text: labels.needsImprovement, className: "text-red-500" };
}

/**
 * Multi-day history for one user, built from the same per-date
 * DailyReportData rows the daily report and downloads use — no separate
 * scoring path. Bounded to whatever date range the caller already fetched
 * (see the date-range picker above this on the admin page), so it never
 * pulls a user's entire history into memory at once.
 */
export function UserHistoryTable({
  reports,
  detailHref,
  formatDate,
  labels,
}: {
  reports: DailyReportData[];
  /** (date: string) => href for opening that day's detailed report */
  detailHref: (date: string) => string;
  formatDate: (date: string) => string;
  labels: UserHistoryTableLabels;
}) {
  const rows = [...reports].reverse().filter((r) => r.hasRecord);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">{labels.title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted">{labels.noRecords}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs uppercase tracking-[0.1em] text-muted">
                <th className="px-6 py-3 text-start font-medium">{labels.date}</th>
                <th className="px-6 py-3 text-start font-medium">{labels.dayScore}</th>
                <th className="px-6 py-3 text-start font-medium">{labels.completed}</th>
                <th className="px-6 py-3 text-start font-medium">{labels.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const totalCount = r.categories.reduce((sum, c) => sum + c.rows.length, 0);
                const completedCount = r.categories.reduce(
                  (sum, c) => sum + c.rows.filter((row) => row.completed).length,
                  0
                );
                const status = statusFor(r.dayScore, labels);
                return (
                  <tr key={r.date} className="hover:bg-warm/60">
                    <td className="px-6 py-3">
                      <Link href={detailHref(r.date)} className="text-accent hover:underline">
                        {formatDate(r.date)}
                      </Link>
                    </td>
                    <td className="px-6 py-3 tabular-nums">{r.dayScore}%</td>
                    <td className="px-6 py-3 tabular-nums text-foreground/80">
                      {completedCount}/{totalCount}
                    </td>
                    <td className={`px-6 py-3 font-medium ${status.className}`}>{status.text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
