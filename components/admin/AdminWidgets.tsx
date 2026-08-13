import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
        <p className="mt-2 font-display text-tight text-2xl font-medium">{value}</p>
      </div>
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
    </Card>
  );
}

export interface ChartPoint {
  label: string;
  value: number;
}

/**
 * Lightweight responsive SVG bar chart — same no-library approach as
 * components/progress/TrendChart.tsx, reused here for admin metrics
 * (active users, completions, day score, new users) instead of pulling
 * in a charting dependency.
 */
export function AdminBarChart({
  title,
  points,
  suffix = "",
  className,
}: {
  title: string;
  points: ChartPoint[];
  suffix?: string;
  className?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));

  return (
    <Card className={cn("p-0 overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
          {title}
        </h3>
      </div>
      <div className="flex h-48 items-end gap-2 px-6 py-6">
        {points.map((p, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] text-muted">
              {p.value}
              {suffix}
            </span>
            <div
              className="w-full rounded-t-sm bg-accent/70"
              style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
              aria-hidden="true"
            />
            <span className="text-[10px] text-muted">{p.label}</span>
          </div>
        ))}
        {points.length === 0 && (
          <p className="w-full text-center text-sm text-muted">—</p>
        )}
      </div>
    </Card>
  );
}

export function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-foreground/80">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${value}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function RoleBadge({
  role,
  adminLabel,
  userLabel,
}: {
  role: "user" | "admin";
  adminLabel: string;
  userLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        role === "admin" ? "bg-accent/15 text-accent" : "bg-ivory text-muted"
      )}
    >
      {role === "admin" ? adminLabel : userLabel}
    </span>
  );
}
