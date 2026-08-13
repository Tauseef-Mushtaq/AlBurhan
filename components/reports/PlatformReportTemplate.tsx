import { forwardRef } from "react";
import { LogoMark } from "@/components/ui/Logo";
import type { AdminReportData } from "@/lib/admin/types";

export interface PlatformReportTemplateLabels {
  brand: string;
  reportTitle: string;
  totalUsers: string;
  activeUsers: string;
  practiceCompletions: string;
  avgDayScore: string;
  categoryCompletion: string;
  generatedOn: string;
}

/** Same rasterization approach as the user-facing report templates —
 * built entirely from AdminReportData, which is itself produced by
 * lib/admin/queries.ts's existing getAdminReport(). No aggregation is
 * duplicated here, only laid out. */
export const PlatformReportTemplate = forwardRef<
  HTMLDivElement,
  {
    report: AdminReportData;
    labels: PlatformReportTemplateLabels;
    dir: "ltr" | "rtl";
    fontClassName?: string;
  }
>(function PlatformReportTemplate({ report, labels, dir, fontClassName }, ref) {
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

  return (
    <div
      ref={ref}
      dir={dir}
      className={fontClassName}
      style={{ width: 720, backgroundColor: "rgb(255 255 255)", color: "rgb(23 23 23)", padding: 40, boxSizing: "border-box" }}
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

      <p style={{ fontSize: 14, color: "rgb(107 107 107)", marginBottom: 24 }}>
        {report.startDate} — {report.endDate}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: labels.totalUsers, value: String(report.totalUsers) },
          { label: labels.activeUsers, value: String(report.activeUsers) },
          { label: labels.practiceCompletions, value: String(report.practiceCompletions) },
          { label: labels.avgDayScore, value: `${report.avgDayScore}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ border: "1px solid rgb(231 229 223)", borderRadius: 10, padding: "14px 18px", backgroundColor: "rgb(250 250 248)" }}
          >
            <p style={{ fontSize: 11, color: "rgb(107 107 107)", margin: 0, ...trackingLabel }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "4px 0 0" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid rgb(231 229 223)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", backgroundColor: "rgb(246 244 238)" }}>
          <span style={{ fontSize: 12, fontWeight: 600, ...trackingLabel }}>
            {labels.categoryCompletion}
          </span>
        </div>
        <div style={{ padding: 16 }}>
          {report.categoryCompletion.map((c) => (
            <div key={c.categoryId} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{c.name}</span>
                <span style={{ fontWeight: 600 }}>{c.completionRate}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, backgroundColor: "rgb(246 244 238)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${c.completionRate}%`, backgroundColor: "rgb(27 61 51)", borderRadius: 999 }} />
              </div>
            </div>
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
