"use client";

import { useState, useTransition } from "react";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { updateAdhkarTargetAction } from "@/lib/settings/adhkarActions";
import {
  MIN_ADHKAR_TARGET,
  MAX_ADHKAR_TARGET,
  type AdhkarTargetRow,
} from "@/lib/settings/adhkarShared";
import type { Locale } from "@/lib/i18n/config";

function localizedRowTitle(row: AdhkarTargetRow, locale: Locale): string {
  if (locale === "ur") return row.titleUr;
  if (locale === "ar") return row.titleAr;
  return row.titleEn;
}

/** One row: label + number input + its own save button and status, so
 * saving one adhkar's target never affects the others. */
function TargetRow({ row, locale }: { row: AdhkarTargetRow; locale: Locale }) {
  const { t } = useLocale();
  const { toast } = useToast();
  const copy = t.settingsPage.adhkarTargets;
  const label = localizedRowTitle(row, locale);

  const [value, setValue] = useState(String(row.currentTarget));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = Number(value) !== row.currentTarget;

  function handleSave() {
    const parsed = Number(value);
    if (
      !Number.isFinite(parsed) ||
      !Number.isInteger(parsed) ||
      parsed < MIN_ADHKAR_TARGET ||
      parsed > MAX_ADHKAR_TARGET
    ) {
      setStatus("error");
      setErrorMessage(
        copy.invalid
          .replace("{min}", String(MIN_ADHKAR_TARGET))
          .replace("{max}", String(MAX_ADHKAR_TARGET))
      );
      return;
    }

    setStatus("idle");
    setErrorMessage(null);
    startTransition(async () => {
      try {
        await updateAdhkarTargetAction({ practiceItemId: row.practiceItemId, targetValue: parsed });
        setStatus("saved");
        toast("success", copy.saved);
      } catch {
        setStatus("error");
        setErrorMessage(copy.error);
        toast("error", copy.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <span className="text-sm text-foreground/80">{label}</span>
      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor={`adhkar-target-${row.practiceItemId}`}>
          {`${label} — ${copy.currentTarget}`}
        </label>
        <input
          id={`adhkar-target-${row.practiceItemId}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/[^0-9]/g, ""));
            setStatus("idle");
          }}
          disabled={isPending}
          className="h-9 w-20 rounded-md border border-border bg-background text-center text-sm tabular-nums font-medium focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !dirty}
          aria-busy={isPending}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-accent/40 px-3.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
        >
          {isPending && <Spinner className="h-3.5 w-3.5" />}
          {isPending ? copy.savePending : copy.save}
        </button>
        {status === "saved" && <span className="text-xs text-accent">{copy.saved}</span>}
      </div>
      {status === "error" && errorMessage && (
        <p className="w-full text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

export function AdhkarTargetsForm({ rows }: { rows: AdhkarTargetRow[] }) {
  const { t, locale } = useLocale();
  const copy = t.settingsPage.adhkarTargets;

  const morning = rows.filter((r) => r.categoryKey === "morning_dhikr");
  const evening = rows.filter((r) => r.categoryKey === "evening_dhikr");

  if (rows.length === 0) return null;

  return (
    <Card>
      <SectionLabel>{copy.title}</SectionLabel>
      <p className="mt-2 text-sm text-foreground/60">{copy.description}</p>

      {morning.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
            {copy.morningGroup}
          </h3>
          <div className="mt-1 divide-y divide-border">
            {morning.map((row) => (
              <TargetRow key={row.practiceItemId} row={row} locale={locale} />
            ))}
          </div>
        </div>
      )}

      {evening.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
            {copy.eveningGroup}
          </h3>
          <div className="mt-1 divide-y divide-border">
            {evening.map((row) => (
              <TargetRow key={row.practiceItemId} row={row} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
