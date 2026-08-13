import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPreviousDate, getNextDate } from "@/lib/date";
import type { Dictionary } from "@/lib/i18n/types";

/**
 * Server-rendered prev/next navigation for /app/history. "Next" is
 * disabled once the selected date reaches today — history never shows a
 * future date.
 */
export function DateNavigator({
  date,
  today,
  displayLabel,
  labels,
}: {
  date: string;
  today: string;
  displayLabel: string;
  labels: Dictionary["historyPage"];
}) {
  const previousHref = `/app/history?date=${getPreviousDate(date)}`;
  const canGoNext = date < today;
  const nextHref = canGoNext ? `/app/history?date=${getNextDate(date)}` : undefined;

  return (
    <div className="flex items-center justify-between gap-4">
      <Link
        href={previousHref}
        aria-label={labels.previousDay}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </Link>

      <div className="text-center">
        <p className="text-sm font-medium">{displayLabel}</p>
        {date !== today && (
          <Link href="/app/history" className="text-xs text-accent hover:underline">
            {labels.todayLink}
          </Link>
        )}
      </div>

      {canGoNext ? (
        <Link
          href={nextHref!}
          aria-label={labels.nextDay}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 text-foreground/20"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
