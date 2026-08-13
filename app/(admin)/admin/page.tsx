import { Users, Activity, CheckCircle2, Star, Users2 } from "lucide-react";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { StatCard, AdminBarChart, BreakdownBar } from "@/components/admin/AdminWidgets";
import { Card } from "@/components/ui/Card";
import { getAdminOverviewStats } from "@/lib/admin/queries";

export default async function AdminOverviewPage() {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const o = t.admin.overview;

  const stats = await getAdminOverviewStats(locale);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-tight text-2xl font-light tracking-tight text-foreground">
        {o.title}
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={o.totalUsers} value={String(stats.totalUsers)} icon={Users} />
        <StatCard label={o.activeToday} value={String(stats.activeToday)} icon={Activity} />
        <StatCard label={o.activeThisWeek} value={String(stats.activeThisWeek)} icon={Users2} />
        <StatCard label={o.avgScore} value={`${stats.avgDayScoreToday}%`} icon={Star} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          label={o.practicesCompletedToday}
          value={String(stats.practicesCompletedToday)}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminBarChart
          title={o.dailyActivity}
          points={stats.weeklyActivity.map((p) => ({ label: p.label, value: p.activeUsers }))}
          className="lg:col-span-2"
        />
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
              {o.practiceBreakdown}
            </h3>
          </div>
          <div className="space-y-5 px-6 py-6">
            {stats.categoryCompletion.map((c) => (
              <BreakdownBar key={c.categoryId} label={c.name} value={c.completionRate} />
            ))}
          </div>
        </Card>
      </div>

      <p className="text-xs text-muted">{o.demoNotice}</p>
    </div>
  );
}
