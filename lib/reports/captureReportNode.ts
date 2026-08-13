import type html2canvasType from "html2canvas";

/**
 * The font families a captured report node might use, keyed by the
 * exact weights actually referenced in ReportTemplate / RangeReportTemplate
 * / PlatformReportTemplate. Kept in one place so every download button
 * component waits for the same, correct set rather than each guessing.
 */
const REPORT_FONT_FACES: { family: string; weight: string }[] = [
  { family: "Inter", weight: "400" },
  { family: "Inter", weight: "500" },
  { family: "Inter", weight: "600" },
  { family: "Fraunces", weight: "500" },
  { family: "Noto Nastaliq Urdu", weight: "400" },
  { family: "Noto Nastaliq Urdu", weight: "700" },
  { family: "Noto Naskh Arabic", weight: "400" },
  { family: "Noto Naskh Arabic", weight: "500" },
  { family: "Noto Naskh Arabic", weight: "600" },
];

/**
 * Waits until every font the report template could render with has
 * actually finished loading, before html2canvas rasterizes anything.
 *
 * Why this matters: `document.fonts.ready` alone only resolves once
 * fonts requested *so far* have settled — if the off-screen report node
 * was just mounted and nothing on the page yet triggered a Urdu/Arabic
 * glyph paint, the browser may not have started loading Noto Nastaliq
 * Urdu / Noto Naskh Arabic at all, and `.ready` resolves immediately
 * with those fonts still unloaded. html2canvas then rasterizes with
 * whatever fallback font is currently applied, producing the
 * disconnected/incorrectly-shaped glyphs seen in exported reports —
 * even though the *live* page looks correct once the font eventually
 * arrives.
 *
 * `document.fonts.load(...)` explicitly requests each face (a no-op if
 * already loaded/loading), and only then do we await `document.fonts.ready`.
 * Safe to call on every export — already-loaded fonts resolve
 * immediately, so this doesn't meaningfully slow down repeat downloads.
 */
async function ensureReportFontsLoaded(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  await Promise.all(
    REPORT_FONT_FACES.map(({ family, weight }) =>
      document.fonts.load(`${weight} 16px "${family}"`).catch(() => {
        // A given weight/family may not be needed by the current
        // locale's report — a failed/unnecessary load request should
        // never block the export.
      })
    )
  );
  await document.fonts.ready;
}

/**
 * Captures `node` with html2canvas, after guaranteeing every report font
 * has finished loading. Shared by ReportDownloadButtons,
 * RangeReportDownloadButtons, and PlatformReportDownloadButtons so the
 * fix lives in exactly one place.
 */
export async function captureReportNode(
  node: HTMLElement
): Promise<ReturnType<typeof html2canvasType>> {
  const [{ default: html2canvas }] = await Promise.all([
    import("html2canvas"),
    ensureReportFontsLoaded(),
  ]);
  return html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
}
