import { cn } from "@/lib/utils";

/**
 * For "this failed" — a local, section-scoped failure that doesn't
 * warrant a full route error boundary (e.g. one chart's data fetch
 * failed but the rest of the page is fine). role="alert" so assistive
 * tech announces it immediately, unlike EmptyState's calmer role="status".
 * Never pass a raw error message here — only ever a pre-written, safe,
 * localized string (see the "never expose technical errors" rule
 * throughout lib/*Action files).
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  className,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-red-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-red-600/80">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex h-9 items-center rounded-md border border-red-300 px-4 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
