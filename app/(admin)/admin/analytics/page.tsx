import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card } from "@/components/ui/Card";
import { AdminBarChart, BreakdownBar } from "@/components/admin/AdminWidgets";
import { getAdminAnalytics } from "@/lib/admin/queries";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { window?: string };
}) {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const an = t.admin.analytics;

  const window = searchParams.window === "30" ? "30" : "7";
  const analytics = await getAdminAnalytics(locale);

  const growth = window === "30" ? analytics.userGrowth30 : analytics.userGrowth7;
  const activity = window === "30" ? analytics.practiceActivity30 : analytics.practiceActivity7;
  const scoreTrend = window === "30" ? analytics.dayScoreTrend30 : analytics.dayScoreTrend7;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-tight text-2xl font-light tracking-tight text-foreground">
          {an.title}
        </h1>
        <div className="flex gap-2 text-sm">
          <a
            href="?window=7"
            className={`rounded-full px-3.5 py-1.5 ${window === "7" ? "bg-accent text-accent-foreground" : "border border-border text-foreground/70"}`}
          >
            {an.last7}
          </a>
          <a
            href="?window=30"
            className={`rounded-full px-3.5 py-1.5 ${window === "30" ? "bg-accent text-accent-foreground" : "border border-border text-foreground/70"}`}
          >
            {an.last30}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminBarChart
          title={an.userGrowth}
          points={growth.map((g) => ({ label: g.label, value: g.newUsers }))}
        />
        <AdminBarChart
          title={an.practiceActivity}
          points={activity.map((a2) => ({ label: a2.label, value: a2.completions }))}
        />
        <AdminBarChart
          title={an.dayScoreTrend}
          points={scoreTrend.map((s) => ({ label: s.label, value: s.score }))}
          suffix="%"
        />
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
              {an.categoryCompletion}
            </h3>
          </div>
          <div className="space-y-5 px-6 py-6">
            {analytics.categoryCompletion.map((c) => (
              <BreakdownBar key={c.categoryId} label={c.name} value={c.completionRate} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
