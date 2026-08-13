import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeDirection } from "@/lib/i18n/config";
import { Card } from "@/components/ui/Card";
import { DateNavigator } from "@/components/history/DateNavigator";
import { getCurrentTimezone } from "@/lib/practices/queries";
import { formatDisplayDate, getTodayInTimezone } from "@/lib/date";
import { getDailyReportData } from "@/lib/reports/queries";
import { ReportDownloadButtons } from "@/components/reports/ReportDownloadButtons";
import { DailyPracticeReport } from "@/components/reports/DailyPracticeReport";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const dir = localeDirection[locale];

  const timezone = await getCurrentTimezone();
  const today = getTodayInTimezone(timezone);

  const requested = searchParams.date;
  const isValidFormat = requested ? DATE_PATTERN.test(requested) : false;

  // History is read-only and never shows the future — clamp/redirect
  // rather than silently fetching an out-of-range date.
  if (requested && (!isValidFormat || requested > today)) {
    redirect("/app/history");
  }

  const date = isValidFormat ? (requested as string) : today;

  try {
    // Single source of truth for this date's data — the ring, the
    // on-screen report, and the download all render from the same
    // DailyReportData (built via lib/progress/calculations.ts), never
    // recomputed separately per view.
    const dailyReport = await getDailyReportData(date, locale);
    const hasAnyRecord = dailyReport.hasRecord;

    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-tight text-2xl sm:text-3xl font-light tracking-tight">
            {t.historyPage.title}
          </h1>
          {hasAnyRecord && (
            <ReportDownloadButtons
              report={dailyReport}
              dir={dir}
              templateLabels={{
                brand: t.hero.eyebrow,
                reportTitle: t.reports.dailyReportTitle,
                dayScoreLabel: t.dashboard.dayScore,
                streakLabel: t.progressPage.streak,
                streakUnit: t.progressPage.streakUnit,
                generatedOn: t.reports.generatedOn,
              }}
              uiLabels={{
                download: t.reports.download,
                modalTitle: t.reports.modalTitle,
                pdf: t.reports.pdf,
                image: t.reports.image,
                csv: t.reports.csv,
                cancel: t.reports.cancel,
                generating: t.reports.generating,
                error: t.reports.error,
              }}
              csvHref={`/api/reports/daily?date=${date}`}
            />
          )}
        </div>

        <Card>
          <DateNavigator
            date={date}
            today={today}
            displayLabel={formatDisplayDate(date, locale)}
            labels={t.historyPage}
          />
        </Card>

        <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-6">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-ivory">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(rgb(var(--color-accent)) ${dailyReport.dayScore * 3.6}deg, transparent 0deg)`,
                mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
                WebkitMask:
                  "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
              }}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold">{dailyReport.dayScore}%</span>
          </div>
          <p className="text-sm text-foreground/80">{t.historyPage.dayScore}</p>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t.historyPage.allPractices}
          </h2>
          {hasAnyRecord ? (
            <DailyPracticeReport
              report={dailyReport}
              labels={{
                dayScoreLabel: t.historyPage.dayScore,
                streakLabel: t.progressPage.streak,
                streakUnit: t.progressPage.streakUnit,
              }}
            />
          ) : (
            <Card className="text-sm text-muted">{t.historyPage.noRecords}</Card>
          )}
        </div>
      </div>
    );
  } catch {
    return <Card className="text-sm text-muted">{t.historyPage.loadError}</Card>;
  }
}
