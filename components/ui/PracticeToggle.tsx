"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Completion toggle backed by daily_practice_logs. Controlled by the
 * parent (server-fetched today's data) so a page refresh always reflects
 * the database, with a pending state for instant feedback while the
 * server action commits.
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
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={completed}
      aria-label={`${label} — ${completed ? t.dashboard.status.completed : t.dashboard.status.notCompleted}`}
      disabled={isPending}
      onClick={() => startTransition(() => onToggle(!completed))}
      className={cn(
        "group flex w-full items-center justify-between gap-4 rounded-md px-2 py-3 -mx-2 transition-colors hover:bg-ivory/70",
        isPending && "opacity-60"
      )}
    >
      <span
        className={cn(
          "text-sm transition-colors",
          completed ? "text-foreground" : "text-foreground/80"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-cinematic",
          completed
            ? "border-accent bg-accent scale-100"
            : "border-foreground/25 bg-transparent group-hover:border-foreground/45"
        )}
      >
        <Check
          className={cn(
            "h-3.5 w-3.5 text-accent-foreground transition-all duration-300 ease-cinematic",
            completed ? "scale-100 opacity-100" : "scale-50 opacity-0"
          )}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
