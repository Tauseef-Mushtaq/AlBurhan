import { NextResponse, type NextRequest } from "next/server";
import { getServerLocale } from "@/lib/i18n/server";
import { getDailyReportsForRange, getRangeReportData } from "@/lib/reports/queries";
import { dailyReportsToCsv, rangeSummaryToCsv } from "@/lib/reports/csv";
import { ReportPermissionError } from "@/lib/reports/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

/**
 * GET /api/reports/range?start=YYYY-MM-DD&end=YYYY-MM-DD[&userId=...][&detail=summary|full]
 *
 * `detail=summary` (default) exports the range summary (averages, best/
 * lowest day, streak, category performance, daily trend). `detail=full`
 * exports one row per practice per date — the same shape as the daily
 * export, for every date in range. Read-only; never creates logs for
 * missing dates.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const userId = searchParams.get("userId");
  const detail = searchParams.get("detail") === "full" ? "full" : "summary";

  if (!start || !end || !DATE_PATTERN.test(start) || !DATE_PATTERN.test(end) || start > end) {
    return NextResponse.json({ error: "A valid start and end date are required." }, { status: 400 });
  }

  const dayCount =
    (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) /
      86_400_000 +
    1;
  if (dayCount > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: "That date range is too large to export." }, { status: 400 });
  }

  try {
    const locale = getServerLocale();

    if (detail === "full") {
      const reports = await getDailyReportsForRange(start, end, locale, userId);
      const csv = dailyReportsToCsv(reports);
      return new NextResponse(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="al-burhan-history-${start}_to_${end}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const summary = await getRangeReportData(start, end, locale, userId);
    const csv = rangeSummaryToCsv(summary);
    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="al-burhan-summary-${start}_to_${end}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ReportPermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Unable to generate the report. Please try again." },
      { status: 500 }
    );
  }
}
