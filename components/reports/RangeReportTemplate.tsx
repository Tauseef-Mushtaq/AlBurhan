import { forwardRef } from "react";
import { LogoMark } from "@/components/ui/Logo";
import type { RangeReportSummary } from "@/lib/reports/types";
import { formatDisplayDate } from "@/lib/date";
import type { Locale } from "@/lib/i18n/config";

export interface RangeReportTemplateLabels {
  brand: string;
  reportTitle: string;
  avgDayScore: string;
  currentStreak: string;
  streakUnit: string;
  bestDay: string;
  lowestDay: string;
  categoryPerformance: string;
  dailyTrend: string;
  generatedOn: string;
}

/**
 * Same rasterization approach as ReportTemplate — a dedicated off-screen
 * layout captured with html2canvas, kept intentionally compact (summary
 * + category bars + a daily trend strip) rather than one page per day,
 * per the "don't make an unnecessarily enormous PDF" requirement. Full
 * day-by-day detail is available via the CSV export instead.
 *
 * Takes `locale` (serializable) rather than a `formatDate` function —
 * this is a Client Component (rendered inside RangeReportDownloadButtons),
 * so it formats dates itself via lib/date's formatDisplayDate instead of
 * receiving a closure created on the server, which React cannot serialize
 * across the Server → Client boundary.
 */
export const RangeReportTemplate = forwardRef<
  HTMLDivElement,
  {
    summary: RangeReportSummary;
    labels: RangeReportTemplateLabels;
    dir: "ltr" | "rtl";
    locale: Locale;
    fontClassName?: string;
  }
>(function RangeReportTemplate({ summary, labels, dir, locale, fontClassName }, ref) {
  const formatDate = (date: string) => formatDisplayDate(date, locale);
  const generatedAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  // Uppercase + tracked letter-spacing is a Latin typographic convention
  // for small "eyebrow" labels. It breaks Nastaliq/Naskh cursive letter-
  // joining when applied to Urdu/Arabic text, so only apply it for LTR
  // (English) reports.
  const trackingLabel: React.CSSProperties =
    dir === "ltr" ? { textTransform: "uppercase", letterSpacing: 1 } : {};
  const trackingLabelWide: React.CSSProperties =
    dir === "ltr" ? { textTransform: "uppercase", letterSpacing: 1.5 } : {};

  const maxTrend = Math.max(1, ...summary.dailyTrend.map((d) => d.score));

  return (
    <div
      ref={ref}
      dir={dir}
      className={fontClassName}
      style={{
        width: 720,
        backgroundColor: "rgb(255 255 255)",
        color: "rgb(23 23 23)",
        padding: 40,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgb(231 229 223)",
          paddingBottom: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark className="h-[26px] w-[26px]" style={{ color: "rgb(27 61 51)" }} />
          <span style={{ fontSize: 20, fontWeight: 500 }}>{labels.brand}</span>
        </div>
        <span style={{ fontSize: 12, color: "rgb(107 107 107)", ...trackingLabelWide }}>
          {labels.reportTitle}
        </span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{summary.userName || "—"}</p>
        <p style={{ fontSize: 14, color: "rgb(107 107 107)", marginTop: 4 }}>
          {formatDate(summary.startDate)} — {formatDate(summary.endDate)}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: labels.avgDayScore, value: `${summary.avgDayScore}%` },
          {
            label: labels.currentStreak,
            value: `${summary.currentStreak} ${labels.streakUnit}`,
          },
          {
            label: labels.bestDay,
            value: summary.bestDay ? `${formatDate(summary.bestDay.date)} · ${summary.bestDay.score}%` : "—",
          },
          {
            label: labels.lowestDay,
            value: summary.lowestDay ? `${formatDate(summary.lowestDay.date)} · ${summary.lowestDay.score}%` : "—",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              border: "1px solid rgb(231 229 223)",
              borderRadius: 10,
              padding: "14px 18px",
              backgroundColor: "rgb(250 250 248)",
            }}
          >
            <p style={{ fontSize: 11, color: "rgb(107 107 107)", margin: 0, ...trackingLabel }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "4px 0 0" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid rgb(231 229 223)", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "10px 16px", backgroundColor: "rgb(246 244 238)" }}>
          <span style={{ fontSize: 12, fontWeight: 600, ...trackingLabel }}>
            {labels.categoryPerformance}
          </span>
        </div>
        <div style={{ padding: "16px" }}>
          {summary.categoryPerformance.map((cat) => (
            <div key={cat.categoryId} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{cat.name}</span>
                <span style={{ fontWeight: 600 }}>{cat.score}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, backgroundColor: "rgb(246 244 238)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${cat.score}%`,
                    backgroundColor: "rgb(27 61 51)",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid rgb(231 229 223)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", backgroundColor: "rgb(246 244 238)" }}>
          <span style={{ fontSize: 12, fontWeight: 600, ...trackingLabel }}>
            {labels.dailyTrend}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, padding: 16, height: 100 }}>
          {summary.dailyTrend.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.score}%`}
              style={{
                flex: 1,
                height: `${Math.max(4, (d.score / maxTrend) * 100)}%`,
                backgroundColor: "rgb(27 61 51 / 0.55)",
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          paddingTop: 16,
          borderTop: "1px solid rgb(231 229 223)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgb(107 107 107)",
        }}
      >
        <span>{labels.brand}</span>
        <span>
          {labels.generatedOn} {generatedAt}
        </span>
      </div>
    </div>
  );
});
