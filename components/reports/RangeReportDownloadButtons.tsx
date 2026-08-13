"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon, Table } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  RangeReportTemplate,
  type RangeReportTemplateLabels,
} from "@/components/reports/RangeReportTemplate";
import type { RangeReportSummary } from "@/lib/reports/types";
import type { ReportDownloadLabels } from "@/components/reports/ReportDownloadButtons";
import type { Locale } from "@/lib/i18n/config";
import { captureReportNode } from "@/lib/reports/captureReportNode";

export function RangeReportDownloadButtons({
  summary,
  dir,
  locale,
  templateLabels,
  uiLabels,
  csvSummaryHref,
  csvFullHref,
  csvFullLabel,
  fontClassName,
}: {
  summary: RangeReportSummary;
  dir: "ltr" | "rtl";
  locale: Locale;
  templateLabels: RangeReportTemplateLabels;
  uiLabels: ReportDownloadLabels;
  csvSummaryHref: string;
  csvFullHref: string;
  csvFullLabel: string;
  fontClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "image" | null>(null);
  const [error, setError] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function captureCanvas() {
    if (!nodeRef.current) throw new Error("report template not ready");
    return captureReportNode(nodeRef.current);
  }

  async function handleImage() {
    if (busy) return;
    setBusy("image");
    setError(false);
    try {
      const canvas = await captureCanvas();
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("canvas export failed");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `al-burhan-summary-${summary.startDate}_to_${summary.endDate}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  async function handlePdf() {
    if (busy) return;
    setBusy("pdf");
    setError(false);
    try {
      const [canvas, jsPdfModule] = await Promise.all([captureCanvas(), import("jspdf")]);
      const JsPDF = jsPdfModule.default;
      const imgData = canvas.toDataURL("image/png");
      const widthPt = canvas.width / 2;
      const heightPt = canvas.height / 2;
      const pdf = new JsPDF({
        orientation: widthPt > heightPt ? "landscape" : "portrait",
        unit: "pt",
        format: [widthPt, heightPt],
      });
      pdf.addImage(imgData, "PNG", 0, 0, widthPt, heightPt);
      pdf.save(`al-burhan-summary-${summary.startDate}_to_${summary.endDate}.pdf`);
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        {uiLabels.download}
      </Button>

      <div style={{ position: "fixed", top: 0, insetInlineStart: -99999, zIndex: -1 }} aria-hidden="true">
        <RangeReportTemplate
          ref={nodeRef}
          summary={summary}
          labels={templateLabels}
          dir={dir}
          locale={locale}
          fontClassName={fontClassName}
        />
      </div>

      {open && (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-72 rounded-lg border border-border bg-background p-4 shadow-lg animate-fade-in"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {uiLabels.modalTitle}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={handlePdf}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent/50 disabled:opacity-50 min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" aria-hidden="true" />
                {uiLabels.pdf}
              </span>
              {busy === "pdf" && <span className="text-xs text-muted">{uiLabels.generating}</span>}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={handleImage}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent/50 disabled:opacity-50 min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
                {uiLabels.image}
              </span>
              {busy === "image" && <span className="text-xs text-muted">{uiLabels.generating}</span>}
            </button>
            <a
              href={csvSummaryHref}
              role="menuitem"
              className="flex min-h-[44px] items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent/50"
              onClick={() => setOpen(false)}
            >
              <Table className="h-4 w-4" aria-hidden="true" />
              {uiLabels.csv}
            </a>
            <a
              href={csvFullHref}
              role="menuitem"
              className="flex min-h-[44px] items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent/50"
              onClick={() => setOpen(false)}
            >
              <Table className="h-4 w-4" aria-hidden="true" />
              {csvFullLabel}
            </a>
          </div>
          {error && <p className="mt-3 text-xs text-red-600" role="alert">{uiLabels.error}</p>}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full py-1 text-center text-xs text-muted hover:text-foreground"
          >
            {uiLabels.cancel}
          </button>
        </div>
      )}
    </div>
  );
}
