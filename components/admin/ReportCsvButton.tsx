"use client";

import { Button } from "@/components/ui/Button";
import type { AdminReportData } from "@/lib/admin/types";

/**
 * Builds the CSV entirely client-side from data already rendered on the
 * page — no extra API route needed for something this small.
 */
export function ReportCsvButton({ report, label }: { report: AdminReportData; label: string }) {
  function download() {
    const rows: string[][] = [
      ["Metric", "Value"],
      ["Start date", report.startDate],
      ["End date", report.endDate],
      ["Total users", String(report.totalUsers)],
      ["Active users", String(report.activeUsers)],
      ["Practice completions", String(report.practiceCompletions)],
      ["Average day score", `${report.avgDayScore}%`],
      [],
      ["Category", "Completion rate"],
      ...report.categoryCompletion.map((c) => [c.name, `${c.completionRate}%`]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `al-burhan-report-${report.startDate}_to_${report.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={download}>
      {label}
    </Button>
  );
}
