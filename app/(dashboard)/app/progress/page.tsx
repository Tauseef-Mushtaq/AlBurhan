import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeDirection } from "@/lib/i18n/config";
import { Card } from "@/components/ui/Card";
import { DailySummary } from "@/components/progress/DailySummary";
import { TrendChart } from "@/components/progress/TrendChart";
import { StreakBadge } from "@/components/progress/StreakBadge";
import { getPracticesForDate } from "@/lib/practices/queries";
import { calculateDayScore } from "@/lib/progress/calculations";
import { getWeeklyTrend, getMonthlyTrend, getStreak } from "@/lib/progress/queries";
import { getRangeReportData } from "@/lib/reports/queries";
import { DateRangeReport } from "@/components/reports/DateRangeReport";
import { addDays, getTodayInTimezone } from "@/lib/date";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string };
}) {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const dir = localeDirection[locale];

  try {
    const [{ date, categories }, weekly, monthly, streak] = await Promise.all([
      getPracticesForDate(),
      getWeeklyTrend(locale),
      getMonthlyTrend(locale, 30),
      getStreak(locale),
    ]);

    const dayScore = calculateDayScore(date, categories, locale);

    const today = getTodayInTimezone();
    const rangeEnd = searchParams.end && searchParams.end <= today ? searchParams.end : today;
    const rangeStart =
      searchParams.start && searchParams.start <= rangeEnd
        ? searchParams.start
        : addDays(rangeEnd, -13);
    const rangeSummary = await getRangeReportData(rangeStart, rangeEnd, locale);

    return (
      <div className="space-y-10">
        <div>
          <h1 className="font-display text-tight text-2xl sm:text-3xl font-light tracking-tight">
            {t.progressPage.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[2fr_1fr]">
          <DailySummary result={dayScore} labels={t.dashboard} />
          <StreakBadge streak={streak} labels={t.progressPage} />
        </div>

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t.progressPage.weeklyTrend}
          </h2>
          <Card>
            <TrendChart points={weekly} variant="line" />
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t.progressPage.monthlyTrend}
          </h2>
          <Card>
            <TrendChart points={monthly} variant="bars" showLabels={false} />
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t.progressPage.categoryBreakdown}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dayScore.categories.map((category) => (
              <Card key={category.categoryId}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-sm tabular-nums text-foreground/70">
                    {category.score}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300 ease-cinematic"
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t.reports.downloadHistory}
          </h2>
          <DateRangeReport
            summary={rangeSummary}
            formAction="/app/progress"
            start={rangeStart}
            end={rangeEnd}
            today={today}
            labels={{
              title: t.reports.downloadHistory,
              from: t.reports.from,
              to: t.reports.to,
              generate: t.reports.generate,
              avgDayScore: t.admin.userDetail.avgDayScore,
              currentStreak: t.admin.userDetail.currentStreak,
              streakUnit: t.progressPage.streakUnit,
              bestDay: t.reports.bestDay,
              lowestDay: t.reports.lowestDay,
              categoryPerformance: t.progressPage.categoryBreakdown,
              fullHistory: t.reports.fullHistory,
              csvFull: t.reports.csvFull,
            }}
            downloadLabels={{
              download: t.reports.download,
              modalTitle: t.reports.modalTitle,
              pdf: t.reports.pdf,
              image: t.reports.image,
              csv: t.reports.csv,
              cancel: t.reports.cancel,
              generating: t.reports.generating,
              error: t.reports.error,
            }}
            templateLabels={{
              brand: t.hero.eyebrow,
              reportTitle: t.reports.rangeReportTitle,
              avgDayScore: t.admin.userDetail.avgDayScore,
              currentStreak: t.admin.userDetail.currentStreak,
              streakUnit: t.progressPage.streakUnit,
              bestDay: t.reports.bestDay,
              lowestDay: t.reports.lowestDay,
              categoryPerformance: t.progressPage.categoryBreakdown,
              dailyTrend: t.reports.dailyTrend,
              generatedOn: t.reports.generatedOn,
            }}
            locale={locale}
            dir={dir}
          />
        </div>
      </div>
    );
  } catch {
    return (
      <Card className="text-sm text-muted">{t.progressPage.loadError}</Card>
    );
  }
}

