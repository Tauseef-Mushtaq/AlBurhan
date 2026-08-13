"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { setPrayerStatusAction } from "@/lib/practices/actions";
import type { PrayerStatus } from "@/lib/practices/types";

/**
 * Three-state selector for obligatory prayers: congregation / individual
 * / missed. Exactly one state is ever selected — this is a radio group,
 * not three independent toggles, so selecting one always clears any
 * other selection for the same prayer.
 *
 * Optimistic like PracticeCounter: the selection updates immediately,
 * commits via setPrayerStatusAction, and rolls back on failure.
 *
 * Communicates state through text/aria labels as well as icon + color,
 * per accessibility requirements — color/icon alone never carry the
 * meaning.
 */
export function PrayerStatusSelector({
  practiceItemId,
  date,
  label,
  status,
}: {
  practiceItemId: string;
  date: string;
  label: string;
  status: PrayerStatus;
}) {
  const { t } = useLocale();
  const [current, setCurrent] = useState<PrayerStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCurrent(status);
  }, [status]);

  function select(next: PrayerStatus) {
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    setError(null);

    startTransition(async () => {
      try {
        await setPrayerStatusAction({ practiceItemId, date, status: next });
      } catch {
        setCurrent(previous);
        setError(t.dashboard.counterError);
      }
    });
  }

  const options: {
    value: PrayerStatus;
    icon: typeof Check;
    activeClass: string;
    labelText: string;
  }[] = [
    {
      value: "congregation",
      icon: Check,
      activeClass: "border-accent bg-accent text-accent-foreground",
      labelText: t.dashboard.prayer.congregation,
    },
    {
      value: "individual",
      icon: X,
      activeClass: "border-foreground/60 bg-foreground/10 text-foreground",
      labelText: t.dashboard.prayer.individual,
    },
    {
      value: "missed",
      icon: AlertTriangle,
      activeClass: "border-red-400 bg-red-50 text-red-600",
      labelText: t.dashboard.prayer.missed,
    },
  ];

  return (
    <div className="flex flex-col gap-1.5 rounded-md px-2 py-3 -mx-2">
      <div className="flex items-center justify-between gap-4">
        <span
          className={cn(
            "text-sm",
            current === "congregation" ? "text-foreground" : "text-foreground/80"
          )}
        >
          {label}
        </span>

        <div
          role="radiogroup"
          aria-label={label}
          className="flex items-center gap-2 shrink-0"
        >
          {options.map(({ value, icon: Icon, activeClass, labelText }) => {
            const active = current === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${label} — ${labelText}`}
                disabled={isPending}
                onClick={() => select(value)}
                className={cn(
                  "flex h-9 min-w-[2.25rem] items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
                  active
                    ? activeClass
                    : "border-foreground/15 text-foreground/50 hover:border-foreground/30",
                  isPending && "opacity-60"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <span className="text-xs text-foreground/50">
        {options.find((o) => o.value === current)?.labelText}
      </span>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
