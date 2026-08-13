"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { updatePracticeValueAction } from "@/lib/practices/actions";

/**
 * Input for quantitative practices (e.g. "Istighfar 23/30"). Supports
 * three ways to change the value, all backed by the same commit path:
 *   - the +/- buttons (unchanged, still useful for small corrections)
 *   - typing a number directly into the middle field — the fast path
 *     for high targets like 30, 100, 500, avoiding 30 taps of "+"
 *   - a one-tap "Complete" shortcut that jumps straight to target_value
 *
 * Works identically for any target_value — nothing about "30" is
 * hardcoded; the shared component is reused everywhere a quantitative
 * practice appears (Morning Adhkar, Evening Adhkar, Quran counts, etc).
 *
 * Optimistic: the displayed value updates immediately on tap/type, then
 * commits via a Server Action, which clamps to [0, target] server-side
 * regardless of what the client sent. On failure the previous value is
 * restored and a short inline error is shown.
 */
export function PracticeCounter({
  practiceItemId,
  date,
  label,
  value,
  targetValue,
}: {
  practiceItemId: string;
  date: string;
  label: string;
  value: number;
  targetValue: number;
}) {
  const { t } = useLocale();
  const [displayValue, setDisplayValue] = useState(value);
  const [inputText, setInputText] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Stay in sync if the server-fetched value changes underneath us (e.g.
  // navigating back to a re-rendered page).
  useEffect(() => {
    setDisplayValue(value);
    setInputText(String(value));
  }, [value]);

  const completed = displayValue >= targetValue;

  function commit(nextValue: number) {
    const clamped = Math.min(targetValue, Math.max(0, Math.round(nextValue)));
    const previous = displayValue;
    setDisplayValue(clamped);
    setInputText(String(clamped));
    setError(null);

    startTransition(async () => {
      try {
        await updatePracticeValueAction({ practiceItemId, date, value: clamped });
      } catch {
        setDisplayValue(previous);
        setInputText(String(previous));
        setError(t.dashboard.counterError);
      }
    });
  }

  function handleInputChange(raw: string) {
    // Digits only — no minus sign, no decimals. Empty string is allowed
    // transiently while typing/clearing the field.
    const cleaned = raw.replace(/[^0-9]/g, "");
    setInputText(cleaned);
  }

  function commitTypedValue() {
    if (inputText === "") {
      // Field left empty — restore the last known-good value rather than
      // silently committing 0.
      setInputText(String(displayValue));
      return;
    }
    commit(Number(inputText));
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md px-2 py-3 -mx-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={cn("text-sm", completed ? "text-foreground" : "text-foreground/80")}>
          {label}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label={t.dashboard.decrement}
            disabled={isPending || displayValue <= 0}
            onClick={() => commit(displayValue - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/20 text-foreground/70 transition-colors hover:border-foreground/40 disabled:opacity-30"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <label className="sr-only" htmlFor={`practice-value-${practiceItemId}`}>
            {`${label} — ${t.dashboard.enterValue}`}
          </label>
          <input
            ref={inputRef}
            id={`practice-value-${practiceItemId}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={`${label} — ${t.dashboard.enterValue}`}
            role="spinbutton"
            aria-valuemin={0}
            aria-valuemax={targetValue}
            aria-valuenow={displayValue}
            disabled={isPending}
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={commitTypedValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTypedValue();
                inputRef.current?.blur();
              }
            }}
            className="h-9 w-16 rounded-md border border-foreground/20 bg-background text-center text-sm tabular-nums font-medium focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
          />
          <span className="text-sm tabular-nums text-foreground/50">/ {targetValue}</span>

          <button
            type="button"
            aria-label={t.dashboard.increment}
            disabled={isPending || displayValue >= targetValue}
            onClick={() => commit(displayValue + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/20 text-foreground/70 transition-colors hover:border-foreground/40 disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          {completed ? (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent bg-accent transition-all duration-300 ease-cinematic"
              aria-hidden="true"
            >
              <Check className="h-4 w-4 text-accent-foreground" />
            </span>
          ) : (
            <button
              type="button"
              disabled={isPending || displayValue < targetValue}
              onClick={() => commit(displayValue)}
              aria-label={`${label} — ${t.dashboard.complete}`}
              className="flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border border-accent/40 px-3 text-xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {t.dashboard.complete}
            </button>
          )}
        </div>
      </div>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-ivory"
        role="progressbar"
        aria-valuenow={displayValue}
        aria-valuemin={0}
        aria-valuemax={targetValue}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-cinematic"
          style={{ width: `${Math.min(100, (displayValue / targetValue) * 100)}%` }}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
