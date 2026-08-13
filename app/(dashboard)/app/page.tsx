import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeDirection } from "@/lib/i18n/config";
import { PracticeCard } from "@/components/dashboard/PracticeCard";
import { DailySummary } from "@/components/progress/DailySummary";
import { Card } from "@/components/ui/Card";
import { getCurrentProfile, getPracticesForDate } from "@/lib/practices/queries";
import { localizedCategoryName, localizedItemTitle } from "@/lib/practices/types";
import { calculateDayScore } from "@/lib/progress/calculations";
import { formatDisplayDate } from "@/lib/date";
import { getDailyReportData } from "@/lib/reports/queries";
import { ReportDownloadButtons } from "@/components/reports/ReportDownloadButtons";

export default async function TodayPage() {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const dir = localeDirection[locale];

  // getCurrentProfile, getPracticesForDate, and getDailyReportData each
  // independently need the signed-in user/profile/timezone/categories —
  // previously three sequential awaits meant three serial request
  // waterfalls. They're now request-memoized (see getAuthUser,
  // getCurrentProfile, getCategoriesWithItems, getLogsForDateRange in
  // lib/practices/queries.ts / lib/supabase/server.ts), so running them
  // concurrently here no longer risks duplicate Supabase round trips —
  // shared reads are deduped, only the genuinely independent work
  // (profile row vs. today's practices vs. building the report) actually
  // runs in parallel.
  const [profile, { date, categories }] = await Promise.all([
    getCurrentProfile(),
    getPracticesForDate(),
  ]);
  const todayLabel = formatDisplayDate(date, locale);
  const dayScore = calculateDayScore(date, categories, locale);
  const report = await getDailyReportData(date, locale);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{todayLabel}</p>
          <h1 className="mt-1 font-display text-tight text-2xl sm:text-3xl font-light tracking-tight">
            {profile?.name ? `${t.dashboard.greeting}, ${profile.name}` : t.dashboard.greeting}
          </h1>
        </div>
        <ReportDownloadButtons
          report={report}
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
      </div>

      <DailySummary result={dayScore} labels={t.dashboard} />

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {t.dashboard.todaysPractice}
        </h2>

        {categories.length === 0 ? (
          <Card className="text-sm text-muted">{t.dashboard.emptyCategories}</Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {categories.map((category) => (
              <PracticeCard
                key={category.id}
                title={localizedCategoryName(category, locale)}
                date={date}
                items={category.items.map((item) => ({
                  id: item.id,
                  label: localizedItemTitle(item, locale),
                  completed: item.log?.completed ?? false,
                  value: item.log?.value ?? 0,
                  targetValue: item.target_value,
                  unit: item.unit,
                }))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
