import { Card, SectionLabel } from "@/components/ui/Card";
import type { DayScoreResult } from "@/lib/progress/types";
import type { Dictionary } from "@/lib/i18n/types";

/**
 * Compact "Today's Progress" summary: an overall Day Score gauge plus a
 * completed/total bar per category. Fed entirely by calculateDayScore —
 * no scores are computed here.
 */
export function DailySummary({
  result,
  labels,
}: {
  result: DayScoreResult;
  labels: Dictionary["dashboard"];
}) {
  return (
    <Card className="grid grid-cols-1 gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-ivory">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(rgb(var(--color-accent)) ${result.score * 3.6}deg, transparent 0deg)`,
              mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))",
            }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold">{result.score}%</span>
        </div>
        <div>
          <SectionLabel>{labels.dayScore}</SectionLabel>
          <p className="text-sm text-foreground/80 mt-0.5">{labels.todayProgress}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {result.categories.map((category) => (
          <div key={category.categoryId} className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-foreground/70">{category.name}</span>
              <span className="shrink-0 tabular-nums font-medium text-foreground/80">
                {category.completedCount}/{category.totalCount}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300 ease-cinematic"
                style={{ width: `${category.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
