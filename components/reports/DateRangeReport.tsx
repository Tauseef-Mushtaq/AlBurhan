import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RangeReportDownloadButtons } from "@/components/reports/RangeReportDownloadButtons";
import type { RangeReportTemplateLabels } from "@/components/reports/RangeReportTemplate";
import type { ReportDownloadLabels } from "@/components/reports/ReportDownloadButtons";
import type { RangeReportSummary } from "@/lib/reports/types";
import { formatDisplayDate } from "@/lib/date";
import type { Locale } from "@/lib/i18n/config";

export interface DateRangeReportLabels {
  title: string;
  from: string;
  to: string;
  generate: string;
  avgDayScore: string;
  currentStreak: string;
  streakUnit: string;
  bestDay: string;
  lowestDay: string;
  categoryPerformance: string;
  fullHistory: string;
  csvFull: string;
}

export function DateRangeReport({
  summary,
  formAction,
  start,
  end,
  today,
  minDate,
  userId,
  labels,
  downloadLabels,
  templateLabels,
  locale,
  dir,
  fontClassName,
}: {
  summary: RangeReportSummary;
  formAction: string;
  start: string;
  end: string;
  today: string;
  minDate?: string;
  userId?: string;
  labels: DateRangeReportLabels;
  downloadLabels: ReportDownloadLabels;
  templateLabels: RangeReportTemplateLabels;
  locale: Locale;
  dir: "ltr" | "rtl";
  fontClassName?: string;
}) {
  const formatDate = (date: string) => formatDisplayDate(date, locale);
  const csvParams = new URLSearchParams({ start, end });
  if (userId) csvParams.set("userId", userId);

  const csvSummaryHref = `/api/reports/range?${csvParams.toString()}&detail=summary`;
  const csvFullHref = `/api/reports/range?${csvParams.toString()}&detail=full`;

  const fullHistoryParams = new URLSearchParams({ start: minDate ?? start, end: today });
  if (userId) fullHistoryParams.set("userId", userId);

  return (
    <div className="space-y-6">
      <Card>
        <form method="get" action={formAction} className="flex flex-wrap items-end gap-4">
          {userId && <input type="hidden" name="userId" value={userId} />}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">{labels.from}</span>
            <input
              type="date"
              name="start"
              defaultValue={start}
              max={end}
              min={minDate}
              className="rounded-md border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">{labels.to}</span>
            <input
              type="date"
              name="end"
              defaultValue={end}
              max={today}
              min={minDate}
              className="rounded-md border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <Button type="submit" size="sm">
            {labels.generate}
          </Button>
          <a
            href={`${formAction}?${fullHistoryParams.toString()}`}
            className="text-sm text-accent hover:underline"
          >
            {labels.fullHistory}
          </a>
          <div className="ms-auto">
            <RangeReportDownloadButtons
              summary={summary}
              dir={dir}
              locale={locale}
              templateLabels={templateLabels}
              uiLabels={downloadLabels}
              csvSummaryHref={csvSummaryHref}
              csvFullHref={csvFullHref}
              csvFullLabel={labels.csvFull}
              fontClassName={fontClassName}
            />
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{labels.avgDayScore}</p>
          <p className="mt-2 font-display text-tight text-2xl font-medium">{summary.avgDayScore}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{labels.currentStreak}</p>
          <p className="mt-2 font-display text-tight text-2xl font-medium">
            {summary.currentStreak} <span className="text-sm font-normal text-muted">{labels.streakUnit}</span>
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{labels.bestDay}</p>
          <p className="mt-2 text-sm font-medium">
            {summary.bestDay ? `${formatDate(summary.bestDay.date)} · ${summary.bestDay.score}%` : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{labels.lowestDay}</p>
          <p className="mt-2 text-sm font-medium">
            {summary.lowestDay ? `${formatDate(summary.lowestDay.date)} · ${summary.lowestDay.score}%` : "—"}
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
            {labels.categoryPerformance}
          </h3>
        </div>
        <div className="space-y-5 px-6 py-6">
          {summary.categoryPerformance.map((c) => (
            <div key={c.categoryId}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-foreground/80">{c.name}</span>
                <span className="font-medium">{c.score}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory">
                <div className="h-full rounded-full bg-accent" style={{ width: `${c.score}%` }} aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
