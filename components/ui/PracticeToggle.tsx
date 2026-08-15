"use client";

import { useEffect, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/components/ui/Toast";

/**
 * Completion toggle backed by daily_practice_logs. `completed` is the
 * server-fetched value; local state mirrors it optimistically so a click
 * updates instantly, then rolls back with a user-facing message if the
 * underlying Server Action (passed in as onToggle) fails — the same
 * optimistic + rollback + safe-error-message pattern used by
 * PracticeCounter and PrayerStatusSelector, which this previously lacked.
 */
export function PracticeToggle({
  label,
  completed,
  onToggle,
}: {
  label: string;
  completed: boolean;
  onToggle: (next: boolean) => Promise<void>;
}) {
  const { t } = useLocale();
  const { toast } = useToast();
  const [optimisticCompleted, setOptimisticCompleted] = useState(completed);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOptimisticCompleted(completed);
  }, [completed]);

  function handleClick() {
    const next = !optimisticCompleted;
    const previous = optimisticCompleted;
    setOptimisticCompleted(next);
    setError(null);

    startTransition(async () => {
      try {
        await onToggle(next);
      } catch {
        setOptimisticCompleted(previous);
        setError(t.dashboard.counterError);
        toast("error", t.dashboard.counterError);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={optimisticCompleted}
        aria-busy={isPending}
        aria-label={`${label} — ${optimisticCompleted ? t.dashboard.status.completed : t.dashboard.status.notCompleted}`}
        disabled={isPending}
        onClick={handleClick}
        className={cn(
          "group flex w-full items-center justify-between gap-4 rounded-md px-2 py-3 -mx-2 transition-colors hover:bg-ivory/70",
          isPending && "opacity-60"
        )}
      >
        <span
          className={cn(
            "text-sm transition-colors",
            optimisticCompleted ? "text-foreground" : "text-foreground/80"
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-cinematic",
            optimisticCompleted
              ? "border-accent bg-accent scale-100"
              : "border-foreground/25 bg-transparent group-hover:border-foreground/45"
          )}
        >
          <Check
            className={cn(
              "h-3.5 w-3.5 text-accent-foreground transition-all duration-300 ease-cinematic",
              optimisticCompleted ? "scale-100 opacity-100" : "scale-50 opacity-0"
            )}
            aria-hidden="true"
          />
        </span>
      </button>
      {error && (
        <p role="alert" className="px-2 pb-2 -mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
