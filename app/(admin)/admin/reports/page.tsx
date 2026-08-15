import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeDirection } from "@/lib/i18n/config";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BreakdownBar, StatCard } from "@/components/admin/AdminWidgets";
import { ReportCsvButton } from "@/components/admin/ReportCsvButton";
import { PlatformReportDownloadButtons } from "@/components/admin/PlatformReportDownloadButtons";
import { getAdminReport } from "@/lib/admin/queries";
import { addDays, getTodayInTimezone, DEFAULT_TIMEZONE } from "@/lib/date";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Activity, CheckCircle2, Star, FileBarChart } from "lucide-react";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string };
}) {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const dir = localeDirection[locale];
  const r = t.admin.reports;

  const today = getTodayInTimezone(DEFAULT_TIMEZONE);
  const defaultStart = addDays(today, -6);

  const start = searchParams.start && DATE_PATTERN.test(searchParams.start) ? searchParams.start : defaultStart;
  const rawEnd = searchParams.end && DATE_PATTERN.test(searchParams.end) ? searchParams.end : today;
  const end = rawEnd > today ? today : rawEnd;
  const safeStart = start > end ? end : start;

  const report = await getAdminReport(safeStart, end, locale);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-tight text-2xl font-light tracking-tight text-foreground">
        {r.title}
      </h1>

      <Card>
        <form method="get" className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">{r.startDate}</span>
            <input
              type="date"
              name="start"
              defaultValue={safeStart}
              max={end}
              className="rounded-md border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">{r.endDate}</span>
            <input
              type="date"
              name="end"
              defaultValue={end}
              max={today}
              className="rounded-md border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <Button type="submit" size="sm">
            {r.generate}
          </Button>
          <div className="ms-auto flex items-center gap-2">
            <ReportCsvButton report={report} label={r.downloadCsv} />
            <PlatformReportDownloadButtons
              report={report}
              dir={dir}
              templateLabels={{
                brand: t.hero.eyebrow,
                reportTitle: r.title,
                totalUsers: r.totalUsers,
                activeUsers: r.activeUsers,
                practiceCompletions: r.practiceCompletions,
                avgDayScore: r.avgDayScore,
                categoryCompletion: r.categoryCompletion,
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
            generatingPdf: t.reports.generatingPdf,
            generatingImage: t.reports.generatingImage,
            generatingCsv: t.reports.generatingCsv,
                error: t.reports.error,
              }}
            />
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={r.totalUsers} value={String(report.totalUsers)} icon={Users} />
        <StatCard label={r.activeUsers} value={String(report.activeUsers)} icon={Activity} />
        <StatCard label={r.practiceCompletions} value={String(report.practiceCompletions)} icon={CheckCircle2} />
        <StatCard label={r.avgDayScore} value={`${report.avgDayScore}%`} icon={Star} />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
            {r.categoryCompletion}
          </h3>
        </div>
        <div className="space-y-5 px-6 py-6">
          {report.categoryCompletion.length === 0 ? (
            <EmptyState icon={FileBarChart} title={r.noData} />
          ) : (
            report.categoryCompletion.map((c) => (
              <BreakdownBar key={c.categoryId} label={c.name} value={c.completionRate} />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
