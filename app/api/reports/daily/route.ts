import { NextResponse, type NextRequest } from "next/server";
import { getServerLocale } from "@/lib/i18n/server";
import { getDailyReportData } from "@/lib/reports/queries";
import { dailyReportToCsv } from "@/lib/reports/csv";
import { ReportPermissionError } from "@/lib/reports/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/reports/daily?date=YYYY-MM-DD[&userId=...]
 *
 * Read-only CSV export for one date. `userId` is only honored for an
 * admin requesting another user's report — lib/reports/permissions.ts
 * enforces that server-side on every call, never trusting this query
 * param on its own. Never creates or modifies a daily_practice_logs row.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");

  if (!date || !DATE_PATTERN.test(date)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }

  try {
    const locale = getServerLocale();
    const report = await getDailyReportData(date, locale, userId);
    const csv = dailyReportToCsv(report);

    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="al-burhan-report-${report.date}.csv"`,
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
