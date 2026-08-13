import { forwardRef } from "react";
import { Check, X } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import type { DailyReportData } from "@/lib/reports/types";

export interface ReportTemplateLabels {
  brand: string;
  reportTitle: string;
  dayScoreLabel: string;
  streakLabel: string;
  streakUnit: string;
  generatedOn: string;
}

/**
 * Purely presentational — captured with html2canvas, not the live app UI,
 * so it can be laid out at a fixed print-friendly width regardless of the
 * viewport, and never leaks interactive controls into the export. `dir`
 * drives real layout mirroring (not just text-align): the browser lays
 * this out before it's rasterized, so Arabic/Urdu shaping and RTL flow
 * are exactly what the browser itself renders — never reconstructed by a
 * PDF library.
 */
export const ReportTemplate = forwardRef<
  HTMLDivElement,
  {
    report: DailyReportData;
    labels: ReportTemplateLabels;
    dir: "ltr" | "rtl";
    fontClassName?: string;
  }
>(function ReportTemplate({ report, labels, dir, fontClassName }, ref) {
  const generatedAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  // Uppercase + tracked letter-spacing is a Latin typographic convention
  // for small "eyebrow" labels. Urdu (Nastaliq) and Arabic (Naskh) are
  // cursive scripts — any nonzero letter-spacing forces the renderer to
  // break each letter's ligature/joining with its neighbor, which is
  // exactly what produced the disconnected, overlapping glyphs seen in
  // Urdu report exports. Only apply the treatment for LTR (English)
  // reports; RTL labels get the same size/weight without the spacing.
  const trackingLabel: React.CSSProperties =
    dir === "ltr" ? { textTransform: "uppercase", letterSpacing: 1 } : {};
  const trackingLabelWide: React.CSSProperties =
    dir === "ltr" ? { textTransform: "uppercase", letterSpacing: 1.5 } : {};

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
        <p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{report.userName || "—"}</p>
        <p style={{ fontSize: 14, color: "rgb(107 107 107)", marginTop: 4 }}>{report.dayLabel}</p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        <div
          style={{
            flex: 1,
            border: "1px solid rgb(231 229 223)",
            borderRadius: 10,
            padding: "16px 20px",
            backgroundColor: "rgb(250 250 248)",
          }}
        >
          <p style={{ fontSize: 11, color: "rgb(107 107 107)", margin: 0, ...trackingLabel }}>
            {labels.dayScoreLabel}
          </p>
          <p style={{ fontSize: 30, fontWeight: 600, margin: "4px 0 0", color: "rgb(27 61 51)" }}>
            {report.dayScore}%
          </p>
        </div>
        <div
          style={{
            flex: 1,
            border: "1px solid rgb(231 229 223)",
            borderRadius: 10,
            padding: "16px 20px",
            backgroundColor: "rgb(250 250 248)",
          }}
        >
          <p style={{ fontSize: 11, color: "rgb(107 107 107)", margin: 0, ...trackingLabel }}>
            {labels.streakLabel}
          </p>
          <p style={{ fontSize: 30, fontWeight: 600, margin: "4px 0 0" }}>
            {report.streak} <span style={{ fontSize: 14, fontWeight: 400, color: "rgb(107 107 107)" }}>{labels.streakUnit}</span>
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {report.categories.map((category) => (
          <div key={category.categoryId} style={{ border: "1px solid rgb(231 229 223)", borderRadius: 10, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                backgroundColor: "rgb(246 244 238)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: category.color || "rgb(27 61 51)",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, ...trackingLabel }}>
                  {category.name}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "rgb(107 107 107)" }}>{category.score}%</span>
            </div>
            <div>
              {category.rows.map((row, i) => (
                <div
                  key={row.practiceKey}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    borderTop: i === 0 ? "none" : "1px solid rgb(231 229 223)",
                    fontSize: 13,
                  }}
                >
                  <span>{row.practiceName}</span>
                  {row.unit === "count" ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: "rgb(107 107 107)" }}>
                        {row.value} / {row.targetValue}
                      </span>
                      {row.completed ? (
                        <Check style={{ width: 14, height: 14, color: "rgb(27 61 51)" }} />
                      ) : (
                        <X style={{ width: 14, height: 14, color: "rgb(200 200 200)" }} />
                      )}
                    </span>
                  ) : row.unit === "prayer" ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color:
                          row.prayerStatus === "congregation"
                            ? "rgb(27 61 51)"
                            : row.prayerStatus === "individual"
                              ? "rgb(107 107 107)"
                              : "rgb(190 60 60)",
                      }}
                    >
                      {row.prayerStatusLabel}
                    </span>
                  ) : row.completed ? (
                    <Check style={{ width: 16, height: 16, color: "rgb(27 61 51)" }} />
                  ) : (
                    <X style={{ width: 16, height: 16, color: "rgb(200 200 200)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
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
