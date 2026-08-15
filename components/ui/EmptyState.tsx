import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * For "there is genuinely no data here" — NOT for failures. Deliberately
 * looks calmer than ErrorState (no red, no alert role) since an empty
 * history day or an empty search result is a normal, expected outcome,
 * not something wrong. role="status" + aria-live="polite" so screen
 * readers are told content finished loading into an empty result,
 * without the urgency of role="alert".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className
      )}
    >
      {Icon && <Icon className="h-6 w-6 text-foreground/30" aria-hidden="true" />}
      <p className="text-sm font-medium text-foreground/70">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground/50">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
