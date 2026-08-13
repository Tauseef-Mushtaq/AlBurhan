import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { DailyReportData } from "@/lib/reports/types";

export interface DailyPracticeReportLabels {
  dayScoreLabel: string;
  streakLabel: string;
  streakUnit: string;
}

/**
 * On-screen, read-only rendering of a single day's practice report.
 * Consumes the exact same DailyReportData shape (built from
 * lib/progress/calculations.ts via lib/reports/queries.ts) used for the
 * downloadable PDF/image (see ReportTemplate.tsx) — so the on-screen view,
 * the download, the user's own History page, and the admin's per-user
 * detail page never diverge from a single source of truth or duplicate
 * scoring logic.
 *
 * Responsive: two-column category grid on desktop, single stacked column
 * on mobile — no horizontal overflow either way.
 */
export function DailyPracticeReport({
  report,
  labels,
  className,
}: {
  report: DailyReportData;
  labels: DailyPracticeReportLabels;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-6 flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[140px] bg-warm">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{labels.dayScoreLabel}</p>
          <p className="mt-2 font-display text-tight text-2xl font-medium text-accent">{report.dayScore}%</p>
        </Card>
        <Card className="flex-1 min-w-[140px] bg-warm">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{labels.streakLabel}</p>
          <p className="mt-2 font-display text-tight text-2xl font-medium">
            {report.streak} <span className="text-sm font-normal text-muted">{labels.streakUnit}</span>
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {report.categories.map((category) => (
          <Card key={category.categoryId} className="p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color || "rgb(var(--color-accent))" }}
                  aria-hidden="true"
                />
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                  {category.name}
                </h3>
              </div>
              <span className="text-xs text-muted">{category.score}%</span>
            </div>
            <div className="divide-y divide-border px-6">
              {category.rows.map((row) => (
                <div key={row.practiceKey} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className={row.completed ? "text-foreground" : "text-foreground/70"}>
                    {row.practiceName}
                  </span>
                  {row.unit === "count" ? (
                    <span className="flex shrink-0 items-center gap-2 tabular-nums text-foreground/70">
                      {row.value} / {row.targetValue}
                      {row.completed ? (
                        <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                      ) : (
                        <X className="h-4 w-4 text-foreground/30" aria-hidden="true" />
                      )}
                    </span>
                  ) : row.unit === "prayer" ? (
                    <span
                      className={
                        row.prayerStatus === "congregation"
                          ? "shrink-0 text-xs font-medium text-accent"
                          : row.prayerStatus === "individual"
                            ? "shrink-0 text-xs font-medium text-foreground/60"
                            : "shrink-0 text-xs font-medium text-red-600"
                      }
                    >
                      {row.prayerStatusLabel}
                    </span>
                  ) : row.completed ? (
                    <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-foreground/30" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
