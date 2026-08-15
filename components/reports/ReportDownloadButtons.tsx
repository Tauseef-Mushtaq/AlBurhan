"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon, Table } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ReportTemplate, type ReportTemplateLabels } from "@/components/reports/ReportTemplate";
import type { DailyReportData } from "@/lib/reports/types";
import { captureReportNode } from "@/lib/reports/captureReportNode";
import { useToast } from "@/components/ui/Toast";

export interface ReportDownloadLabels {
  download: string;
  modalTitle: string;
  pdf: string;
  image: string;
  csv: string;
  cancel: string;
  generating: string;
  generatingPdf: string;
  generatingImage: string;
  generatingCsv: string;
  error: string;
}

/**
 * "Download Report" control: a small popover offering PDF, Image, and CSV
 * for one day's report. PDF/Image are generated entirely client-side by
 * rasterizing a dedicated off-screen ReportTemplate instance (so the
 * browser — which already shapes Arabic/Urdu correctly — does the text
 * layout, not the PDF library). CSV is a plain link to the read-only
 * server route, which re-checks authorization itself.
 */
export function ReportDownloadButtons({
  report,
  dir,
  templateLabels,
  uiLabels,
  csvHref,
  fontClassName,
  disabled,
}: {
  report: DailyReportData;
  dir: "ltr" | "rtl";
  templateLabels: ReportTemplateLabels;
  uiLabels: ReportDownloadLabels;
  csvHref: string;
  fontClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "image" | null>(null);
  const [csvPending, setCsvPending] = useState(false);
  const [error, setError] = useState(false);
  const { toast } = useToast();
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
      a.download = `al-burhan-report-${report.date}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      setError(true);
      toast("error", uiLabels.error);
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
      // Captured at scale: 2 — one canvas px is half a CSS px, so divide
      // back down to get sensible PDF page points.
      const widthPt = canvas.width / 2;
      const heightPt = canvas.height / 2;
      const pdf = new JsPDF({
        orientation: widthPt > heightPt ? "landscape" : "portrait",
        unit: "pt",
        format: [widthPt, heightPt],
      });
      pdf.addImage(imgData, "PNG", 0, 0, widthPt, heightPt);
      pdf.save(`al-burhan-report-${report.date}.pdf`);
      setOpen(false);
    } catch {
      setError(true);
      toast("error", uiLabels.error);
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
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        {uiLabels.download}
      </Button>

      {/* Off-screen render target for html2canvas. Always mounted (never
          display:none) so the browser actually lays it out — opacity/
          display tricks would make html2canvas capture a blank frame. */}
      <div style={{ position: "fixed", top: 0, insetInlineStart: -99999, zIndex: -1 }} aria-hidden="true">
        <ReportTemplate
          ref={nodeRef}
          report={report}
          labels={templateLabels}
          dir={dir}
          fontClassName={fontClassName}
        />
      </div>

      {open && (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-64 rounded-lg border border-border bg-background p-4 shadow-lg animate-fade-in"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {uiLabels.modalTitle}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              role="menuitem"
              disabled={busy !== null}
              aria-busy={busy === "pdf"}
              onClick={handlePdf}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent/50 disabled:opacity-50 min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" aria-hidden="true" />
                {uiLabels.pdf}
              </span>
              {busy === "pdf" && <span className="text-xs text-muted">{uiLabels.generatingPdf}</span>}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={busy !== null}
              aria-busy={busy === "image"}
              onClick={handleImage}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent/50 disabled:opacity-50 min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
                {uiLabels.image}
              </span>
              {busy === "image" && <span className="text-xs text-muted">{uiLabels.generatingImage}</span>}
            </button>
            <a
              href={csvHref}
              role="menuitem"
              aria-busy={csvPending}
              className="flex min-h-[44px] items-center justify-between gap-2 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent/50"
              onClick={() => {
                setCsvPending(true);
                // A CSV href is a same-tab file download, not a page
                // navigation — the dropdown would otherwise never get a
                // chance to render "Preparing CSV…" before unmounting.
                // Close shortly after so the click still feels quick.
                setTimeout(() => {
                  setCsvPending(false);
                  setOpen(false);
                }, 900);
              }}
            >
              <span className="flex items-center gap-2">
                <Table className="h-4 w-4" aria-hidden="true" />
                {uiLabels.csv}
              </span>
              {csvPending && <span className="text-xs text-muted">{uiLabels.generatingCsv}</span>}
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
