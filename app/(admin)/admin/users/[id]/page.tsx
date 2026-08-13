import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeDirection } from "@/lib/i18n/config";
import { Card } from "@/components/ui/Card";
import { AdminBarChart, RoleBadge } from "@/components/admin/AdminWidgets";
import { getAdminUserDetail } from "@/lib/admin/queries";
import { addDays, formatDisplayDate, getTodayInTimezone } from "@/lib/date";
import { getDailyReportData, getRangeReportData, getDailyReportsForRange } from "@/lib/reports/queries";
import { ReportDownloadButtons } from "@/components/reports/ReportDownloadButtons";
import { DateRangeReport } from "@/components/reports/DateRangeReport";
import { DailyPracticeReport } from "@/components/reports/DailyPracticeReport";
import { UserHistoryTable } from "@/components/reports/UserHistoryTable";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { reportDate?: string; start?: string; end?: string };
}) {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const dir = localeDirection[locale];
  const ud = t.admin.userDetail;

  const detail = await getAdminUserDetail(params.id, locale);
  if (!detail) {
    notFound();
  }

  const { profile, currentStreak, avgDayScore7, avgDayScore30, completionToday, categoryPerformance, recentDayScores, recentActivity } = detail;

  const today = getTodayInTimezone(profile.timezone);
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  const reportDate =
    searchParams.reportDate && DATE_PATTERN.test(searchParams.reportDate) && searchParams.reportDate <= today
      ? searchParams.reportDate
      : today;

  const rangeEnd = searchParams.end && searchParams.end <= today ? searchParams.end : today;
  const rangeStart =
    searchParams.start && searchParams.start <= rangeEnd ? searchParams.start : addDays(rangeEnd, -13);

  const [dailyReport, rangeSummary, historyReports] = await Promise.all([
    getDailyReportData(reportDate, locale, profile.userId),
    getRangeReportData(rangeStart, rangeEnd, locale, profile.userId),
    // Reuses the same per-date report builder as the daily report and
    // downloads (lib/reports/queries.ts) — no separate scoring path for
    // the "User History" table below.
    getDailyReportsForRange(rangeStart, rangeEnd, locale, profile.userId),
  ]);

  const downloadLabels = {
    download: t.reports.download,
    modalTitle: t.reports.modalTitle,
    pdf: t.reports.pdf,
    image: t.reports.image,
    csv: t.reports.csv,
    cancel: t.reports.cancel,
    generating: t.reports.generating,
    error: t.reports.error,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {ud.backToUsers}
          </Link>
          <h1 className="mt-3 font-display text-tight text-2xl font-light tracking-tight text-foreground">
            {profile.name || profile.email}
          </h1>
        </div>
      </div>

      <Card>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
          {ud.profile}
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted">{t.admin.users.email}</dt>
            <dd className="mt-1 text-foreground/90">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-muted">{t.admin.users.role}</dt>
            <dd className="mt-1">
              <RoleBadge role={profile.role} adminLabel={t.admin.roles.admin} userLabel={t.admin.roles.user} />
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t.admin.users.timezone}</dt>
            <dd className="mt-1 text-foreground/90">{profile.timezone}</dd>
          </div>
          <div>
            <dt className="text-muted">{t.admin.users.joined}</dt>
            <dd className="mt-1 text-foreground/90">{formatDisplayDate(profile.createdAt.slice(0, 10), locale)}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
          {ud.progress}
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{ud.currentStreak}</p>
            <p className="mt-2 font-display text-tight text-2xl font-medium">{currentStreak}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{ud.completionToday}</p>
            <p className="mt-2 font-display text-tight text-2xl font-medium">{completionToday}%</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{ud.last7Days}</p>
            <p className="mt-2 font-display text-tight text-2xl font-medium">{avgDayScore7}%</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{ud.last30Days}</p>
            <p className="mt-2 font-display text-tight text-2xl font-medium">{avgDayScore30}%</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminBarChart
          title={ud.recentDayScores}
          points={recentDayScores.map((d) => ({ label: d.label, value: d.score }))}
          suffix="%"
        />
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
              {ud.categoryPerformance}
            </h3>
          </div>
          <div className="space-y-5 px-6 py-6">
            {categoryPerformance.map((c) => (
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

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
            {ud.recentActivity}
          </h3>
        </div>
        {recentActivity.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted">{ud.noActivity}</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentActivity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
                <span className="text-foreground/90">
                  {entry.itemTitle}
                  <span className="text-muted"> — {entry.categoryName}</span>
                </span>
                <span className={entry.completed ? "text-accent" : "text-muted"}>
                  {entry.completed ? t.admin.activity.completed : t.admin.activity.uncompleted}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
          {t.reports.dailyReportTitle}
        </h2>
        <Card>
          <form method="get" className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted">{t.historyPage.title}</span>
              <input
                type="date"
                name="reportDate"
                defaultValue={reportDate}
                max={today}
                className="rounded-md border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="h-11 rounded-full border border-foreground/20 px-6 text-sm font-medium hover:border-foreground/40"
            >
              {t.reports.generate}
            </button>
            <div className="ms-auto">
              {dailyReport.hasRecord ? (
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
                  uiLabels={downloadLabels}
                  csvHref={`/api/reports/daily?date=${reportDate}&userId=${profile.userId}`}
                />
              ) : (
                <span className="text-sm text-muted">{t.reports.noRecordForDate}</span>
              )}
            </div>
          </form>
        </Card>

        {dailyReport.hasRecord ? (
          <DailyPracticeReport
            report={dailyReport}
            labels={{
              dayScoreLabel: t.dashboard.dayScore,
              streakLabel: t.progressPage.streak,
              streakUnit: t.progressPage.streakUnit,
            }}
            className="mt-6"
          />
        ) : (
          <p className="mt-6 text-sm text-muted">{t.reports.noRecordForDate}</p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
          {t.reports.historyTable.title}
        </h2>
        <UserHistoryTable
          reports={historyReports}
          detailHref={(date) => `/admin/users/${params.id}?reportDate=${date}&start=${rangeStart}&end=${rangeEnd}`}
          formatDate={(d) => formatDisplayDate(d, locale)}
          labels={t.reports.historyTable}
        />
      </div>

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
          {t.reports.downloadHistory}
        </h2>
        <DateRangeReport
          summary={rangeSummary}
          formAction={`/admin/users/${params.id}`}
          start={rangeStart}
          end={rangeEnd}
          today={today}
          minDate={profile.createdAt.slice(0, 10)}
          userId={profile.userId}
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
            categoryPerformance: t.admin.userDetail.categoryPerformance,
            fullHistory: t.reports.fullHistory,
            csvFull: t.reports.csvFull,
          }}
          downloadLabels={downloadLabels}
          templateLabels={{
            brand: t.hero.eyebrow,
            reportTitle: t.reports.rangeReportTitle,
            avgDayScore: t.admin.userDetail.avgDayScore,
            currentStreak: t.admin.userDetail.currentStreak,
            streakUnit: t.progressPage.streakUnit,
            bestDay: t.reports.bestDay,
            lowestDay: t.reports.lowestDay,
            categoryPerformance: t.admin.userDetail.categoryPerformance,
            dailyTrend: t.reports.dailyTrend,
            generatedOn: t.reports.generatedOn,
          }}
          locale={locale}
          dir={dir}
        />
      </div>
    </div>
  );
}
